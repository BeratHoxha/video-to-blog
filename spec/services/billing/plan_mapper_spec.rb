require "rails_helper"

RSpec.describe Billing::PlanMapper do
  # BILLING_PLANS uses ENV.fetch with defaults — in test env these are the values
  let(:basic_price_id) { ENV.fetch("PADDLE_PRICE_BASIC_MONTHLY", "pri_basic_placeholder") }
  let(:premium_price_id) { ENV.fetch("PADDLE_PRICE_PREMIUM_MONTHLY", "pri_premium_placeholder") }

  describe ".plan_key_for" do
    subject(:map) { described_class.plan_key_for(price_id) }

    context "with the basic monthly price ID" do
      let(:price_id) { basic_price_id }

      it { is_expected.to eq(:basic) }
    end

    context "with the premium monthly price ID" do
      let(:price_id) { premium_price_id }

      it { is_expected.to eq(:premium) }
    end

    context "with an unknown price ID" do
      let(:price_id) { "pri_unknown_xyz" }

      it { is_expected.to eq(:free) }
    end

    context "with nil" do
      let(:price_id) { nil }

      it { is_expected.to eq(:free) }
    end
  end
end
