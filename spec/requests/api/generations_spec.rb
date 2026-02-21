require "rails_helper"

RSpec.describe "Api::Generations", type: :request do
  describe "POST /api/generations" do
    context "with a source URL" do
      before { allow(ArticleGenerationJob).to receive(:perform_later) }

      it "returns 201 with article_id and processing status" do
        post "/api/generations", params: { source_url: "https://youtube.com/watch?v=abc" }
        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json["status"]).to eq("processing")
        expect(json["article_id"]).to be_present
      end

      it "enqueues ArticleGenerationJob" do
        expect(ArticleGenerationJob).to receive(:perform_later)
        post "/api/generations", params: { source_url: "https://youtube.com/watch?v=abc" }
      end
    end

    context "without source URL or file" do
      it "returns 422" do
        post "/api/generations", params: {}
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    context "when authenticated as free user" do
      let(:user) { create(:user, :free) }

      before do
        sign_in user
        allow(ArticleGenerationJob).to receive(:perform_later)
      end

      it "creates article and enqueues job with free tier" do
        expect(ArticleGenerationJob).to receive(:perform_later).with(anything, user_tier: "free")
        post "/api/generations", params: { source_url: "https://youtube.com/watch?v=abc" }
        expect(response).to have_http_status(:created)
      end
    end
  end

  describe "GET /api/articles/:id/status" do
    let(:article) { create(:article, :processing) }

    it "returns processing status without content" do
      get "/api/articles/#{article.id}/status"
      json = JSON.parse(response.body)
      expect(json["status"]).to eq("processing")
      expect(json["content"]).to be_nil
    end

    context "when article is complete" do
      let(:article) { create(:article, status: :complete, content: "<p>Done</p>") }

      it "returns complete status with content" do
        get "/api/articles/#{article.id}/status"
        json = JSON.parse(response.body)
        expect(json["status"]).to eq("complete")
        expect(json["content"]).to eq("<p>Done</p>")
      end
    end
  end
end
