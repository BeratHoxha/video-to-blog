require "ostruct"

Pay.setup do |config|
  config.business_name = "Video to Blog"
  config.default_product_name = "Video to Blog Subscription"

  # Disable Pay's built-in email receipts; we handle notifications ourselves
  config.send_emails = false
end
