class TranscriptionService
  class TranscriptionError < StandardError; end

  YOUTUBE_PATTERN = %r{
    (youtube\.com/watch\?v=|youtu\.be/)([a-zA-Z0-9_-]{11})
  }x

  TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe".freeze
  YT_DLP_BIN = `which yt-dlp`.strip.freeze
  FFMPEG_BIN = `which ffmpeg`.strip.freeze

  def self.call(source_url: nil, file_path: nil)
    new(source_url: source_url, file_path: file_path).call
  end

  def initialize(source_url: nil, file_path: nil)
    @source_url = source_url
    @file_path  = file_path
  end

  def call
    if youtube_url?(@source_url)
      download_youtube_audio_and_transcribe(@source_url)
    elsif @source_url.present?
      download_and_transcribe(@source_url)
    elsif @file_path.present?
      transcribe_file_with_openai(@file_path)
    else
      raise TranscriptionError, "No source URL or file provided"
    end
  end

  private

  def youtube_url?(url)
    return false if url.blank?

    YOUTUBE_PATTERN.match?(url)
  end

  # Use yt-dlp to extract audio from a YouTube URL, then transcribe with OpenAI.
  def download_youtube_audio_and_transcribe(url)
    Dir.mktmpdir("yt_audio") do |tmpdir|
      output_template = File.join(tmpdir, "audio.%(ext)s")

      success = system(
        YT_DLP_BIN,
        "-x",
        "--audio-format", "mp3",
        "--audio-quality", "5",
        "--no-playlist",
        "--ffmpeg-location", FFMPEG_BIN,
        "-o", output_template,
        url,
        out: File::NULL, err: File::NULL
      )

      raise TranscriptionError, "yt-dlp failed to download audio" unless success

      audio_file = Dir.glob(File.join(tmpdir, "audio.*")).first
      raise TranscriptionError, "Audio file not found after yt-dlp download" unless audio_file

      transcribe_file_with_openai(audio_file)
    end
  rescue TranscriptionError
    raise
  rescue => e
    raise TranscriptionError, "YouTube audio download failed: #{e.message}"
  end

  # Downloads a remote audio/video file to a tempfile, then sends to OpenAI.
  # Only used for non-YouTube direct file URLs.
  def download_and_transcribe(url)
    ext = File.extname(URI.parse(url).path).presence || ".mp4"

    Tempfile.create(["audio", ext]) do |tmpfile|
      tmpfile.binmode
      URI.open(url, "rb", read_timeout: 60) { |f| tmpfile.write(f.read) }
      tmpfile.rewind
      transcribe_file_with_openai(tmpfile.path)
    end
  rescue OpenURI::HTTPError, SocketError => e
    raise TranscriptionError, "Could not download audio file: #{e.message}"
  end

  def transcribe_file_with_openai(file_path)
    OpenaiClientService.transcribe(
      file_path: file_path,
      model: TRANSCRIPTION_MODEL
    )
  rescue OpenaiClientService::RateLimitError => e
    raise TranscriptionError, "Transcription rate limit exceeded: #{e.message}"
  rescue OpenaiClientService::InvalidAudioError => e
    raise TranscriptionError, "Invalid audio for transcription: #{e.message}"
  rescue OpenaiClientService::ModelUnavailableError => e
    raise TranscriptionError, "Transcription model unavailable: #{e.message}"
  rescue OpenaiClientService::OpenAIServiceError => e
    raise TranscriptionError, "OpenAI transcription failed: #{e.message}"
  end
end
