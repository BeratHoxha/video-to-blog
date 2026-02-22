require "rails_helper"

RSpec.describe ArticleGenerationJob do
  describe "#perform" do
    let(:generated_content) do
      "<h1>Title</h1><p>This is a generated article with several words.</p>"
    end

    before do
      allow(TranscriptionService)
        .to receive(:call)
        .and_return("Transcript text")
      allow(ArticleGenerationService)
        .to receive(:call)
        .and_return(generated_content)
    end

    it "increments monthly words used for free users" do
      user = create(:user, :free, words_used_this_month: 0)
      article = create(:article, :processing, user: user, source_type: :url)

      described_class.perform_now(article.id, user_tier: "free")

      article.reload
      user.reload

      expect(article).to be_complete
      expect(user.words_used_this_month).to eq(article.word_count)
    end

    it "does not increment monthly words for paid users" do
      user = create(:user, :basic, words_used_this_month: 0)
      article = create(:article, :processing, user: user, source_type: :url)

      described_class.perform_now(article.id, user_tier: "basic")

      expect(user.reload.words_used_this_month).to eq(0)
    end
  end
end
