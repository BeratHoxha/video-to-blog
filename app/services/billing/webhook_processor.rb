# Purpose: Entry point for all Paddle webhook events after Pay has verified
# the signature. Handles idempotency via the webhook_events table, then
# dispatches to EntitlementSync or PaymentLogger. Every webhook goes through
# this pipeline — verify (done by Pay) → deduplicate → process.
module Billing
  class WebhookProcessor
    include Billing::Logging

    SUBSCRIPTION_EVENTS = %w[
      subscription.created
      subscription.updated
      subscription.canceled
      subscription.past_due
      subscription.paused
    ].freeze

    TRANSACTION_EVENTS = %w[
      transaction.completed
      transaction.payment_failed
    ].freeze

    def self.call(user:, event_type:, pay_object:)
      new(user: user, event_type: event_type, pay_object: pay_object).call
    end

    def initialize(user:, event_type:, pay_object:)
      @user = user
      @event_type = event_type
      @pay_object = pay_object
    end

    def call
      blog(:info, "Received webhook",
           event_type: @event_type,
           event_id: event_id,
           user_id: @user&.id,
           user_email: @user&.email)

      if duplicate?
        blog(:info, "Duplicate webhook — skipping",
             event_type: @event_type,
             event_id: event_id)
        return
      end

      # Wrap in a transaction so a failure in any downstream service
      # (EntitlementSync, PaymentLogger) rolls back ALL writes — including
      # any payment_transactions row already created as "success" and the
      # webhook_events dedup record. Sidekiq will then retry the job from
      # scratch with a clean slate.
      ActiveRecord::Base.transaction do
        record_event!
        dispatch
      end

      blog(:info, "Webhook processed successfully",
           event_type: @event_type,
           event_id: event_id,
           user_id: @user&.id)
    rescue StandardError => e
      blog(:error, "Webhook processing failed — transaction rolled back",
           event_type: @event_type,
           event_id: event_id,
           user_id: @user&.id,
           error: e)
      raise
    end

    private

    def duplicate?
      WebhookEvent.exists?(provider: "paddle_billing", event_id: event_id)
    end

    def record_event!
      WebhookEvent.create!(
        provider: "paddle_billing",
        event_id: event_id,
        event_type: @event_type,
        processed_at: Time.current
      )
      blog(:info, "Webhook event recorded", event_type: @event_type, event_id: event_id)
    end

    def dispatch
      if subscription_event?
        blog(:info, "Dispatching to EntitlementSync", event_type: @event_type, user_id: @user.id)
        Billing::EntitlementSync.call(
          user: @user,
          event_type: @event_type,
          pay_subscription: @pay_object
        )
      end

      return unless transaction_event?

      blog(:info, "Dispatching to PaymentLogger", event_type: @event_type, user_id: @user.id)
      Billing::PaymentLogger.call(
        user: @user,
        event_type: @event_type,
        pay_object: @pay_object
      )
    end

    def subscription_event?
      SUBSCRIPTION_EVENTS.include?(@event_type)
    end

    def transaction_event?
      TRANSACTION_EVENTS.include?(@event_type)
    end

    # Use object processor_id + event_type as a composite dedup key.
    # Pay::Subscription and Pay::Charge respond to #processor_id.
    # Raw OpenStructs (for failed transactions) respond to #id.
    def event_id
      object_id = @pay_object.respond_to?(:processor_id) ? @pay_object.processor_id : @pay_object.id
      "#{object_id}_#{@event_type}"
    end
  end
end
