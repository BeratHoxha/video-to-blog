require "net/http"
require "open3"

class TranscriptionService
  class TranscriptionError < StandardError; end

  YOUTUBE_PATTERN = %r{
    (youtube\.com/watch\?v=|youtu\.be/)([a-zA-Z0-9_-]{11})
  }x

  TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe".freeze
  YT_DLP_BIN = `which yt-dlp`.strip.freeze
  FFMPEG_BIN = `which ffmpeg`.strip.freeze
  CHUNK_DURATION_SECONDS = 600

  def self.call(source_url: nil, file_path: nil, trim_seconds: nil)
    new(source_url: source_url, file_path: file_path, trim_seconds: trim_seconds).call
  end

  def initialize(source_url: nil, file_path: nil, trim_seconds: nil)
    @source_url   = source_url
    @file_path    = file_path
    @trim_seconds = trim_seconds
  end

  def call
    if youtube_url?(@source_url)
      download_youtube_audio_and_transcribe(@source_url)
    elsif @source_url.present?
      download_and_transcribe(@source_url)
    elsif @file_path.present?
      # For uploaded files, route through a tmpdir so maybe_trim can write there.
      Dir.mktmpdir("trim") do |tmpdir|
        transcribe_file_with_openai(maybe_trim(@file_path, tmpdir))
      end
    else
      raise TranscriptionError, "No source URL or file provided"
    end
  end

  private

  def youtube_url?(url)
    return false if url.blank?

    YOUTUBE_PATTERN.match?(url)
  end

  # Trim audio to @trim_seconds using ffmpeg (stream-copy, no re-encode).
  # Returns the trimmed path on success, or the original path if trimming fails.
  def maybe_trim(audio_path, tmpdir)
    return audio_path unless @trim_seconds&.positive?

    ext     = File.extname(audio_path).presence || ".mp3"
    trimmed = File.join(tmpdir, "trimmed#{ext}")

    success = system(
      FFMPEG_BIN, "-y",
      "-i", audio_path,
      "-t", @trim_seconds.to_s,
      "-c", "copy",
      trimmed,
      out: File::NULL, err: File::NULL
    )

    success && File.exist?(trimmed) && File.size(trimmed).positive? ? trimmed : audio_path
  end

  # Use yt-dlp to extract audio from a YouTube URL, then transcribe with OpenAI.
  def download_youtube_audio_and_transcribe(url)
    Dir.mktmpdir("yt_audio") do |tmpdir|
      output_template = File.join(tmpdir, "audio.%(ext)s")
      run_yt_dlp!(url, output_template)
      audio_file = find_audio_file!(tmpdir)
      transcribe_file_with_openai(maybe_trim(audio_file, tmpdir))
    end
  rescue TranscriptionError
    raise
  rescue StandardError => e
    raise TranscriptionError, "YouTube audio download failed: #{e.message}"
  end

  def run_yt_dlp!(url, output_template)
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
  end

  def find_audio_file!(tmpdir)
    audio_file = Dir.glob(File.join(tmpdir, "audio.*")).first
    raise TranscriptionError, "Audio file not found after yt-dlp download" unless audio_file

    audio_file
  end

  # Downloads a remote audio/video file, optionally trims it, then transcribes.
  def download_and_transcribe(url)
    ext = File.extname(URI.parse(url).path).presence || ".mp4"

    Dir.mktmpdir("audio") do |tmpdir|
      audio_path = File.join(tmpdir, "audio#{ext}")
      fetch_remote_file(url, audio_path)
      transcribe_file_with_openai(maybe_trim(audio_path, tmpdir))
    end
  rescue Net::HTTPError, SocketError, Timeout::Error => e
    raise TranscriptionError, "Could not download audio file: #{e.message}"
  end

  def fetch_remote_file(url, destination)
    uri = URI.parse(url)
    Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https", read_timeout: 60) do |http|
      response = http.request(Net::HTTP::Get.new(uri))
      File.binwrite(destination, response.body)
    end
  end

  def transcribe_file_with_openai(file_path)
    duration = audio_duration(file_path)
    if duration && duration > CHUNK_DURATION_SECONDS
      transcribe_in_chunks(file_path)
    else
      call_openai_transcribe(file_path)
    end
  rescue OpenaiClientService::RateLimitError => e
    raise TranscriptionError, "Transcription rate limit exceeded: #{e.message}"
  rescue OpenaiClientService::InvalidAudioError => e
    raise TranscriptionError, "Invalid audio for transcription: #{e.message}"
  rescue OpenaiClientService::ModelUnavailableError => e
    raise TranscriptionError, "Transcription model unavailable: #{e.message}"
  rescue OpenaiClientService::OpenAIServiceError => e
    raise TranscriptionError, "OpenAI transcription failed: #{e.message}"
  end

  def audio_duration(file_path)
    return nil if FFMPEG_BIN.blank?

    _out, stderr = Open3.capture3(FFMPEG_BIN, "-i", file_path)
    match = stderr.match(/Duration:\s*(\d+):(\d+):([\d.]+)/)
    return nil unless match

    (match[1].to_i * 3600) + (match[2].to_i * 60) + match[3].to_f
  rescue StandardError
    nil
  end

  def transcribe_in_chunks(file_path)
    Dir.mktmpdir("chunks") do |tmpdir|
      chunks = split_audio(file_path, tmpdir)
      chunks.map { |chunk| call_openai_transcribe(chunk) }.join(" ")
    end
  end

  def split_audio(file_path, tmpdir)
    ext = File.extname(file_path).presence || ".mp3"
    pattern = File.join(tmpdir, "chunk_%03d#{ext}")

    success = system(
      FFMPEG_BIN, "-y",
      "-i", file_path,
      "-f", "segment",
      "-segment_time", CHUNK_DURATION_SECONDS.to_s,
      "-c", "copy",
      pattern,
      out: File::NULL, err: File::NULL
    )

    raise TranscriptionError, "Failed to split audio into chunks" unless success

    Dir.glob(File.join(tmpdir, "chunk_*#{ext}"))
  end

  def call_openai_transcribe(file_path)
    OpenaiClientService.transcribe(file_path: file_path, model: TRANSCRIPTION_MODEL)
  end
end
