require "rails_helper"

RSpec.describe Billing::CheckoutSessionBuilder do
  let(:user) { create(:user, email: "test@example.com") }

  before do
    allow(Pay::PaddleBilling).to receive(:client_token).and_return("tok_test")
  end

  describe ".call" do
    subject(:result) do
      described_class.call(user: user, plan_key: :basic_monthly)
    end

    it "returns the client_token" do
      expect(result[:client_token]).to eq("tok_test")
    end

    it "returns the user email" do
      expect(result[:email]).to eq("test@example.com")
    end

    it "returns the price_id for the selected plan" do
      expect(result[:price_id]).to eq(
        ENV.fetch("PADDLE_PRICE_BASIC_MONTHLY", "pri_basic_placeholder")
      )
    end

    it "returns the plan_key" do
      expect(result[:plan_key]).to eq("basic")
    end

    context "with an unknown plan key" do
      it "raises KeyError" do
        expect do
          described_class.call(user: user, plan_key: :unknown_plan)
        end.to raise_error(KeyError)
      end
    end
  end
end
