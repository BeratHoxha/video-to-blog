# Purpose: Translates Paddle's external price IDs into internal plan keys.
# Paddle IDs never leak into business logic — only this class needs updating
# when Paddle IDs change.
module Billing
  class PlanMapper
    def self.plan_key_for(price_id)
      return :free if price_id.blank?

      plan = BILLING_PLANS.values.find { |p| p[:price_id] == price_id.to_s }
      plan ? plan[:key].to_sym : :free
    end

    def self.price_id_for(plan_key)
      BILLING_PLANS.values.find { |p| p[:key] == plan_key.to_s }&.dig(:price_id)
    end
  end
end
