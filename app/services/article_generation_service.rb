class ArticleGenerationService
  WORD_LIMITS = {
    guest: 150,
    free: 2000,
    basic: nil,
    premium: nil
  }.freeze

  OUTPUT_TYPE_PROMPTS = {
    "Professional" =>
      "Write in a formal, authoritative tone suitable for business audiences.",
    "Presentational Format" =>
      "Structure the article with clear sections, bullet points, " \
      "and presentation-ready headings.",
    "Scientific" =>
      "Write with academic rigor, citing logical structure and " \
      "evidence-based reasoning.",
    "Easy-to-Understand" =>
      "Write in simple, clear language accessible to a general audience. " \
      "Avoid jargon.",
    "SEO-Driven" =>
      "Optimize for search engines: use relevant keywords naturally, " \
      "include an SEO-friendly title and meta description at the top.",
    "Assignment-Driven" =>
      "Write in an essay format appropriate for academic submission.",
    "Blog-Driven" =>
      "Write in a conversational, engaging blog style with a strong hook " \
      "and clear takeaways.",
    "Informational" =>
      "Write a factual, neutral, well-structured informational article.",
    "In-Depth (very detailed)" =>
      "Write a comprehensive, long-form article covering the topic in depth " \
      "with multiple subsections."
  }.freeze

  PRIMARY_MODEL = "gpt-4.1".freeze
  FALLBACK_MODEL = "gpt-4o".freeze

  def self.call(transcript:, options:, word_limit: nil)
    new(transcript: transcript, options: options, word_limit: word_limit).call
  end

  def initialize(transcript:, options:, word_limit: nil)
    @transcript = transcript
    @options = options.with_indifferent_access
    @word_limit = word_limit
  end

  def call
    # When a word limit is set, cap max_tokens so the model stops early
    # rather than generating a full article and truncating after.
    # HTML tags add overhead (~2x tokens vs plain words).
    max_tokens = @word_limit ? (@word_limit * 2) : nil

    content = OpenaiClientService.chat_with_fallback(
      primary_model: PRIMARY_MODEL,
      fallback_model: FALLBACK_MODEL,
      temperature: 0.7,
      max_tokens: max_tokens,
      messages: [
        { role: "system", content: system_prompt },
        { role: "user", content: user_prompt }
      ]
    )

    apply_word_limit(content)
  end

  private

  def system_prompt
    style = OUTPUT_TYPE_PROMPTS[@options[:output_type]] ||
            OUTPUT_TYPE_PROMPTS["Blog-Driven"]

    instructions = []
    instructions << style
    if @options[:include_images]
      instructions << "Where an image would strengthen the content, insert a placeholder " \
                      "formatted exactly as [IMAGE: brief description of the ideal image]. " \
                      "Use a specific, searchable description (e.g. " \
                      "[IMAGE: solar panel installation on rooftop])."
    end
    instructions << "Additional instructions: #{@options[:additional_instructions]}" \
      if @options[:additional_instructions].present?

    <<~PROMPT
      You are an expert content writer. Convert the provided video transcript
      into a well-structured, engaging blog article.

      Constraints:
      - Use only information contained in the transcript.
      - Do not invent facts or add unsupported details.
      - Produce publish-ready copy only.
      - Generate a clear title and structured sections with headings.

      #{instructions.join("\n")}

      Format the output as HTML with proper heading tags (h1, h2, h3),
      paragraphs, and lists where appropriate.
      Start with an H1 title derived from the content.
      Do not include any markdown — use HTML only.
      Return only the final article content.
    PROMPT
  end

  def user_prompt
    limit_note = @word_limit ? " Keep the article under #{@word_limit} words." : ""
    "Convert this transcript into a blog article.#{limit_note}\n\n#{@transcript}"
  end

  def apply_word_limit(content)
    return content unless @word_limit

    words = content.split
    return content if words.length <= @word_limit

    # Truncate at word boundary, keeping valid HTML structure
    truncated = words.first(@word_limit).join(" ")
    # Close any open tags naively
    truncated + close_open_tags(truncated)
  end

  def close_open_tags(html)
    # Basic tag closing — good enough for truncated previews
    open_tags = html.scan(/<(\w+)[^>]*>/).flatten
    close_tags = html.scan(%r{</(\w+)>}).flatten
    unclosed = open_tags - close_tags
    unclosed.reverse.map { |tag| "</#{tag}>" }.join
  end
end
