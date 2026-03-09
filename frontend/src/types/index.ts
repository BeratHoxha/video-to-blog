export interface User {
  id: number;
  name: string;
  email: string;
  plan: string;
  plan_status: string;
  plan_expires_at: string | null;
  provider?: string | null;
  words_remaining: number | null;
  words_used_this_month: number;
  ai_bot_calls_remaining: number | null;
  onboarding_completed: boolean;
}

export interface PaymentTransaction {
  id: number;
  paddle_transaction_id: string;
  plan_key: string | null;
  amount_cents: number | null;
  currency: string | null;
  status: "success" | "failed" | "refunded";
  failure_reason: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface BillingInfo {
  plan: string;
  plan_status: string;
  plan_expires_at: string | null;
  entitlements: {
    active: boolean;
    premium: boolean;
    basic_or_higher: boolean;
    word_count_limit: number | null;
    ai_bot_limit: number | null;
  };
  payment_transactions: PaymentTransaction[];
  available_plans: {
    key: string;
    name: string;
    price_id: string;
    amount_cents: number;
    currency: string;
    interval: string;
  }[];
}

export interface Article {
  id: number;
  title: string;
  content: string;
  word_count: number;
  output_format?: string;
}

export interface ArticleSummary {
  id: number;
  title: string;
  word_count: number;
  created_at: string;
}
