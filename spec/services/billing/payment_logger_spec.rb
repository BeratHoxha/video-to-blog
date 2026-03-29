require "rails_helper"

RSpec.describe Billing::PaymentLogger do
  let(:user) { create(:user, :basic) }

  describe ".call with transaction.completed" do
    let(:pay_charge) do
      double(
        "Pay::Charge",
        processor_id: "txn_001",
        amount: 1200,
        currency: "USD",
        subscription: nil,
        data: { "items" => [{ "price" => { "id" => "pri_basic_placeholder" } }] }
      )
    end

    it "creates a success payment_transaction" do
      expect do
        described_class.call(
          user: user,
          event_type: "transaction.completed",
          pay_object: pay_charge
        )
      end.to change(PaymentTransaction, :count).by(1)

      txn = PaymentTransaction.last
      expect(txn.status).to eq("success")
      expect(txn.amount_cents).to eq(1200)
      expect(txn.currency).to eq("USD")
      expect(txn.paddle_transaction_id).to eq("txn_001")
      expect(txn.user).to eq(user)
    end

    context "when the same transaction is logged twice (duplicate)" do
      before do
        described_class.call(
          user: user,
          event_type: "transaction.completed",
          pay_object: pay_charge
        )
      end

      it "does not raise and does not create a duplicate record" do
        expect do
          described_class.call(
            user: user,
            event_type: "transaction.completed",
            pay_object: pay_charge
          )
        end.not_to change(PaymentTransaction, :count)
      end
    end
  end

  describe ".call with transaction.payment_failed" do
    let(:raw_event) do
      totals  = Struct.new(:total).new(1200)
      details = Struct.new(:totals).new(totals)
      payment = Struct.new(:error_code).new("card_declined")
      price   = Struct.new(:id).new("pri_basic_placeholder")
      item    = Struct.new(:price).new(price)

      Struct.new(:id, :customer_id, :subscription_id, :currency_code,
                 :details, :payments, :items).new(
                   "txn_fail_001", "ctm_xyz", "sub_001", "USD",
                   details, [payment], [item]
                 )
    end

    it "creates a failed payment_transaction" do
      expect do
        described_class.call(
          user: user,
          event_type: "transaction.payment_failed",
          pay_object: raw_event
        )
      end.to change(PaymentTransaction, :count).by(1)

      txn = PaymentTransaction.last
      expect(txn.status).to eq("failed")
      expect(txn.failure_reason).to eq("card_declined")
      expect(txn.paddle_transaction_id).to eq("txn_fail_001")
      expect(txn.user).to eq(user)
    end
  end

  describe ".call when user is nil" do
    let(:pay_charge) do
      double("Pay::Charge", processor_id: "txn_999")
    end

    it "logs a warning and does not raise" do
      allow(Rails.logger).to receive(:warn)
      expect do
        described_class.call(
          user: nil,
          event_type: "transaction.completed",
          pay_object: pay_charge
        )
      end.not_to change(PaymentTransaction, :count)
      expect(Rails.logger).to have_received(:warn).with(/txn_999/)
    end
  end
end
