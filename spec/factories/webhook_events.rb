FactoryBot.define do
  factory :webhook_event do
    provider { "paddle_billing" }
    event_id { "sub_#{SecureRandom.hex(8)}_subscription.created" }
    event_type { "subscription.created" }
    processed_at { Time.current }
  end
end
