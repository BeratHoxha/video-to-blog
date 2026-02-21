require "rails_helper"

RSpec.describe "Api::AiBot", type: :request do
  describe "POST /api/ai_bot" do
    context "when unauthenticated" do
      it "returns 401" do
        post "/api/ai_bot", params: { selection: "text", prompt: "rewrite" }
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when authenticated as free user under limit" do
      let(:user) { create(:user, :free, ai_bot_calls_this_week: 3,
                                         ai_bot_calls_reset_at: Time.current) }

      before do
        sign_in user
        stub_request(:post, /api\.openai\.com/)
          .to_return(
            body: { choices: [{ message: { content: "Rewritten text" } }] }.to_json,
            status: 200,
            headers: { "Content-Type" => "application/json" }
          )
      end

      it "returns 200 with rewritten text" do
        post "/api/ai_bot", params: { selection: "original", prompt: "make professional" }
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["result"]).to eq("Rewritten text")
      end
    end

    context "when free user is at limit" do
      let(:user) { create(:user, :at_ai_bot_limit) }

      before { sign_in user }

      it "returns 403 with upgrade message" do
        post "/api/ai_bot", params: { selection: "text", prompt: "rewrite" }
        expect(response).to have_http_status(:forbidden)
        json = JSON.parse(response.body)
        expect(json["upgrade_required"]).to be true
      end
    end

    context "when authenticated as basic user" do
      let(:user) { create(:user, :basic) }

      before do
        sign_in user
        stub_request(:post, /api\.openai\.com/)
          .to_return(
            body: { choices: [{ message: { content: "Done" } }] }.to_json,
            status: 200,
            headers: { "Content-Type" => "application/json" }
          )
      end

      it "always returns 200" do
        post "/api/ai_bot", params: { selection: "text", prompt: "rewrite" }
        expect(response).to have_http_status(:ok)
      end
    end
  end
end
