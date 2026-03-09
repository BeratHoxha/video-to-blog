# Purpose: Records every payment attempt — successful or failed — to the
# payment_transactions table. Called from WebhookProcessor on
# transaction.completed (Pay::Charge) and transaction.payment_failed (raw
# OpenStruct). Provides a queryable financial audit trail independent of
# pay's internal records.
module Billing
  class PaymentLogger
    include Billing::Logging

    def self.call(user:, event_type:, pay_object:)
      new(user: user, event_type: event_type, pay_object: pay_object).call
    end

    def initialize(user:, event_type:, pay_object:)
      @user = user
      @event_type = event_type
      @pay_object = pay_object
    end

    def call
      return warn_missing_user if @user.nil?

      blog(:info, "Recording payment transaction",
           event_type: @event_type,
           transaction_id: transaction_id,
           user_id: @user.id)

      persist_record
    end

    private

    def persist_record
      success_event? ? create_success_record : create_failure_record
    rescue ActiveRecord::RecordNotUnique, ActiveRecord::RecordInvalid => e
      raise unless e.is_a?(ActiveRecord::RecordInvalid) && duplicate_error?(e)

      blog(:info, "Duplicate transaction — skipping",
           transaction_id: transaction_id,
           user_id: @user&.id)
    rescue StandardError => e
      blog(:error, "Payment transaction recording failed",
           event_type: @event_type,
           transaction_id: transaction_id,
           user_id: @user&.id,
           error: e)
      raise
    end

    def success_event?
      @event_type == "transaction.completed"
    end

    def create_success_record
      txn = @user.payment_transactions.create!(
        paddle_transaction_id: @pay_object.processor_id,
        paddle_subscription_id: @pay_object.subscription&.processor_id,
        plan_key: plan_key_from_charge,
        amount_cents: @pay_object.amount,
        currency: @pay_object.currency,
        status: :success,
        failure_reason: nil,
        paid_at: Time.current
      )
      blog(:info, "Payment transaction created (success)",
           transaction_id: txn.paddle_transaction_id,
           amount_cents: txn.amount_cents,
           currency: txn.currency,
           plan_key: txn.plan_key,
           user_id: @user.id)
    end

    def create_failure_record
      txn = @user.payment_transactions.create!(
        paddle_transaction_id: @pay_object.id,
        paddle_subscription_id: @pay_object.try(:subscription_id),
        plan_key: plan_key_from_event,
        amount_cents: amount_from_event,
        currency: currency_from_event,
        status: :failed,
        failure_reason: error_code_from_event,
        paid_at: nil
      )
      blog(:warn, "Payment transaction created (failed)",
           transaction_id: txn.paddle_transaction_id,
           failure_reason: txn.failure_reason,
           plan_key: txn.plan_key,
           user_id: @user.id)
    end

    def plan_key_from_charge
      price_id = @pay_object.data&.dig("items", 0, "price", "id")
      Billing::PlanMapper.plan_key_for(price_id).to_s if price_id
    end

    def plan_key_from_event
      first_item = @pay_object.try(:items)&.first
      price_id   = first_item&.try(:price)&.try(:id)
      Billing::PlanMapper.plan_key_for(price_id).to_s if price_id
    end

    def amount_from_event
      @pay_object.try(:details)&.try(:totals)&.try(:total)
    end

    def currency_from_event
      @pay_object.try(:currency_code)
    end

    def error_code_from_event
      @pay_object.try(:payments)&.first&.try(:error_code)
    end

    def transaction_id
      success_event? ? @pay_object.processor_id : @pay_object.id
    end

    def duplicate_error?(record_invalid_error)
      record_invalid_error.record.errors[:paddle_transaction_id].any?
    end

    def warn_missing_user
      blog(:warn, "No user resolved for transaction — skipping",
           transaction_id: transaction_id,
           event_type: @event_type)
    end
  end
end
