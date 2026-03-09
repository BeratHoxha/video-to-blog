require "rails_helper"

RSpec.describe Billing::EntitlementManager do
  subject(:manager) { described_class.new(user) }

  describe "#active?" do
    context "when plan_status is active" do
      let(:user) { build(:user, :basic, :active_subscription) }

      it { is_expected.to be_active }
    end

    context "when plan_status is inactive" do
      let(:user) { build(:user) }

      it { is_expected.not_to be_active }
    end

    context "when plan_status is canceled" do
      let(:user) { build(:user, :basic, :canceled) }

      it { is_expected.not_to be_active }
    end

    context "when plan_expires_at is in the past" do
      let(:user) do
        build(:user, :basic, :active_subscription,
              plan_expires_at: 1.day.ago)
      end

      it { is_expected.not_to be_active }
    end

    context "when plan_expires_at is in the future" do
      let(:user) do
        build(:user, :basic, :active_subscription,
              plan_expires_at: 1.day.from_now)
      end

      it { is_expected.to be_active }
    end
  end

  describe "#premium?" do
    context "when user is active premium" do
      let(:user) { build(:user, :premium) }

      it { is_expected.to be_premium }
    end

    context "when user is active basic" do
      let(:user) { build(:user, :basic) }

      it { is_expected.not_to be_premium }
    end

    context "when user is free" do
      let(:user) { build(:user) }

      it { is_expected.not_to be_premium }
    end

    context "when user is premium but plan_status is canceled" do
      let(:user) { build(:user, :canceled, plan: :premium) }

      it { is_expected.not_to be_premium }
    end
  end

  describe "#basic_or_higher?" do
    context "when user is active basic" do
      let(:user) { build(:user, :basic) }

      it { is_expected.to be_basic_or_higher }
    end

    context "when user is active premium" do
      let(:user) { build(:user, :premium) }

      it { is_expected.to be_basic_or_higher }
    end

    context "when user is free" do
      let(:user) { build(:user) }

      it { is_expected.not_to be_basic_or_higher }
    end

    context "when basic user has canceled plan" do
      let(:user) { build(:user, :basic, :canceled) }

      it { is_expected.not_to be_basic_or_higher }
    end
  end

  describe "#word_count_limit" do
    context "for a free user" do
      let(:user) { build(:user) }

      it "returns the free word limit" do
        expect(manager.word_count_limit).to eq(2_000)
      end
    end

    context "for an active basic user" do
      let(:user) { build(:user, :basic) }

      it "returns nil (unlimited)" do
        expect(manager.word_count_limit).to be_nil
      end
    end

    context "for an active premium user" do
      let(:user) { build(:user, :premium) }

      it "returns nil (unlimited)" do
        expect(manager.word_count_limit).to be_nil
      end
    end
  end

  describe "#ai_bot_limit" do
    context "for a free user" do
      let(:user) { build(:user) }

      it "returns the free AI bot limit" do
        expect(manager.ai_bot_limit).to eq(10)
      end
    end

    context "for an active basic user" do
      let(:user) { build(:user, :basic) }

      it "returns nil (unlimited)" do
        expect(manager.ai_bot_limit).to be_nil
      end
    end
  end
end
