# Purpose: Shared structured logging for all Billing services.
# Every log line is tagged [BILLING][ClassName] and written as JSON so it
# can be grepped, parsed, or forwarded to a log aggregator.
#
# Usage:
#   include Billing::Logging
#   blog(:info, "doing thing", user_id: 1)
#   blog(:error, "it broke", error: e)
module Billing
  module Logging
    private

    def blog(level, message, **context)
      tag   = "[BILLING][#{self.class.name}]"
      entry = { tag: tag, message: message, timestamp: Time.current.iso8601 }.merge(context)

      if (err = context[:error]).is_a?(Exception)
        entry[:error_class]   = err.class.name
        entry[:error_message] = err.message
        entry[:backtrace]     = err.backtrace&.first(8)
      end

      Rails.logger.public_send(level, entry.to_json)
    end
  end
end
