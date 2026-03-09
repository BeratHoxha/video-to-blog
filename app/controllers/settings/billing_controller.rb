module Settings
  class BillingController < ApplicationController
    protect_from_forgery with: :null_session
    before_action :authenticate_user_api!

    # GET /settings/billing
    # Returns current plan, status, expiry, and last 10 payment transactions.
    def show
      render json: billing_info
    end

    private

    def billing_info
      {
        plan: current_user.plan,
        plan_status: current_user.plan_status,
        plan_expires_at: current_user.plan_expires_at,
        entitlements: entitlements_json,
        payment_transactions: recent_transactions,
        available_plans: available_plans
      }
    end

    def entitlements_json
      manager = Billing::EntitlementManager.new(current_user)
      {
        active: manager.active?,
        premium: manager.premium?,
        basic_or_higher: manager.basic_or_higher?,
        word_count_limit: manager.word_count_limit,
        ai_bot_limit: manager.ai_bot_limit
      }
    end

    def recent_transactions
      current_user.payment_transactions
                  .order(created_at: :desc)
                  .limit(10)
                  .map do |txn|
                    {
                      id: txn.id,
                      paddle_transaction_id: txn.paddle_transaction_id,
                      plan_key: txn.plan_key,
                      amount_cents: txn.amount_cents,
                      currency: txn.currency,
                      status: txn.status,
                      failure_reason: txn.failure_reason,
                      paid_at: txn.paid_at,
                      created_at: txn.created_at
                    }
      end
    end

    def available_plans
      BILLING_PLANS.map do |key, plan|
        {
          key: key,
          name: plan[:key].capitalize,
          price_id: plan[:price_id],
          amount_cents: plan[:amount_cents],
          currency: plan[:currency],
          interval: plan[:interval]
        }
      end
    end
  end
end
