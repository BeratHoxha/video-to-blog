class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :omniauthable, omniauth_providers: %i[google_oauth2 github]

  enum :plan, { free: 0, basic: 1, premium: 2 }

  has_many :articles, dependent: :destroy

  AI_BOT_WEEKLY_LIMIT = 10
  FREE_WORD_LIMIT = 2000

  def self.from_omniauth(auth)
    where(provider: auth.provider, uid: auth.uid).first_or_create do |user|
      user.email = auth.info.email
      user.password = Devise.friendly_token[0, 20]
      user.name = auth.info.name
      user.provider = auth.provider
      user.uid = auth.uid
    end
  end

  def ai_bot_calls_remaining
    return nil unless free?

    reset_ai_bot_calls_if_needed!
    AI_BOT_WEEKLY_LIMIT - ai_bot_calls_this_week
  end

  def ai_bot_limit_reached?
    return false unless free?

    ai_bot_calls_remaining <= 0
  end

  def words_remaining
    return nil if basic? || premium?

    reset_words_if_needed!
    FREE_WORD_LIMIT - words_used_this_month
  end

  def word_limit
    return nil if basic? || premium?

    FREE_WORD_LIMIT
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
      provider: provider,
      words_remaining: words_remaining,
      words_used_this_month: words_used_this_month,
      ai_bot_calls_remaining: ai_bot_calls_remaining,
      onboarding_completed: onboarding_completed
    }
  end
end
