# Purpose: Single source of truth for what a user is allowed to do based on
# their current plan. All feature gates must go through this class — never
# read billing state directly from the User model or Paddle's live API.
module Billing
  class EntitlementManager
    WORD_COUNT_LIMITS = {
      free: 2_000,
      basic: nil,    # nil = unlimited
      premium: nil   # nil = unlimited
    }.freeze

    AI_BOT_LIMITS = {
      free: 10,
      basic: nil,    # nil = unlimited
      premium: nil   # nil = unlimited
    }.freeze

    def initialize(user)
      @user = user
    end

    def active?
      return false unless @user.plan_status.in?(%w[active trialing])
      return false if expired?

      true
    end

    def premium?
      active? && @user.premium?
    end

    def basic_or_higher?
      active? && (@user.basic? || @user.premium?)
    end

    def word_count_limit
      return WORD_COUNT_LIMITS[:free] unless basic_or_higher?

      WORD_COUNT_LIMITS[@user.plan.to_sym]
    end

    def ai_bot_limit
      return AI_BOT_LIMITS[:free] unless basic_or_higher?

      AI_BOT_LIMITS[@user.plan.to_sym]
    end

    private

    def expired?
      @user.plan_expires_at.present? && @user.plan_expires_at < Time.current
    end
  end
end
