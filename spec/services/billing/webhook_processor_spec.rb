require "rails_helper"

RSpec.describe Billing::WebhookProcessor do
  let(:user) { create(:user) }
  let(:pay_sub) do
    instance_double(
      Pay::Subscription,
      processor_id: "sub_abc123",
      processor_plan: "pri_basic_placeholder",
      status: "active",
      ends_at: nil
    )
  end

  describe ".call" do
    subject(:call) do
      described_class.call(
        user: user,
        event_type: "subscription.created",
        pay_object: pay_sub
      )
    end

    it "records the event in webhook_events" do
      allow(Billing::EntitlementSync).to receive(:call)
      expect { call }.to change(WebhookEvent, :count).by(1)
    end

    it "calls EntitlementSync for subscription events" do
      allow(Billing::EntitlementSync).to receive(:call)
      call
      expect(Billing::EntitlementSync).to have_received(:call).with(
        user: user,
        event_type: "subscription.created",
        pay_subscription: pay_sub
      )
    end

    context "when the same event is received twice (duplicate)" do
      before { call }

      it "does not process the event again" do
        allow(Billing::EntitlementSync).to receive(:call)
        call
        expect(Billing::EntitlementSync).not_to have_received(:call)
      end

      it "does not insert another webhook_event record" do
        expect { call }.not_to change(WebhookEvent, :count)
      end
    end

    context "for a transaction.completed event" do
      let(:pay_charge) do
        instance_double(
          Pay::Charge,
          processor_id: "txn_xyz789",
          amount: 1200,
          currency: "USD",
          subscription: nil,
          data: {}
        )
      end

      it "calls PaymentLogger" do
        allow(Billing::PaymentLogger).to receive(:call)
        described_class.call(
          user: user,
          event_type: "transaction.completed",
          pay_object: pay_charge
        )
        expect(Billing::PaymentLogger).to have_received(:call).with(
          user: user,
          event_type: "transaction.completed",
          pay_object: pay_charge
        )
      end
    end
  end
end
