# Purpose: Executes subscription lifecycle actions (upgrade, downgrade, cancel)
# against Paddle via the pay gem. Enforces one-subscription-per-user and the
# downgrade-at-period-end / cancel-at-period-end policies. Keeps lifecycle
# business rules out of controllers.
module Billing
  class SubscriptionManager
    include Billing::Logging

    class AlreadySubscribedError < StandardError; end
    class NoActiveSubscriptionError < StandardError; end

    def self.change_plan(user:, plan_key:)
      new(user).change_plan(plan_key)
    end

    def self.cancel(user:)
      new(user).cancel
    end

    def initialize(user)
      @user = user
    end

    def change_plan(plan_key)
      blog(:info, "Changing plan",
           user_id: @user.id, user_email: @user.email, plan_key: plan_key)

      raise NoActiveSubscriptionError unless active_subscription

      plan = BILLING_PLANS.fetch(plan_key.to_sym)

      blog(:info, "Swapping subscription",
           user_id: @user.id, price_id: plan[:price_id], plan_key: plan_key)

      active_subscription.swap(plan[:price_id])

      blog(:info, "Plan changed successfully",
           user_id: @user.id, plan_key: plan_key)
    rescue NoActiveSubscriptionError
      blog(:warn, "Change plan failed — no active subscription",
           user_id: @user.id, plan_key: plan_key)
      raise
    rescue StandardError => e
      blog(:error, "Change plan failed",
           user_id: @user.id, plan_key: plan_key, error: e)
      raise
    end

    def cancel
      blog(:info, "Canceling subscription",
           user_id: @user.id, user_email: @user.email)

      raise NoActiveSubscriptionError unless active_subscription

      active_subscription.cancel

      blog(:info, "Subscription canceled successfully", user_id: @user.id)
    rescue NoActiveSubscriptionError
      blog(:warn, "Cancel failed — no active subscription", user_id: @user.id)
      raise
    rescue StandardError => e
      blog(:error, "Subscription cancel failed", user_id: @user.id, error: e)
      raise
    end

    private

    def active_subscription
      @active_subscription ||=
        @user.payment_processor&.subscription&.active? &&
        @user.payment_processor.subscription
    end
  end
end
