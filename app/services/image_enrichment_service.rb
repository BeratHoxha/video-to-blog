class ImageEnrichmentService
  # Matches [IMAGE] or [IMAGE: some description here]
  PLACEHOLDER_REGEX = /\[IMAGE(?::\s*([^\]]+))?\]/i

  def self.call(html:, article_title:)
    new(html: html, article_title: article_title).call
  end

  def initialize(html:, article_title:)
    @html = html
    @article_title = article_title
    @google = GoogleSearchService.new
  end

  # Replaces every [IMAGE] / [IMAGE: desc] placeholder with a real, freely
  # licensed image plus an attribution line showing the source.
  def call
    @html.gsub(PLACEHOLDER_REGEX) do |_match|
      description = Regexp.last_match(1).presence || @article_title
      image = find_image(description)
      image ? build_image_html(image, description) : ""
    end
  end

  private

  def find_image(description)
    # Try Google first (higher image quality / variety) if the API is configured.
    if @google.configured?
      query = "#{description} #{@article_title}"
      images = @google.search_images(query, num_results: 1)
      return images.first if images.any?
    end

    # Wikimedia fallback — always available, Creative Commons licensed.
    WikimediaService.find_image(description) ||
      WikimediaService.find_image(@article_title)
  end

  def build_image_html(image, alt_text)
    img_src      = CGI.escapeHTML(image[:image_url])
    alt          = CGI.escapeHTML(alt_text)
    source_url   = CGI.escapeHTML(image[:source_url])
    source_domain = CGI.escapeHTML(image[:source_domain])

    <<~HTML
      <img src="#{img_src}" alt="#{alt}" />
      <p><em>Source: <a href="#{source_url}" target="_blank" rel="noopener noreferrer">#{source_domain}</a></em></p>
    HTML
  end
end
