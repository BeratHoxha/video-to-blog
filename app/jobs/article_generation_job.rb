class ArticleGenerationJob < ApplicationJob
  queue_as :default

  def perform(article_id, user_tier: "guest", temp_file_path: nil)
    article = Article.find(article_id)
    process_article(article, user_tier, temp_file_path)
  rescue TranscriptionService::TranscriptionError,
         ArticleGenerationService::GenerationError,
         StandardError => e
    Rails.logger.error "ArticleGenerationJob failed for ##{article_id}: #{e.message}"
    delete_temp_file(temp_file_path)
    article&.update!(status: :failed)
    raise
  end

  private

  def process_article(article, user_tier, temp_file_path)
    # Guests get a 30-second audio trim so transcription is fast.
    trim_seconds = user_tier.to_s == "guest" ? 30 : nil
    transcript   = fetch_transcript(article, temp_file_path: temp_file_path,
                                             trim_seconds: trim_seconds)
    word_limit   = ArticleGenerationService::WORD_LIMITS[user_tier.to_sym]

    content = ArticleGenerationService.call(
      transcript: transcript,
      options: article.generation_options,
      word_limit: word_limit
    )

    title      = extract_title(content) || "Untitled Article"
    content    = strip_leading_h1(content)
    word_count = content.gsub(/<[^>]+>/, " ").split.length

    return if word_limit_exceeded?(article, word_count)

    article.update!(content: content, title: title, word_count: word_count, status: :complete)
    increment_user_word_usage(article, word_count)
  end

  def fetch_transcript(article, temp_file_path:, trim_seconds: nil)
    if article.file?
      TranscriptionService.call(file_path: temp_file_path, trim_seconds: trim_seconds)
    else
      TranscriptionService.call(source_url: article.source_url, trim_seconds: trim_seconds)
    end
  ensure
    delete_temp_file(temp_file_path)
  end

  def delete_temp_file(path)
    File.delete(path) if path && File.exist?(path)
  end

  def extract_title(html)
    doc = Nokogiri::HTML(html)
    doc.at("h1")&.text&.strip
  end

  def strip_leading_h1(html)
    doc = Nokogiri::HTML.fragment(html)
    doc.at("h1")&.remove
    doc.to_html
  end

  def word_limit_exceeded?(article, word_count)
    return false unless article.user&.free?

    remaining = article.user.words_remaining.to_i
    return false if word_count <= remaining

    article.update!(status: :failed, content: Article::WORD_LIMIT_ERROR_MARKER)
    true
  end

  def increment_user_word_usage(article, word_count)
    return unless article.user&.free?

    article.user.increment_words_used!(word_count)
  end
end
