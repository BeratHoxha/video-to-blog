require "rails_helper"

RSpec.describe "Billing", type: :request do
  let(:user) { create(:user, :basic) }

  describe "POST /billing/checkout" do
    context "when authenticated" do
      before { sign_in user }

      it "returns 200 with checkout params for a valid plan" do
        allow(Billing::CheckoutSessionBuilder).to receive(:call).and_return(
          client_token: "tok_test",
          customer_id: "ctm_123",
          price_id: "pri_basic_placeholder",
          plan_key: "basic"
        )

        post "/billing/checkout", params: { plan: "basic_monthly" }

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["client_token"]).to eq("tok_test")
        expect(json["customer_id"]).to eq("ctm_123")
      end

      it "returns 422 for an invalid plan" do
        post "/billing/checkout", params: { plan: "nonexistent_plan" }
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    context "when unauthenticated" do
      it "returns 401" do
        post "/billing/checkout", params: { plan: "basic_monthly" }
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "POST /billing/change_plan" do
    context "when authenticated" do
      before { sign_in user }

      it "returns 200 when the plan change succeeds" do
        allow(Billing::SubscriptionManager).to receive(:change_plan)
        post "/billing/change_plan", params: { plan: "premium_monthly" }
        expect(response).to have_http_status(:ok)
      end

      it "returns 422 when there is no active subscription" do
        allow(Billing::SubscriptionManager).to receive(:change_plan)
          .and_raise(Billing::SubscriptionManager::NoActiveSubscriptionError)

        post "/billing/change_plan", params: { plan: "premium_monthly" }
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    context "when unauthenticated" do
      it "returns 401" do
        post "/billing/change_plan", params: { plan: "premium_monthly" }
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "POST /billing/cancel" do
    context "when authenticated" do
      before { sign_in user }

      it "returns 200 when cancel succeeds" do
        allow(Billing::SubscriptionManager).to receive(:cancel)
        post "/billing/cancel"
        expect(response).to have_http_status(:ok)
      end

      it "returns 422 when there is no active subscription" do
        allow(Billing::SubscriptionManager).to receive(:cancel)
          .and_raise(Billing::SubscriptionManager::NoActiveSubscriptionError)

        post "/billing/cancel"
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    context "when unauthenticated" do
      it "returns 401" do
        post "/billing/cancel"
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
