# frozen_string_literal: true

require "net/http"
require "json"

# Queries the Google Custom Search JSON API and returns up to `num` results.
# Returns [] if credentials are missing or the request fails.
class GoogleSearchService
  BASE_URL = "https://www.googleapis.com/customsearch/v1"

  def self.search(query:, num: 5)
    new.search(query: query, num: num)
  end

  def search(query:, num: 5)
    api_key = ENV["GOOGLE_CUSTOM_SEARCH_API_KEY"].presence
    cx      = ENV["GOOGLE_CUSTOM_SEARCH_ENGINE_ID"].presence
    return [] if api_key.blank? || cx.blank?

    uri = URI(BASE_URL)
    uri.query = URI.encode_www_form(key: api_key, cx: cx, q: query, num: num)

    response = Net::HTTP.get_response(uri)
    return [] unless response.is_a?(Net::HTTPSuccess)

    data = JSON.parse(response.body)
    (data["items"] || []).map do |item|
      { title: item["title"].to_s, url: item["link"].to_s }
    end
  rescue StandardError => e
    Rails.logger.warn("GoogleSearchService error (#{query.inspect}): #{e.message}")
    []
  end
end
