class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :confirmable

  pay_customer

  enum :plan, { free: 0, basic: 1, premium: 2 }
  enum :plan_status, {
    inactive: 0,
    trialing: 1,
    active: 2,
    past_due: 3,
    canceled: 4
  }

  has_many :articles, dependent: :destroy
  has_many :payment_transactions, dependent: :destroy

  AI_BOT_WEEKLY_LIMIT = 10
  FREE_WORD_LIMIT = 2000

  # Deliver all Devise emails asynchronously so they don't block HTTP responses.
  def send_devise_notification(notification, *)
    devise_mailer.send(notification, self, *).deliver_later
  end

  def ai_bot_calls_remaining
    limit = Billing::EntitlementManager.new(self).ai_bot_limit
    return nil if limit.nil?

    reset_ai_bot_calls_if_needed!
    limit - ai_bot_calls_this_week
  end

  def ai_bot_limit_reached?
    limit = Billing::EntitlementManager.new(self).ai_bot_limit
    return false if limit.nil?

    ai_bot_calls_remaining <= 0
  end

  def words_remaining
    limit = Billing::EntitlementManager.new(self).word_count_limit
    return nil if limit.nil?

    reset_words_if_needed!
    limit - words_used_this_month
  end

  def word_limit
    Billing::EntitlementManager.new(self).word_count_limit
  end

  def increment_ai_bot_calls!
    reset_ai_bot_calls_if_needed!
    update(ai_bot_calls_this_week: ai_bot_calls_this_week + 1)
  end

  def increment_words_used!(count)
    reset_words_if_needed!
    update(words_used_this_month: words_used_this_month + count)
  end

  def reset_ai_bot_calls_if_needed!
    return unless ai_bot_calls_reset_at.nil? ||
                  ai_bot_calls_reset_at < 1.week.ago

    update(ai_bot_calls_this_week: 0, ai_bot_calls_reset_at: Time.current)
  end

  def reset_words_if_needed!
    return unless words_reset_at.nil? ||
                  words_reset_at < 1.month.ago

    update(words_used_this_month: 0, words_reset_at: Time.current)
  end

  def as_api_json
    {
      id: id,
      name: name,
      email: email,
      plan: plan,
      plan_status: plan_status,
      plan_expires_at: plan_expires_at,
      provider: provider,
      words_remaining: words_remaining,
      words_used_this_month: words_used_this_month,
      ai_bot_calls_remaining: ai_bot_calls_remaining,
      onboarding_completed: onboarding_completed
    }
  end
end
