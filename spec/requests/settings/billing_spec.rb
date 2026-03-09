require "rails_helper"

RSpec.describe "Settings::Billing", type: :request do
  describe "GET /settings/billing" do
    context "when authenticated" do
      let(:user) { create(:user, :basic) }

      before do
        create(:payment_transaction, user: user)
        create(:payment_transaction, :failed, user: user)
        sign_in user
      end

      it "returns 200" do
        get "/settings/billing"
        expect(response).to have_http_status(:ok)
      end

      it "returns plan, status, and entitlements" do
        get "/settings/billing"
        json = response.parsed_body

        expect(json["plan"]).to eq("basic")
        expect(json["plan_status"]).to eq("active")
        expect(json["entitlements"]["basic_or_higher"]).to be true
        expect(json["entitlements"]["word_count_limit"]).to be_nil
      end

      it "returns the last 10 payment transactions" do
        get "/settings/billing"
        json = response.parsed_body

        expect(json["payment_transactions"].length).to eq(2)
        expect(json["payment_transactions"].first).to include("paddle_transaction_id", "status")
      end

      it "returns available plans" do
        get "/settings/billing"
        json = response.parsed_body

        expect(json["available_plans"].map { |p| p["key"] })
          .to include("basic_monthly", "premium_monthly")
      end
    end

    context "when unauthenticated" do
      it "returns 401" do
        get "/settings/billing"
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
