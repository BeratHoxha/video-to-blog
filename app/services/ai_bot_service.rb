class AIBotService
  class AIBotLimitError < StandardError; end

  def self.call(selection:, prompt:, user:)
    new(selection: selection, prompt: prompt, user: user).call
  end

  def initialize(selection:, prompt:, user:)
    @selection = selection
    @prompt = prompt
    @user = user
  end

  def call
    raise AIBotLimitError, "Weekly AI rewrite limit reached" \
      if @user.ai_bot_limit_reached?

    result = rewrite_with_openai
    @user.increment_ai_bot_calls!
    result
  end

  private

  def rewrite_with_openai
    client = OpenAI::Client.new(access_token: ENV.fetch("OPENAI_API_KEY", "test-key"))

    response = client.chat(
      parameters: {
        model: "gpt-4o",
        messages: [
          { role: "system", content: system_prompt },
          { role: "user", content: user_message }
        ],
        temperature: 0.7
      }
    )

    content = response.dig("choices", 0, "message", "content")
    raise "OpenAI returned empty content" if content.blank?

    content
  rescue Faraday::Error => e
    raise "AI Bot API error: #{e.message}"
  end

  def system_prompt
    <<~PROMPT
      You are an expert editor and co-writer. The user has selected a passage
      from their article and wants you to rewrite or improve it based on their
      instruction. Return only the rewritten passage — no explanations,
      no preamble, no markdown formatting. Return plain HTML if the original
      contains HTML tags, otherwise return plain text.
    PROMPT
  end

  def user_message
    "Selected text:\n#{@selection}\n\nInstruction: #{@prompt}"
  end
end
