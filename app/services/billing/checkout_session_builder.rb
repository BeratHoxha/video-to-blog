# Purpose: Prepares everything the frontend needs to open a Paddle Checkout
# overlay. Returns client_token, price_id, and the user's email so the
# frontend can pass it directly to Paddle.js — Paddle will match or create
# the customer on their end, avoiding a server-side customer pre-creation.
module Billing
  class CheckoutSessionBuilder
    include Billing::Logging

    def self.call(user:, plan_key:)
      new(user: user, plan_key: plan_key).call
    end

    def initialize(user:, plan_key:)
      @user = user
      @plan_key = plan_key.to_sym
    end

    def call
      blog(:info, "Building checkout session",
           user_id: @user.id, user_email: @user.email, plan_key: @plan_key)

      plan = BILLING_PLANS.fetch(@plan_key)

      result = {
        client_token: Pay::PaddleBilling.client_token,
        environment: Pay::PaddleBilling.environment,
        email: @user.email,
        price_id: plan[:price_id],
        plan_key: plan[:key]
      }

      blog(:info, "Checkout session built",
           user_id: @user.id,
           plan_key: @plan_key,
           price_id: result[:price_id],
           environment: result[:environment])

      result
    rescue KeyError => e
      blog(:error, "Unknown plan key — checkout aborted",
           user_id: @user.id, plan_key: @plan_key, error: e)
      raise
    rescue StandardError => e
      blog(:error, "Checkout session build failed",
           user_id: @user.id, plan_key: @plan_key, error: e)
      raise
    end
  end
end
