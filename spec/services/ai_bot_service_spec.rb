require "rails_helper"

RSpec.describe AIBotService do
  let(:user) { create(:user, :free, ai_bot_calls_this_week: 3,
                                      ai_bot_calls_reset_at: Time.current) }
  let(:selection) { "This is the selected text." }
  let(:prompt) { "Make it more professional" }

  before do
    stub_request(:post, /api\.openai\.com/)
      .to_return(
        body: {
          choices: [{ message: { content: "This is the professional text." } }]
        }.to_json,
        status: 200,
        headers: { "Content-Type" => "application/json" }
      )
  end

  describe ".call" do
    it "returns rewritten text" do
      result = described_class.call(selection: selection, prompt: prompt, user: user)
      expect(result).to eq("This is the professional text.")
    end

    it "increments the user's ai_bot_calls_this_week" do
      expect {
        described_class.call(selection: selection, prompt: prompt, user: user)
      }.to change { user.reload.ai_bot_calls_this_week }.by(1)
    end

    it "raises AIBotLimitError when user is at limit" do
      limit_user = create(:user, :at_ai_bot_limit)
      expect {
        described_class.call(selection: selection, prompt: prompt, user: limit_user)
      }.to raise_error(AIBotService::AIBotLimitError)
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
