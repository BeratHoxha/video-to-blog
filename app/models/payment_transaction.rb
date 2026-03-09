class PaymentTransaction < ApplicationRecord
  belongs_to :user

  enum :status, { success: 0, failed: 1, refunded: 2 }

  validates :paddle_transaction_id, presence: true, uniqueness: true
  validates :status, presence: true
end
