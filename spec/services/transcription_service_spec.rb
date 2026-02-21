require "rails_helper"

RSpec.describe TranscriptionService do
  let(:youtube_url) { "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
  let(:non_youtube_url) { "https://example.com/video.mp4" }

  describe ".call" do
    context "with a valid YouTube URL" do
      let(:transcript_response) do
        {
          "events" => [
            { "segs" => [{ "utf8" => "Hello " }] },
            { "segs" => [{ "utf8" => "world" }] }
          ]
        }.to_json
      end

      before do
        stub_request(:get, /youtube\.com\/api\/timedtext/)
          .to_return(body: transcript_response, status: 200)
      end

      it "returns a transcript string" do
        result = described_class.call(source_url: youtube_url)
        expect(result).to include("Hello")
      end
    end

    context "when YouTube transcript is unavailable" do
      before do
        stub_request(:get, /youtube\.com\/api\/timedtext/)
          .to_raise(OpenURI::HTTPError.new("404", nil))
        stub_request(:post, /api\.openai\.com/)
          .to_return(
            body: { text: "Whisper transcript" }.to_json,
            status: 200
          )
      end

      it "falls back to Whisper" do
        expect(described_class.call(source_url: youtube_url)).to eq("Whisper transcript")
      end
    end

    context "with no source provided" do
      it "raises TranscriptionError" do
        expect {
          described_class.call
        }.to raise_error(TranscriptionService::TranscriptionError, /No source/)
      end
    end
  end
end
