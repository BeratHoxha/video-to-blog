FactoryBot.define do
  factory :payment_transaction do
    association :user
    paddle_transaction_id { "txn_#{SecureRandom.hex(8)}" }
    paddle_subscription_id { "sub_#{SecureRandom.hex(8)}" }
    plan_key { "basic" }
    amount_cents { 1200 }
    currency { "USD" }
    status { :success }
    paid_at { Time.current }

    trait :failed do
      status { :failed }
      failure_reason { "card_declined" }
      paid_at { nil }
    end
  end
end
