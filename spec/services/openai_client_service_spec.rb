require "rails_helper"

RSpec.describe OpenaiClientService do
  describe "#chat_with_fallback" do
    let(:client) { instance_double(OpenAI::Client) }
    let(:service) { described_class.new(client: client) }
    let(:messages) { [{ role: "user", content: "hello" }] }

    it "falls back when primary model is unavailable" do
      primary_error = Faraday::BadRequestError.new(
        "bad request",
        { status: 400, body: { error: { message: "model_not_found" } } }
      )

      expect(client).to receive(:chat).ordered.and_raise(primary_error)
      expect(client).to receive(:chat).ordered.and_return(
        { "choices" => [{ "message" => { "content" => "ok" } }] }
      )

      result = service.chat_with_fallback(
        messages: messages,
        primary_model: "gpt-4.1",
        fallback_model: "gpt-4o"
      )

      expect(result).to eq("ok")
    end
  end

  describe "#transcribe" do
    let(:audio_client) { double("audio_client") }
    let(:client) { instance_double(OpenAI::Client, audio: audio_client) }
    let(:service) { described_class.new(client: client) }

    it "raises RateLimitError for 429 responses" do
      file = Tempfile.new(["audio", ".mp3"])
      file.write("audio-bytes")
      file.rewind

      rate_limit_error = Faraday::TooManyRequestsError.new(
        "too many requests",
        { status: 429, body: { error: { message: "Rate limit exceeded" } } }
      )
      allow(audio_client).to receive(:transcribe).and_raise(rate_limit_error)

      expect {
        service.transcribe(file_path: file.path)
      }.to raise_error(OpenaiClientService::RateLimitError)

      file.close
      file.unlink
    end
  end
end
