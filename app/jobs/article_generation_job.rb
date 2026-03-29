class ArticleGenerationJob < ApplicationJob
  queue_as :default

  def perform(article_id, user_tier: "guest")
    article = Article.find(article_id)
    process_article(article, user_tier)
  rescue TranscriptionService::TranscriptionError,
         ArticleGenerationService::GenerationError,
         StandardError => e
    Rails.logger.error "ArticleGenerationJob failed for ##{article_id}: #{e.message}"
    article&.source_file&.purge_later if article&.source_file&.attached?
    article&.update!(status: :failed)
    raise
  end

  private

  def process_article(article, user_tier)
    # Guests get a 30-second audio trim so transcription is fast.
    trim_seconds = user_tier.to_s == "guest" ? 30 : nil
    transcript   = fetch_transcript(article, trim_seconds: trim_seconds)
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
    article.source_file.purge_later if article.source_file.attached?
    increment_user_word_usage(article, word_count)
  end

  def fetch_transcript(article, trim_seconds: nil)
    if article.file? && article.source_file.attached?
      article.source_file.open do |tempfile|
        TranscriptionService.call(file_path: tempfile.path, trim_seconds: trim_seconds)
      end
    else
      TranscriptionService.call(source_url: article.source_url, trim_seconds: trim_seconds)
    end
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
