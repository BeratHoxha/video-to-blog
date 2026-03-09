BILLING_PLANS = {
  basic_monthly: {
    key: "basic",
    processor: :paddle_billing,
    price_id: ENV.fetch("PADDLE_PRICE_BASIC_MONTHLY", "pri_basic_placeholder"),
    amount_cents: 1200,
    currency: "USD",
    interval: "month"
  },
  premium_monthly: {
    key: "premium",
    processor: :paddle_billing,
    price_id: ENV.fetch("PADDLE_PRICE_PREMIUM_MONTHLY", "pri_premium_placeholder"),
    amount_cents: 2900,
    currency: "USD",
    interval: "month"
  }
}.freeze
