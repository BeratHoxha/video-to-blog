class WebhookEvent < ApplicationRecord
  validates :provider, presence: true
  validates :event_id, presence: true, uniqueness: { scope: :provider }
  validates :event_type, presence: true
  validates :processed_at, presence: true
end
