# Purpose: Writes structured log entries for billing state transitions.
# Provides a human-readable record that support staff can inspect without
# querying pay tables directly.
module Billing
  class AuditLogger
    def self.log(**)
      new(**).log
    end

    def initialize(user:, event_type:, **opts)
      @user = user
      @event_type = event_type
      @old_plan = opts[:old_plan]
      @new_plan = opts[:new_plan]
      @old_status = opts[:old_status]
      @new_status = opts[:new_status]
      @paddle_id = opts[:paddle_id]
    end

    def log
      Rails.logger.info(log_entry.to_json)
    end

    private

    def log_entry
      {
        billing_audit: true,
        event_type: @event_type,
        user_id: @user.id,
        user_email: @user.email,
        old_plan: @old_plan,
        new_plan: @new_plan,
        old_status: @old_status,
        new_status: @new_status,
        paddle_id: @paddle_id,
        timestamp: Time.current.iso8601
      }
    end
  end
end
