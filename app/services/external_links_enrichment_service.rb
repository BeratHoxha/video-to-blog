class ExternalLinksEnrichmentService
  MAX_LINKS = 5

  def self.call(html:, article_title:)
    new(html: html, article_title: article_title).call
  end

  def initialize(html:, article_title:)
    @html = html
    @article_title = article_title
    @google = GoogleSearchService.new
  end

  # Searches for real, relevant references and appends a
  # "References & Further Reading" section at the end of the article.
  def call
    links = gather_links
    return @html if links.empty?

    @html + build_references_section(links)
  end

  private

  def gather_links
    topics = extract_topics

    if @google.configured?
      gather_google_links(topics)
    else
      gather_wikipedia_links(topics)
    end
  end

  def gather_google_links(topics)
    seen = Set.new
    links = []

    @google.search_links(topics.first, num_results: 3).each do |l|
      next if seen.include?(l[:url])

      seen << l[:url]
      links << l
    end

    topics[1..].each do |topic|
      @google.search_links(topic, num_results: 1).each do |l|
        next if seen.include?(l[:url])

        seen << l[:url]
        links << l
      end
    end

    links.first(MAX_LINKS)
  end

  def gather_wikipedia_links(topics)
    seen = Set.new
    links = []

    topics.each_with_index do |topic, i|
      limit = i.zero? ? 3 : 1
      WikimediaService.search_articles(topic, limit: limit).each do |a|
        next if seen.include?(a[:url])

        seen << a[:url]
        links << a
      end
    end

    links.first(MAX_LINKS)
  end

  def extract_topics
    doc = Nokogiri::HTML.fragment(@html)
    headings = doc.css("h2, h3").map { |h| h.text.strip }.reject(&:empty?).first(2)
    [@article_title, *headings].uniq
  end

  def build_references_section(links)
    items = links.map do |link|
      url     = CGI.escapeHTML(link[:url])
      title   = CGI.escapeHTML(link[:title])
      snippet = link[:snippet].present? ? " — #{CGI.escapeHTML(link[:snippet])}" : ""

      "<li><a href=\"#{url}\" target=\"_blank\" rel=\"noopener noreferrer\">#{title}</a>#{snippet}</li>"
    end.join("\n")

    <<~HTML
      <hr />
      <h2>References &amp; Further Reading</h2>
      <ul>
      #{items}
      </ul>
    HTML
  end
end
