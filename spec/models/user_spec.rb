require "rails_helper"

RSpec.describe User, type: :model do
  describe "#ai_bot_calls_remaining" do
    it "returns remaining calls for a free user" do
      user = build(:user, :free, ai_bot_calls_this_week: 4,
                                  ai_bot_calls_reset_at: Time.current)
      expect(user.ai_bot_calls_remaining).to eq(6)
    end

    it "returns nil for a basic user" do
      user = build(:user, :basic)
      expect(user.ai_bot_calls_remaining).to be_nil
    end

    it "returns nil for a premium user" do
      user = build(:user, :premium)
      expect(user.ai_bot_calls_remaining).to be_nil
    end
  end

  describe "#ai_bot_limit_reached?" do
    it "returns true when free user has used all calls" do
      user = build(:user, :at_ai_bot_limit)
      expect(user.ai_bot_limit_reached?).to be true
    end

    it "returns false when free user has calls remaining" do
      user = build(:user, :free, ai_bot_calls_this_week: 5,
                                  ai_bot_calls_reset_at: Time.current)
      expect(user.ai_bot_limit_reached?).to be false
    end

    it "returns false for basic users regardless of count" do
      user = build(:user, :basic, ai_bot_calls_this_week: 999)
      expect(user.ai_bot_limit_reached?).to be false
    end
  end

  describe "#words_remaining" do
    it "returns remaining words for a free user" do
      user = build(:user, :free, words_used_this_month: 500,
                                  words_reset_at: Time.current)
      expect(user.words_remaining).to eq(1500)
    end

    it "returns nil for basic users" do
      user = build(:user, :basic)
      expect(user.words_remaining).to be_nil
    end

    it "returns nil for premium users" do
      user = build(:user, :premium)
      expect(user.words_remaining).to be_nil
    end
  end

  describe "#reset_ai_bot_calls_if_needed!" do
    it "resets counter when more than a week has passed" do
      user = create(:user, :free, ai_bot_calls_this_week: 8,
                                   ai_bot_calls_reset_at: 2.weeks.ago)
      user.reset_ai_bot_calls_if_needed!
      expect(user.reload.ai_bot_calls_this_week).to eq(0)
    end

    it "does not reset when reset happened this week" do
      user = create(:user, :free, ai_bot_calls_this_week: 8,
                                   ai_bot_calls_reset_at: 2.days.ago)
      user.reset_ai_bot_calls_if_needed!
      expect(user.reload.ai_bot_calls_this_week).to eq(8)
    end
  end

  describe "#reset_words_if_needed!" do
    it "resets counter when more than a month has passed" do
      user = create(:user, :free, words_used_this_month: 1500,
                                   words_reset_at: 2.months.ago)
      user.reset_words_if_needed!
      expect(user.reload.words_used_this_month).to eq(0)
    end

    it "does not reset within the same month" do
      user = create(:user, :free, words_used_this_month: 1500,
                                   words_reset_at: 5.days.ago)
      user.reset_words_if_needed!
      expect(user.reload.words_used_this_month).to eq(1500)
    end
  end
end
