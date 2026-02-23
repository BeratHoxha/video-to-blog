class OpenaiClientService
  class OpenAIServiceError < StandardError; end
  class RateLimitError < OpenAIServiceError; end
  class InvalidAudioError < OpenAIServiceError; end
  class ModelUnavailableError < OpenAIServiceError; end

  MODEL_UNAVAILABLE_PATTERNS = [
    "model_not_found",
    "does not exist",
    "not available",
    "unsupported model"
  ].freeze

  INVALID_AUDIO_PATTERNS = [
    "invalid audio",
    "could not decode",
    "unsupported audio",
    "audio file"
  ].freeze

  def self.chat_with_fallback(messages:, primary_model:, fallback_model:, temperature: 0.7, max_tokens: nil)
    new.chat_with_fallback(
      messages: messages,
      primary_model: primary_model,
      fallback_model: fallback_model,
      temperature: temperature,
      max_tokens: max_tokens
    )
  end

  def self.transcribe(file_path:, model: "gpt-4o-mini-transcribe")
    new.transcribe(file_path: file_path, model: model)
  end

  def initialize(client: nil)
    @client = client || OpenAI::Client.new(
      access_token: ENV.fetch("OPENAI_API_KEY", "test-key")
    )
  end

  def chat_with_fallback(messages:, primary_model:, fallback_model:, temperature: 0.7, max_tokens: nil)
    with_model_fallback(primary_model: primary_model, fallback_model: fallback_model) do |model|
      parameters = { model: model, messages: messages, temperature: temperature }
      parameters[:max_tokens] = max_tokens if max_tokens

      response = @client.chat(parameters: parameters)

      content = response.dig("choices", 0, "message", "content")
      raise OpenAIServiceError, "OpenAI returned empty content" if content.blank?

      content
    end
  rescue Faraday::Error => e
    raise map_faraday_error(e)
  end

  def transcribe(file_path:, model: "gpt-4o-mini-transcribe")
    File.open(file_path, "rb") do |file|
      response = @client.audio.transcribe(
        parameters: { model: model, file: file }
      )

      text = response.dig("text")
      raise InvalidAudioError, "OpenAI returned empty transcript" if text.blank?

      text
    end
  rescue Faraday::Error => e
    raise map_faraday_error(e)
  end

  private

  def with_model_fallback(primary_model:, fallback_model:)
    yield(primary_model)
  rescue Faraday::Error => e
    raise e unless fallback_model.present? && fallbackable_model_error?(e)

    Rails.logger.warn(
      "OpenAI model #{primary_model} unavailable (#{error_message(e)}), " \
      "retrying with #{fallback_model}."
    )
    yield(fallback_model)
  end

  def map_faraday_error(error)
    message = error_message(error)
    status = error_status(error)

    return RateLimitError.new(message) if status == 429 || message.downcase.include?("rate limit")
    return InvalidAudioError.new(message) if invalid_audio_error?(message)
    return ModelUnavailableError.new(message) if fallbackable_model_error?(error)

    OpenAIServiceError.new(message)
  end

  def fallbackable_model_error?(error)
    message = error_message(error).downcase
    status = error_status(error)

    status == 404 ||
      (status == 400 && MODEL_UNAVAILABLE_PATTERNS.any? { |pattern| message.include?(pattern) })
  end

  def invalid_audio_error?(message)
    downcased = message.downcase
    INVALID_AUDIO_PATTERNS.any? { |pattern| downcased.include?(pattern) }
  end

  def error_status(error)
    response = error.respond_to?(:response) ? error.response : nil
    return nil unless response.is_a?(Hash)

    response[:status] || response["status"]
  end

  def error_message(error)
    response = error.respond_to?(:response) ? error.response : nil
    body = response.is_a?(Hash) ? (response[:body] || response["body"]) : nil

    parsed = parse_error_body(body)
    parsed.presence || error.message
  end

  def parse_error_body(body)
    return if body.blank?

    case body
    when Hash
      body.dig("error", "message") || body.dig(:error, :message) || body.to_s
    when String
      parsed = JSON.parse(body) rescue nil
      parsed&.dig("error", "message") || body
    else
      body.to_s
    end
  end
end

# Backward-compatible alias for existing constant usage.
OpenAIClientService = OpenaiClientService
