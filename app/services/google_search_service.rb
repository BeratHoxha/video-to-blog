require "net/http"
require "json"

class GoogleSearchService
  API_BASE_URL = "https://www.googleapis.com/customsearch/v1".freeze

  # Free-to-use image rights filter for Google Custom Search
  IMAGE_RIGHTS_FILTER =
    "cc_publicdomain|cc_attribute|cc_sharealike|cc_noncommercial|cc_nonderived".freeze

  class SearchError < StandardError; end

  def self.configured?
    new.configured?
  end

  def self.search_links(query, num_results: 5)
    new.search_links(query, num_results: num_results)
  end

  def self.search_images(query, num_results: 3)
    new.search_images(query, num_results: num_results)
  end

  def initialize
    @api_key = ENV["GOOGLE_CUSTOM_SEARCH_API_KEY"]
    @cx = ENV["GOOGLE_CUSTOM_SEARCH_ENGINE_ID"]
  end

  def configured?
    @api_key.present? && @cx.present?
  end

  # Returns an array of { title:, url:, snippet: } hashes.
  def search_links(query, num_results: 5)
    return [] unless configured?

    fetch(query, num: num_results).filter_map do |item|
      next unless item["link"].present? && item["title"].present?

      {
        title: item["title"].to_s,
        url: item["link"].to_s,
        snippet: item["snippet"].to_s.gsub(/\s+/, " ").strip
      }
    end
  rescue => e
    Rails.logger.error "GoogleSearchService#search_links failed: #{e.message}"
    []
  end

  # Returns an array of { image_url:, title:, source_url:, source_domain: } hashes.
  # Only returns images with a permissive Creative Commons or public domain licence.
  def search_images(query, num_results: 3)
    return [] unless configured?

    fetch(
      query,
      num: num_results,
      searchType: "image",
      rights: IMAGE_RIGHTS_FILTER
    ).filter_map do |item|
      next unless item["link"].present?

      {
        image_url: item["link"].to_s,
        title: item["title"].to_s,
        source_url: (item.dig("image", "contextLink") || "https://#{item['displayLink']}").to_s,
        source_domain: item["displayLink"].to_s
      }
    end
  rescue => e
    Rails.logger.error "GoogleSearchService#search_images failed: #{e.message}"
    []
  end

  private

  def fetch(query, **params)
    uri = URI(API_BASE_URL)
    uri.query = URI.encode_www_form({ key: @api_key, cx: @cx, q: query }.merge(params))

    response = Net::HTTP.get_response(uri)

    unless response.is_a?(Net::HTTPSuccess)
      raise SearchError, "Google API #{response.code}: #{response.body.to_s.first(200)}"
    end

    JSON.parse(response.body).fetch("items", [])
  end
end
