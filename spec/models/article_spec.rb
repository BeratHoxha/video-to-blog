require "rails_helper"

RSpec.describe Article, type: :model do
  describe "validations" do
    it "is valid with required attributes" do
      article = build(:article)
      expect(article).to be_valid
    end

    it "is valid without a user (guest article)" do
      article = build(:article, :no_user)
      expect(article).to be_valid
    end

    it "requires a status" do
      article = build(:article, status: nil)
      expect(article).not_to be_valid
    end

    it "is invalid for free users with no remaining words" do
      user = create(:user, :free, words_used_this_month: 2000, words_reset_at: Time.current)
      article = build(:article, user: user)

      expect(article).not_to be_valid
      expect(article.errors[:base]).to include("Monthly word limit reached. Upgrade to continue.")
    end

    it "is valid for paid users even when words_used_this_month is high" do
      user = create(:user, :basic, words_used_this_month: 10_000, words_reset_at: Time.current)
      article = build(:article, user: user)

      expect(article).to be_valid
    end
  end

  describe "word_count calculation" do
    it "calculates word count from HTML content on save" do
      article = create(:article, content: "<p>Hello world</p>", word_count: 0)
      article.save!
      expect(article.word_count).to eq(2)
    end

    it "strips HTML tags before counting" do
      article = create(:article, content: "<h1>Title</h1><p>One two three</p>")
      article.save!
      # "Title" + "One" "two" "three" = 4 words
      expect(article.word_count).to eq(4)
    end
  end

  describe "scopes" do
    it ".recent returns articles in descending created_at order" do
      old = create(:article, created_at: 2.days.ago)
      recent = create(:article, created_at: 1.hour.ago)
      scoped = Article.where(id: [old.id, recent.id]).recent
      expect(scoped.first).to eq(recent)
    end

    it ".for_user returns only articles for the given user" do
      user = create(:user)
      own = create(:article, user: user)
      _other = create(:article)
      expect(Article.for_user(user)).to include(own)
    end

    it ".completed returns only complete articles" do
      complete = create(:article, status: :complete)
      _processing = create(:article, :processing)
      expect(Article.completed).to include(complete)
    end
  end

  describe "#as_status_json" do
    it "omits content when processing" do
      article = build(:article, :processing)
      json = article.as_status_json
      expect(json[:content]).to be_nil
    end

    it "includes content when complete" do
      article = build(:article, content: "<p>Hello</p>")
      json = article.as_status_json
      expect(json[:content]).to eq("<p>Hello</p>")
    end
  end
end
