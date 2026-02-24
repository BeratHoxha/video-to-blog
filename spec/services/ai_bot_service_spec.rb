require "rails_helper"

RSpec.describe AIBotService do
  let(:user) do
    create(:user, :free, ai_bot_calls_this_week: 3,
                         ai_bot_calls_reset_at: Time.current)
  end
  let(:selection) { "This is the selected text." }
  let(:prompt) { "Make it more professional" }

  before do
    allow(OpenaiClientService)
      .to receive(:chat_with_fallback)
      .and_return("This is the professional text.")
  end

  describe ".call" do
    it "returns rewritten text" do
      result = described_class.call(selection: selection, prompt: prompt, user: user)
      expect(result).to eq("This is the professional text.")
    end

    it "uses mini model for rewrites with fallback" do
      described_class.call(selection: selection, prompt: prompt, user: user)

      expect(OpenaiClientService).to have_received(:chat_with_fallback).with(
        hash_including(
          primary_model: "gpt-4.1-mini",
          fallback_model: "gpt-4o-mini"
        )
      )
    end

    it "increments the user's ai_bot_calls_this_week" do
      expect do
        described_class.call(selection: selection, prompt: prompt, user: user)
      end.to change { user.reload.ai_bot_calls_this_week }.by(1)
    end

    it "raises AIBotLimitError when user is at limit" do
      limit_user = create(:user, :at_ai_bot_limit)
      expect do
        described_class.call(selection: selection, prompt: prompt, user: limit_user)
      end.to raise_error(AIBotService::AIBotLimitError)
    end

    it "does not increment counter when limit is reached" do
      limit_user = create(:user, :at_ai_bot_limit)
      begin
        described_class.call(selection: selection, prompt: prompt, user: limit_user)
      rescue AIBotService::AIBotLimitError
        nil
      end
      expect(limit_user.reload.ai_bot_calls_this_week).to eq(10)
    end
  end
end
