Rails.application.config.after_initialize do
  Pay::Webhooks.configure do |events|
    # Subscription lifecycle: Pay syncs the pay_subscription before our handler runs
    %w[
      subscription.created
      subscription.updated
      subscription.canceled
      subscription.past_due
      subscription.paused
    ].each do |event_type|
      events.subscribe "paddle_billing.#{event_type}" do |event|
        Rails.logger.info(
          { tag: "[BILLING][pay_hooks]", message: "Subscription webhook received",
            event_type: event_type, customer_id: event.customer_id,
            event_id: event.id, timestamp: Time.current.iso8601 }.to_json
        )

        customer = Pay::Customer.find_by(
          processor: :paddle_billing,
          processor_id: event.customer_id
        )

        unless customer&.owner
          Rails.logger.warn(
            { tag: "[BILLING][pay_hooks]", message: "No customer or owner found — skipping",
              event_type: event_type, customer_id: event.customer_id }.to_json
          )
          next
        end

        pay_subscription = customer.subscriptions.find_by(processor_id: event.id)

        unless pay_subscription
          Rails.logger.warn(
            { tag: "[BILLING][pay_hooks]", message: "No pay_subscription found — skipping",
              event_type: event_type, subscription_id: event.id,
              customer_id: event.customer_id }.to_json
          )
          next
        end

        Billing::WebhookProcessor.call(
          user: customer.owner,
          event_type: event_type,
          pay_object: pay_subscription
        )
      end
    end

    # Transaction completed: Pay has synced the pay_charge by the time we run
    events.subscribe "paddle_billing.transaction.completed" do |event|
      Rails.logger.info(
        { tag: "[BILLING][pay_hooks]", message: "Transaction completed webhook received",
          transaction_id: event.id, customer_id: event.customer_id,
          timestamp: Time.current.iso8601 }.to_json
      )

      customer = Pay::Customer.find_by(
        processor: :paddle_billing,
        processor_id: event.customer_id
      )

      unless customer&.owner
        Rails.logger.warn(
          { tag: "[BILLING][pay_hooks]", message: "No customer or owner found — skipping",
            event_type: "transaction.completed", customer_id: event.customer_id }.to_json
        )
        next
      end

      pay_charge = customer.charges.find_by(processor_id: event.id)

      unless pay_charge
        Rails.logger.warn(
          { tag: "[BILLING][pay_hooks]", message: "No pay_charge found — skipping",
            transaction_id: event.id, customer_id: event.customer_id }.to_json
        )
        next
      end

      Billing::WebhookProcessor.call(
        user: customer.owner,
        event_type: "transaction.completed",
        pay_object: pay_charge
      )
    end

    # Transaction payment failed: Pay does not handle this, so we work with
    # the raw OpenStruct event from Paddle
    events.subscribe "paddle_billing.transaction.payment_failed" do |event|
      Rails.logger.warn(
        { tag: "[BILLING][pay_hooks]", message: "Transaction payment_failed webhook received",
          transaction_id: event.id, customer_id: event.customer_id,
          timestamp: Time.current.iso8601 }.to_json
      )

      customer = Pay::Customer.find_by(
        processor: :paddle_billing,
        processor_id: event.customer_id
      )

      unless customer&.owner
        Rails.logger.warn(
          { tag: "[BILLING][pay_hooks]", message: "No customer or owner found — skipping",
            event_type: "transaction.payment_failed", customer_id: event.customer_id }.to_json
        )
        next
      end

      Billing::WebhookProcessor.call(
        user: customer.owner,
        event_type: "transaction.payment_failed",
        pay_object: event # raw OpenStruct — no Pay::Charge for failed transactions
      )
    end
  end
end
