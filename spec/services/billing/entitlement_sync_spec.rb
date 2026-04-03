require "rails_helper"

RSpec.describe Billing::EntitlementSync do
  let(:user) { create(:user) }
  let(:basic_price_id) { ENV.fetch("PADDLE_PRICE_BASIC_MONTHLY", "pri_basic_placeholder") }
  let(:premium_price_id) { ENV.fetch("PADDLE_PRICE_PREMIUM_MONTHLY", "pri_premium_placeholder") }

  def pay_subscription_double(processor_id:, processor_plan:, status:, ends_at: nil)
    instance_double(
      Pay::Subscription,
      processor_id: processor_id,
      processor_plan: processor_plan,
      status: status,
      ends_at: ends_at
    )
  end

  describe ".call" do
    context "on subscription.created" do
      let(:pay_sub) do
        pay_subscription_double(
          processor_id: "sub_001",
          processor_plan: basic_price_id,
          status: "active"
        )
      end

      it "sets plan to basic and status to active" do
        described_class.call(
          user: user,
          event_type: "subscription.created",
          pay_subscription: pay_sub
        )

        user.reload
        expect(user.plan).to eq("basic")
        expect(user.plan_status).to eq("active")
        expect(user.plan_expires_at).to be_nil
      end
    end

    context "on subscription.updated with a new price (upgrade)" do
      let(:pay_sub) do
        pay_subscription_double(
          processor_id: "sub_001",
          processor_plan: premium_price_id,
          status: "active"
        )
      end

      before { user.update!(plan: :basic, plan_status: :active) }

      it "updates plan to premium" do
        described_class.call(
          user: user,
          event_type: "subscription.updated",
          pay_subscription: pay_sub
        )

        expect(user.reload.plan).to eq("premium")
      end
    end

    context "on subscription.canceled with ends_at set (period-end cancel)" do
      let(:expires) { 30.days.from_now }
      let(:pay_sub) do
        pay_subscription_double(
          processor_id: "sub_001",
          processor_plan: basic_price_id,
          status: "canceled",
          ends_at: expires
        )
      end

      before { user.update!(plan: :basic, plan_status: :active) }

      it "sets plan_status to canceled and sets plan_expires_at" do
        described_class.call(
          user: user,
          event_type: "subscription.canceled",
          pay_subscription: pay_sub
        )

        user.reload
        expect(user.plan_status).to eq("canceled")
        expect(user.plan_expires_at).to be_within(1.second).of(expires)
      end
    end

    context "on subscription.canceled with no ends_at (immediate)" do
      let(:pay_sub) do
        pay_subscription_double(
          processor_id: "sub_001",
          processor_plan: basic_price_id,
          status: "canceled",
          ends_at: nil
        )
      end

      before { user.update!(plan: :basic, plan_status: :active) }

      it "sets plan_status to canceled" do
        described_class.call(
          user: user,
          event_type: "subscription.canceled",
          pay_subscription: pay_sub
        )

        expect(user.reload.plan_status).to eq("canceled")
      end
    end

    context "on subscription.past_due" do
      let(:pay_sub) do
        pay_subscription_double(
          processor_id: "sub_001",
          processor_plan: basic_price_id,
          status: "past_due"
        )
      end

      before { user.update!(plan: :basic, plan_status: :active) }

      it "sets plan_status to past_due" do
        described_class.call(
          user: user,
          event_type: "subscription.past_due",
          pay_subscription: pay_sub
        )

        expect(user.reload.plan_status).to eq("past_due")
      end
    end
  end
end
