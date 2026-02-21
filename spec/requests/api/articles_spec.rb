require "rails_helper"

RSpec.describe "Api::Articles", type: :request do
  describe "GET /api/articles" do
    context "when unauthenticated" do
      it "returns 401" do
        get "/api/articles"
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when authenticated" do
      let(:user) { create(:user) }
      let(:other_user) { create(:user) }

      before do
        sign_in user
        create(:article, user: user, title: "My Article")
        create(:article, user: other_user, title: "Other Article")
      end

      it "returns only the current user's articles" do
        get "/api/articles"
        json = JSON.parse(response.body)
        titles = json["articles"].map { |a| a["title"] }
        expect(titles).to include("My Article")
        expect(titles).not_to include("Other Article")
      end
    end
  end

  describe "GET /api/articles/:id" do
    let(:article) { create(:article) }

    it "returns article data" do
      get "/api/articles/#{article.id}"
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["article"]["id"]).to eq(article.id)
    end

    it "returns 404 for non-existent article" do
      get "/api/articles/999999"
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "DELETE /api/articles/:id" do
    context "when unauthenticated" do
      it "returns 401" do
        article = create(:article)
        delete "/api/articles/#{article.id}"
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when authenticated as article owner" do
      let(:user) { create(:user) }
      let(:article) { create(:article, user: user) }

      before { sign_in user }

      it "deletes the article and returns 204" do
        delete "/api/articles/#{article.id}"
        expect(response).to have_http_status(:no_content)
        expect(Article.find_by(id: article.id)).to be_nil
      end
    end
  end
end
