FactoryBot.define do
  factory :article do
    association :user
    title { Faker::Lorem.sentence(word_count: 4) }
    content { "<h1>#{title}</h1><p>#{Faker::Lorem.paragraphs(number: 3).join(' ')}</p>" }
    source_url { "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
    source_type { :url }
    output_type { "Blog-Driven" }
    output_format { "pdf" }
    include_images { false }
    use_external_links { false }
    status { :complete }
    word_count { content&.gsub(/<[^>]+>/, " ")&.split&.length || 0 }

    trait :processing do
      status { :processing }
      content { nil }
      word_count { 0 }
    end

    trait :failed do
      status { :failed }
      content { nil }
      word_count { 0 }
    end

    trait :no_user do
      user { nil }
      session_id { SecureRandom.hex(16) }
    end
  end
end
