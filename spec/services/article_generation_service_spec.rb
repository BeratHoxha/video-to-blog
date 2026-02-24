require "rails_helper"

RSpec.describe ArticleGenerationService do
  let(:transcript) { "This is a test transcript about Ruby on Rails." }
  let(:options) { { output_type: "Blog-Driven", include_images: false, use_external_links: false } }
  let(:full_content) { "<h1>Ruby on Rails Guide</h1><p>#{'word ' * 400}</p>" }

  before do
    allow(OpenaiClientService)
      .to receive(:chat_with_fallback)
      .and_return(full_content)
  end

  describe ".call" do
    it "returns article content string" do
      result = described_class.call(transcript: transcript, options: options)
      expect(result).to be_a(String)
      expect(result).to include("Ruby on Rails")
    end

    it "uses gpt-4.1 with fallback to gpt-4o" do
      described_class.call(transcript: transcript, options: options)

      expect(OpenaiClientService).to have_received(:chat_with_fallback).with(
        hash_including(
          primary_model: "gpt-4.1",
          fallback_model: "gpt-4o"
        )
      )
    end

    it "truncates content to word_limit for guest users" do
      result = described_class.call(
        transcript: transcript,
        options: options,
        word_limit: 50
      )
      word_count = result.gsub(/<[^>]+>/, " ").split.length
      expect(word_count).to be <= 60 # allow small overage due to tag closing
    end

    it "does not truncate when word_limit is nil" do
      result = described_class.call(transcript: transcript, options: options, word_limit: nil)
      expect(result.length).to be > 100
    end
  end
end
