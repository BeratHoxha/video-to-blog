require "rails_helper"

RSpec.describe Billing::SubscriptionManager do
  let(:user) { create(:user, :basic) }

  let(:pay_subscription) do
    double("Pay::Subscription", active?: true, cancel: true, swap: true)
  end

  let(:payment_processor) do
    double("payment_processor", subscription: pay_subscription)
  end

  before do
    allow(user).to receive(:payment_processor).and_return(payment_processor)
  end

  describe ".cancel" do
    it "cancels the subscription at period end" do
      described_class.cancel(user: user)
      expect(pay_subscription).to have_received(:cancel)
    end

    context "when there is no active subscription" do
      before { allow(pay_subscription).to receive(:active?).and_return(false) }

      it "raises NoActiveSubscriptionError" do
        expect { described_class.cancel(user: user) }.to raise_error(
          Billing::SubscriptionManager::NoActiveSubscriptionError
        )
      end
    end
  end

  describe ".change_plan" do
    let(:premium_price_id) do
      ENV.fetch("PADDLE_PRICE_PREMIUM_MONTHLY", "pri_premium_placeholder")
    end

    it "swaps the subscription to the new plan price" do
      described_class.change_plan(user: user, plan_key: :premium_monthly)
      expect(pay_subscription).to have_received(:swap).with(premium_price_id)
    end

    context "with an invalid plan key" do
      it "raises KeyError" do
        expect { described_class.change_plan(user: user, plan_key: :unknown) }
          .to raise_error(KeyError)
      end
    end
  end
end
