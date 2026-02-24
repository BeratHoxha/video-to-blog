export interface User {
  id: number;
  name: string;
  email: string;
  plan: string;
  provider?: string | null;
  words_remaining: number | null;
  words_used_this_month: number;
  ai_bot_calls_remaining: number | null;
  onboarding_completed: boolean;
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
