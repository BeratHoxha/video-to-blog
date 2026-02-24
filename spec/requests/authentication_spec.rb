require "rails_helper"

RSpec.describe "Authentication", type: :request do
  describe "POST /users/sign_in" do
    it "returns field errors for blank credentials in JSON mode" do
      post user_session_path,
           params: { user: { email: "", password: "" } },
           headers: { "ACCEPT" => "application/json" },
           as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      body = response.parsed_body
      expect(body.dig("errors", "email")).to include("can't be blank")
      expect(body.dig("errors", "password")).to include("can't be blank")
    end

    it "returns form-level error for invalid credentials in JSON mode" do
      post user_session_path,
           params: { user: { email: "wrong@example.com", password: "bad-password" } },
           headers: { "ACCEPT" => "application/json" },
           as: :json

      expect(response).to have_http_status(:unauthorized)
      body = response.parsed_body
      expect(body.dig("errors", "base")).to be_present
    end

    it "returns redirect URL on successful sign in in JSON mode" do
      user = create(:user, email: "user@example.com", password: "password123")

      post user_session_path,
           params: { user: { email: user.email, password: "password123" } },
           headers: { "ACCEPT" => "application/json" },
           as: :json

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["redirect_url"]).to be_present
    end
  end

  describe "POST /users" do
    it "returns field errors for invalid sign up in JSON mode" do
      post user_registration_path,
           params: { user: { email: "", password: "short", password_confirmation: "mismatch" } },
           headers: { "ACCEPT" => "application/json" },
           as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      body = response.parsed_body
      expect(body.dig("errors", "email")).to be_present
      expect(body.dig("errors", "password")).to be_present
      expect(body.dig("errors", "password_confirmation")).to be_present
    end
  end
end
