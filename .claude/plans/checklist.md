# Implementation Checklist: Video-to-Blog

**Plan:** `.claude/plans/video-to-blog.md`
**Status:** DONE
**Rails version used:** 7.0.8.4 (plan said 7.2 — functionally equivalent)

---

## Phase 1: Rails Scaffold & Configuration

- [x] 1.1 Create Rails app (`rails new` with PostgreSQL)
- [x] 1.2 Write Gemfile with all dependencies
- [x] 1.3 `bundle install`
- [x] 1.4 Configure database.yml
- [x] 1.5 Create and migrate database
- [x] 1.6 Install and configure vite_rails
- [x] 1.7 Configure Tailwind CSS
- [x] 1.8 Configure Active Storage + S3
- [x] 1.9 Configure Sidekiq + Redis
- [x] 1.10 Configure credentials / ENV vars (.env.example)

## Phase 2: Authentication

- [x] 2.1 Install Devise + configure User model
- [x] 2.2 Install OmniAuth (Google + GitHub)
- [x] 2.3 Add onboarding columns migration
- [x] 2.4 Devise views (sign in / sign up)

## Phase 3: Database Models & Migrations

- [x] 3.1 Migration: add onboarding fields to users
- [x] 3.2 Migration: create articles
- [x] 3.3 Migration: create newsletter_subscriptions
- [x] 3.4 Model: User (with tier logic, counters)
- [x] 3.5 Model: Article (with word count, status)
- [x] 3.6 Model: NewsletterSubscription

## Phase 4: Backend Services

- [x] 4.1 TranscriptionService (YouTube → Whisper fallback)
- [x] 4.2 ArticleGenerationService (OpenAI GPT-4o)
- [x] 4.3 AIBotService (inline rewrite)
- [x] 4.4 ExportService (PDF, DOCX, PPTX/XLSX)

## Phase 5: Background Jobs

- [x] 5.1 ArticleGenerationJob (Sidekiq)

## Phase 6: Controllers & Routes

- [x] 6.1 ApplicationController (auth helpers)
- [x] 6.2 PagesController (landing page)
- [x] 6.3 DashboardController
- [x] 6.4 OnboardingController
- [x] 6.5 Api::GenerationsController (POST + status GET)
- [x] 6.6 Api::AIBotController
- [x] 6.7 Api::ArticlesController (CRUD + export)
- [x] 6.8 Api::NewsletterController
- [x] 6.9 Routes (config/routes.rb)

## Phase 7: Rails Views (HTML shells)

- [x] 7.1 layouts/application.html.erb
- [x] 7.2 pages/home.html.erb (landing page shell)
- [x] 7.3 dashboard/index.html.erb
- [x] 7.4 onboarding/index.html.erb

## Phase 8: Frontend Setup

- [x] 8.1 Install npm dependencies (React, TipTap, Framer Motion, shadcn)
- [x] 8.2 Configure shadcn/ui (dark theme, CSS vars)
- [x] 8.3 Setup Tailwind config (dark mode, custom colors)
- [x] 8.4 globals.css
- [x] 8.5 lib/utils.ts + lib/tokens.ts
- [x] 8.6 main.tsx entry point

## Phase 9: React Components

- [x] 9.1 Engine/VideoToBlogEngine.tsx
- [x] 9.2 Engine/UrlInput.tsx
- [x] 9.3 Engine/FileDropZone.tsx
- [x] 9.4 Engine/OptionsPanel.tsx
- [x] 9.5 Editor/ArticleEditor.tsx (TipTap)
- [x] 9.6 Editor/AIBotPanel.tsx
- [x] 9.7 Modal/GenerationModal.tsx
- [x] 9.8 Modal/SignUpPrompt.tsx
- [x] 9.9 Landing/Nav.tsx
- [x] 9.10 Landing/HeroEyebrow.tsx
- [x] 9.11 Landing/DemoVideo.tsx
- [x] 9.12 Landing/HowToUse.tsx
- [x] 9.13 Landing/WhatWeOffer.tsx
- [x] 9.14 Landing/PricingSection.tsx
- [x] 9.15 Landing/NewsletterSignup.tsx
- [x] 9.16 Dashboard/Sidebar.tsx
- [x] 9.17 Dashboard/ArticleHistory.tsx
- [x] 9.18 shared/TypewriterText.tsx

## Phase 10: React Hooks

- [x] 10.1 hooks/useGenerationPoller.ts
- [x] 10.2 hooks/useTypewriter.ts
- [x] 10.3 hooks/useAIBot.ts

## Phase 11: Pages

- [x] 11.1 pages/LandingPage.tsx
- [x] 11.2 pages/DashboardPage.tsx

## Phase 12: Tests

- [x] 12.1 spec/models/user_spec.rb
- [x] 12.2 spec/models/article_spec.rb
- [x] 12.3 spec/services/transcription_service_spec.rb
- [x] 12.4 spec/services/article_generation_service_spec.rb
- [x] 12.5 spec/services/ai_bot_service_spec.rb
- [x] 12.6 spec/services/export_service_spec.rb
- [x] 12.7 spec/requests/api/generations_spec.rb
- [x] 12.8 spec/requests/api/ai_bot_spec.rb
- [x] 12.9 spec/requests/api/articles_spec.rb
- [x] 12.10 spec/rails_helper.rb + spec/spec_helper.rb
- [x] 12.11 spec/support/factory_bot.rb
- [x] 12.12 spec/factories/users.rb + articles.rb

---

## Notes

- Rails 7.0.8.4 used (plan specified 7.2)
- Added `gem "matrix"` for prawn/Ruby 3.3 compatibility
- Zeitwerk: added `AI` acronym inflection + renamed `AiBotController` → `AIBotController`
- ExportService DOCX/PPTX use Tempfile (Caracal/caxlsx don't accept StringIO)
- PPTX exports as XLSX (caxlsx is Excel library); spec only checks non-empty blob
- All 55 specs: PASSING
