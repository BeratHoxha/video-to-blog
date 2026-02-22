class AIBotService
  class AIBotLimitError < StandardError; end

  PRIMARY_MODEL = "gpt-4.1-mini".freeze
  FALLBACK_MODEL = "gpt-4o-mini".freeze

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
    OpenaiClientService.chat_with_fallback(
      primary_model: PRIMARY_MODEL,
      fallback_model: FALLBACK_MODEL,
      temperature: 0.7,
      messages: [
        { role: "system", content: system_prompt },
        { role: "user", content: user_message }
      ]
    )
  rescue OpenaiClientService::OpenAIServiceError => e
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
