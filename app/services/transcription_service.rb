class TranscriptionService
  class TranscriptionError < StandardError; end

  YOUTUBE_PATTERN = %r{
    (youtube\.com/watch\?v=|youtu\.be/)([a-zA-Z0-9_-]{11})
  }x

  def self.call(source_url: nil, file_path: nil)
    new(source_url: source_url, file_path: file_path).call
  end

  def initialize(source_url: nil, file_path: nil)
    @source_url = source_url
    @file_path = file_path
  end

  def call
    if youtube_url?(@source_url)
      fetch_youtube_transcript(@source_url)
    elsif @source_url.present?
      transcribe_url_with_whisper(@source_url)
    elsif @file_path.present?
      transcribe_file_with_whisper(@file_path)
    else
      raise TranscriptionError, "No source URL or file provided"
    end
  end

  private

  def youtube_url?(url)
    return false if url.blank?

    YOUTUBE_PATTERN.match?(url)
  end

  def extract_youtube_id(url)
    match = YOUTUBE_PATTERN.match(url)
    match[2] if match
  end

  def fetch_youtube_transcript(url)
    video_id = extract_youtube_id(url)
    raise TranscriptionError, "Could not extract YouTube video ID" unless video_id

    # Fetch transcript via YouTube's timedtext API
    transcript_url =
      "https://www.youtube.com/api/timedtext?v=#{video_id}&lang=en&fmt=json3"

    response = URI.open(transcript_url, read_timeout: 15)
    data = JSON.parse(response.read)

    extract_text_from_youtube_json(data)
  rescue OpenURI::HTTPError, JSON::ParserError, SocketError => e
    Rails.logger.warn "YouTube transcript failed: #{e.message}. Falling back."
    transcribe_url_with_whisper(url)
  end

  def extract_text_from_youtube_json(data)
    events = data.dig("events") || []
    texts = events.flat_map do |event|
      (event["segs"] || []).map { |seg| seg["utf8"] }
    end

    text = texts.compact.join(" ").gsub(/\s+/, " ").strip
    raise TranscriptionError, "YouTube transcript is empty" if text.blank?

    text
  end

  def transcribe_url_with_whisper(url)
    client = OpenAI::Client.new(access_token: ENV.fetch("OPENAI_API_KEY", "test-key"))

    response = client.audio.transcribe(
      parameters: {
        model: "whisper-1",
        url: url
      }
    )

    text = response.dig("text")
    raise TranscriptionError, "Whisper returned empty transcript" if text.blank?

    text
  rescue Faraday::Error => e
    raise TranscriptionError, "Whisper API error: #{e.message}"
  end

  def transcribe_file_with_whisper(file_path)
    client = OpenAI::Client.new(access_token: ENV.fetch("OPENAI_API_KEY", "test-key"))

    File.open(file_path, "rb") do |file|
      response = client.audio.transcribe(
        parameters: {
          model: "whisper-1",
          file: file
        }
      )

      text = response.dig("text")
      raise TranscriptionError, "Whisper returned empty transcript" if text.blank?

      text
    end
  rescue Faraday::Error => e
    raise TranscriptionError, "Whisper file transcription error: #{e.message}"
  end
end
