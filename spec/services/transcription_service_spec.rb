require "rails_helper"

RSpec.describe TranscriptionService do
  let(:youtube_url) { "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }

  describe ".call" do
    context "with a YouTube URL" do
      before do
        allow_any_instance_of(described_class)
          .to receive(:download_youtube_audio_and_transcribe)
          .and_return("OpenAI transcript")
      end

      it "transcribes by extracting and sending audio to OpenAI" do
        result = described_class.call(source_url: youtube_url)
        expect(result).to eq("OpenAI transcript")
      end
    end

    context "with an uploaded file path" do
      let(:tempfile) do
        file = Tempfile.new(["audio", ".mp3"])
        file.write("audio-bytes")
        file.rewind
        file
      end

      after do
        tempfile.close
        tempfile.unlink
      end

      before do
        allow(OpenaiClientService)
          .to receive(:transcribe)
          .and_return("File transcript")
      end

      it "uses gpt-4o-mini-transcribe" do
        result = described_class.call(file_path: tempfile.path)

        expect(result).to eq("File transcript")
        expect(OpenaiClientService).to have_received(:transcribe).with(
          file_path: tempfile.path,
          model: "gpt-4o-mini-transcribe"
        )
      end
    end

    context "when OpenAI returns rate limit" do
      let(:tempfile) do
        file = Tempfile.new(["audio", ".mp3"])
        file.write("audio-bytes")
        file.rewind
        file
      end

      after do
        tempfile.close
        tempfile.unlink
      end

      before do
        allow(OpenaiClientService)
          .to receive(:transcribe)
          .and_raise(OpenaiClientService::RateLimitError, "Too many requests")
      end

      it "raises TranscriptionError with clear message" do
        expect do
          described_class.call(file_path: tempfile.path)
        end.to raise_error(TranscriptionService::TranscriptionError, /rate limit/i)
      end
    end

    context "with no source provided" do
      it "raises TranscriptionError" do
        expect do
          described_class.call
        end.to raise_error(TranscriptionService::TranscriptionError, /No source/)
      end
    end
  end
end
