FactoryBot.define do
  factory :user do
    name { Faker::Name.name }
    email { Faker::Internet.unique.email }
    password { "password123" }
    plan { :free }
    words_used_this_month { 0 }
    ai_bot_calls_this_week { 0 }
    onboarding_completed { true }

    trait :basic do
      plan { :basic }
    end

    trait :premium do
      plan { :premium }
    end

    trait :at_ai_bot_limit do
      ai_bot_calls_this_week { 10 }
      ai_bot_calls_reset_at { Time.current }
    end

    trait :at_word_limit do
      words_used_this_month { 2000 }
      words_reset_at { Time.current }
    end
  end
end
