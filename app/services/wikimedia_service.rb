require "net/http"
require "json"

# Free image and article search backed by Wikipedia / Wikimedia Commons.
# No API key required. All images returned are Creative Commons licensed.
class WikimediaService
  WIKI_API   = "https://en.wikipedia.org/w/api.php".freeze
  USER_AGENT = "VideoToBlog/1.0 (rails-app; contact@example.com)".freeze

  # Returns { image_url:, title:, source_url:, source_domain: } or nil.
  def self.find_image(query)
    new.find_image(query)
  end

  # Returns array of { title:, url:, snippet: }.
  def self.search_articles(query, limit: 5)
    new.search_articles(query, limit: limit)
  end

  def find_image(query)
    title = best_page_title(query)
    return nil unless title

    fetch_thumbnail(title)
  rescue => e
    Rails.logger.error "WikimediaService#find_image(#{query.inspect}) failed: #{e.message}"
    nil
  end

  def search_articles(query, limit: 5)
    params = {
      action: "query", list: "search",
      srsearch: query, srlimit: limit, format: "json"
    }
    results = get(params).dig("query", "search") || []

    results.filter_map do |r|
      title = r["title"].presence
      next unless title

      {
        title: title,
        url: wiki_url(title),
        snippet: r["snippet"].to_s.gsub(/<[^>]+>/, "").gsub(/\s+/, " ").strip
      }
    end
  rescue => e
    Rails.logger.error "WikimediaService#search_articles(#{query.inspect}) failed: #{e.message}"
    []
  end

  private

  def best_page_title(query)
    results = get(action: "query", list: "search",
                  srsearch: query, srlimit: 1, format: "json")
    results.dig("query", "search", 0, "title")
  end

  def fetch_thumbnail(title)
    data = get(action: "query", prop: "pageimages", format: "json",
               piprop: "original|thumbnail", pithumbsize: 800, titles: title)
    page = data.dig("query", "pages")&.values&.first
    return nil unless page

    # Prefer full original; fall back to thumbnail
    source = page.dig("original", "source") || page.dig("thumbnail", "source")
    return nil unless source.present?

    # Skip SVG diagrams — browsers render them but they look odd in articles
    return nil if source.downcase.end_with?(".svg")

    {
      image_url: source,
      title: title,
      source_url: wiki_url(title),
      source_domain: "Wikipedia / Wikimedia Commons"
    }
  end

  def wiki_url(title)
    "https://en.wikipedia.org/wiki/#{URI.encode_www_form_component(title.gsub(' ', '_'))}"
  end

  def get(params)
    uri = URI(WIKI_API)
    uri.query = URI.encode_www_form(params)

    req = Net::HTTP::Get.new(uri)
    req["User-Agent"] = USER_AGENT

    response = Net::HTTP.start(uri.host, uri.port, use_ssl: true,
                               open_timeout: 8, read_timeout: 10) do |http|
      http.request(req)
    end

    JSON.parse(response.body)
  end
end
