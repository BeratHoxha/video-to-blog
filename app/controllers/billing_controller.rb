class BillingController < ApplicationController
  protect_from_forgery with: :null_session
  before_action :authenticate_user_api!

  # POST /billing/checkout
  # Returns the params needed for the frontend to open a Paddle overlay checkout.
  def checkout
    plan_key = params.require(:plan)
    result = Billing::CheckoutSessionBuilder.call(
      user: current_user,
      plan_key: plan_key
    )
    render json: result
  rescue KeyError
    render json: { error: "Invalid plan" }, status: :unprocessable_entity
  end

  # POST /billing/change_plan
  # Triggers a plan upgrade or downgrade via Paddle's API.
  def change_plan
    plan_key = params.require(:plan)
    Billing::SubscriptionManager.change_plan(
      user: current_user,
      plan_key: plan_key
    )
    render json: { message: "Plan change initiated" }
  rescue KeyError
    render json: { error: "Invalid plan" }, status: :unprocessable_entity
  rescue Billing::SubscriptionManager::NoActiveSubscriptionError
    render json: { error: "No active subscription" },
           status: :unprocessable_entity
  end

  # POST /billing/cancel
  # Cancels the user's subscription at period end.
  def cancel
    Billing::SubscriptionManager.cancel(user: current_user)
    render json: { message: "Subscription will cancel at period end" }
  rescue Billing::SubscriptionManager::NoActiveSubscriptionError
    render json: { error: "No active subscription" },
           status: :unprocessable_entity
  end
end
