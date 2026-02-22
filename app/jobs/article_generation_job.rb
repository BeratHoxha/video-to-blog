class ArticleGenerationJob < ApplicationJob
  queue_as :default

  def perform(article_id, user_tier: "guest")
    article = Article.find(article_id)

    transcript = fetch_transcript(article)
    word_limit = ArticleGenerationService::WORD_LIMITS[user_tier.to_sym]

    content = ArticleGenerationService.call(
      transcript: transcript,
      options: article.generation_options,
      word_limit: word_limit
    )

    title = extract_title(content) || "Untitled Article"

    word_count = content.gsub(/<[^>]+>/, " ").split.length

    article.update!(
      content: content,
      title: title,
      word_count: word_count,
      status: :complete
    )

    increment_user_word_usage(article, word_count)
  rescue TranscriptionService::TranscriptionError,
         ArticleGenerationService::GenerationError,
         StandardError => e
    Rails.logger.error "ArticleGenerationJob failed for ##{article_id}: #{e.message}"
    article&.update!(status: :failed)
    raise
  end

  private

  def fetch_transcript(article)
    if article.file?
      file_path = article.source_file_path
      TranscriptionService.call(file_path: file_path)
    else
      TranscriptionService.call(source_url: article.source_url)
    end
  end

  def extract_title(html)
    doc = Nokogiri::HTML(html)
    doc.at("h1")&.text&.strip
  end

  def increment_user_word_usage(article, word_count)
    return unless article.user&.free?

    article.user.increment_words_used!(word_count)
  end
end
