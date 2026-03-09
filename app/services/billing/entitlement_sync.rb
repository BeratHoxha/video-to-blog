# Purpose: Applies billing state changes to the local User record (plan,
# plan_status, plan_expires_at) after a verified webhook event. All
# entitlement mutations happen in one place, with audit logging.
module Billing
  class EntitlementSync
    include Billing::Logging

    def self.call(user:, event_type:, pay_subscription:)
      new(user: user, event_type: event_type,
          pay_subscription: pay_subscription).call
    end

    def initialize(user:, event_type:, pay_subscription:)
      @user = user
      @event_type = event_type
      @pay_subscription = pay_subscription
    end

    def call
      old_plan   = @user.plan
      old_status = @user.plan_status

      log_sync_start(old_plan, old_status)
      apply_event
      log_transition(old_plan: old_plan, old_status: old_status)
      log_sync_complete
    rescue StandardError => e
      blog(:error, "Entitlement sync failed",
           event_type: @event_type,
           user_id: @user.id,
           subscription_id: @pay_subscription&.processor_id,
           error: e)
      raise
    end

    private

    def apply_event
      case @event_type
      when "subscription.created"
        sync_created
      when "subscription.updated", "subscription.activated",
           "subscription.resumed", "subscription.trialing"
        sync_updated
      when "subscription.canceled"
        sync_canceled
      when "subscription.past_due"
        sync_past_due
      when "subscription.paused"
        sync_paused
      end
    end

    def log_sync_start(old_plan, old_status)
      blog(:info, "Syncing entitlements",
           event_type: @event_type,
           user_id: @user.id,
           current_plan: old_plan,
           current_status: old_status,
           subscription_id: @pay_subscription.processor_id,
           subscription_status: @pay_subscription.status)
    end

    def log_sync_complete
      blog(:info, "Entitlement sync complete",
           event_type: @event_type,
           user_id: @user.id,
           new_plan: @user.plan,
           new_status: @user.plan_status,
           expires_at: @user.plan_expires_at)
    end

    def sync_created
      if billable_status?
        blog(:info, "Applying subscription.created",
             user_id: @user.id, resolved_plan: resolved_plan,
             resolved_status: resolved_status)
        @user.update!(
          plan: resolved_plan,
          plan_status: resolved_status,
          plan_expires_at: nil
        )
      else
        blog(:info, "Applying subscription.created (payment pending/failed)",
             user_id: @user.id, resolved_status: resolved_status)
        @user.update!(plan_status: resolved_status)
      end
    end

    def sync_updated
      if billable_status?
        blog(:info, "Applying subscription.updated",
             user_id: @user.id, resolved_plan: resolved_plan,
             resolved_status: resolved_status, ends_at: ends_at)
        @user.update!(
          plan: resolved_plan,
          plan_status: resolved_status,
          plan_expires_at: ends_at
        )
      else
        blog(:info, "Applying subscription.updated (non-billable status)",
             user_id: @user.id, resolved_status: resolved_status)
        @user.update!(plan_status: resolved_status, plan_expires_at: ends_at)
      end
    end

    def sync_canceled
      if ends_at.present?
        blog(:info, "Applying subscription.canceled (period end)",
             user_id: @user.id, access_until: ends_at)
        @user.update!(plan_status: :active, plan_expires_at: ends_at)
      else
        blog(:info, "Applying subscription.canceled (immediate)",
             user_id: @user.id)
        @user.update!(plan_status: :canceled, plan_expires_at: Time.current)
      end
    end

    def sync_past_due
      blog(:info, "Applying subscription.past_due", user_id: @user.id)
      @user.update!(plan_status: :past_due)
    end

    def sync_paused
      blog(:info, "Applying subscription.paused", user_id: @user.id)
      @user.update!(plan_status: :inactive)
    end

    def billable_status?
      resolved_status.in?(%i[active trialing])
    end

    def resolved_plan
      price_id = @pay_subscription.processor_plan
      blog(:info, "Resolving plan from price_id", price_id: price_id)
      Billing::PlanMapper.plan_key_for(price_id)
    end

    def resolved_status
      case @pay_subscription.status
      when "trialing" then :trialing
      when "active"   then :active
      when "past_due" then :past_due
      else :inactive
      end
    end

    def ends_at
      @pay_subscription.ends_at
    end

    def log_transition(old_plan:, old_status:)
      Billing::AuditLogger.log(
        user: @user,
        event_type: @event_type,
        old_plan: old_plan,
        new_plan: @user.plan,
        old_status: old_status,
        new_status: @user.plan_status,
        paddle_id: @pay_subscription.processor_id
      )
    end
  end
end
