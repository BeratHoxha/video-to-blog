# Video To Blog

Turn any video into a polished blog post. Paste a YouTube URL or upload a video file, choose a style, and get a fully formatted article in seconds.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Ruby on Rails 7.0, PostgreSQL |
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui, Framer Motion |
| Editor | TipTap |
| AI | OpenAI GPT-4o (generation + AI Bot), Whisper (transcription) |
| Jobs | Sidekiq + Redis |
| Storage | Active Storage + AWS S3 |
| Auth | Devise + OmniAuth (Google, GitHub) |
| Payments | Pay gem + Paddle Billing + Paddle.js overlay checkout |

---

## Prerequisites

Make sure the following are installed before you begin:

- **Ruby** 3.3.2 — via [rbenv](https://github.com/rbenv/rbenv) or [asdf](https://asdf-vm.com)
- **Node.js** 22+ — via [nvm](https://github.com/nvm-sh/nvm) or [asdf](https://asdf-vm.com)
- **Yarn** — `npm install -g yarn`
- **PostgreSQL** 14+ — `brew install postgresql@14`
- **Redis** — `brew install redis`
- **yt-dlp** — `brew install yt-dlp` (used to extract audio from YouTube videos without captions)
- **ffmpeg** — `brew install ffmpeg` (required by yt-dlp to convert audio to mp3)

---

## First-Time Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd video-to-blog
```

### 2. Install Ruby dependencies

```bash
bundle install
```

### 3. Install JavaScript dependencies

```bash
yarn install
```

### 4. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your credentials:

```env
# Required — article generation and AI Bot rewriting
OPENAI_API_KEY=sk-...

# Required for file uploads (YouTube URLs work without this)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_BUCKET=

# Optional — OAuth sign-in (email/password works without these)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Local services — defaults work out of the box
DATABASE_URL=postgres://localhost/video_to_blog_development
REDIS_URL=redis://localhost:6379/0

# Paddle Billing — required for paid plans
PADDLE_BILLING_ENVIRONMENT=sandbox
PADDLE_BILLING_API_KEY=
PADDLE_BILLING_CLIENT_TOKEN=
PADDLE_BILLING_SIGNING_SECRET=
PADDLE_PRICE_BASIC_MONTHLY=
PADDLE_PRICE_PREMIUM_MONTHLY=
```

### 5. Start PostgreSQL and Redis

```bash
brew services start postgresql@14
brew services start redis
```

### 6. Set up the database

```bash
bundle exec rails db:create db:migrate
```

---

## Running the App

You need three processes running at the same time. Open three terminal tabs:

**Tab 1 — Rails server**
```bash
bin/rails server
```

**Tab 2 — Vite dev server** (React + hot reload)
```bash
bin/vite dev
```

**Tab 3 — Sidekiq** (background jobs for article generation)
```bash
bundle exec sidekiq
```

Then open **http://localhost:3000**

> **Shortcut:** if you have `foreman` installed (`gem install foreman`), run all three with:
> ```bash
> foreman start -f Procfile.dev
> ```
> Note: the Procfile.dev doesn't include Sidekiq by default — add it if you want a single command.

---

## Running Tests

All external services (OpenAI, S3, YouTube) are mocked with WebMock. No real credentials needed.

```bash
# Full suite (55 examples)
bundle exec rspec

# Models only
bundle exec rspec spec/models/

# Services only
bundle exec rspec spec/services/

# API request specs
bundle exec rspec spec/requests/
```

---

## User Tiers

| Tier | Article Length | AI Bot Rewrites |
|---|---|---|
| Guest (unauthenticated) | ~300-word preview | — |
| Free (signed in) | Up to 2,000 words | 10 per week |
| Basic | Unlimited | Unlimited |
| Premium | Unlimited | Unlimited |

---

## Features

- **YouTube + file support** — paste a YouTube URL or upload an audio/video file
- **Multi-style output** — Professional, Blog-Driven, SEO, Scientific, Academic, and more
- **Background generation** — article is generated in a Sidekiq job; the editor animates in when ready
- **TipTap rich editor** — bold, italic, headings, copy to clipboard, export
- **AI Bot** — select any passage in the editor and rewrite it with a custom instruction
- **Export** — download as PDF, DOCX, or XLSX
- **Article history** — all past articles listed in the dashboard sidebar
- **Newsletter signup** — email capture on the landing page

---

## Payments

The app uses Paddle Billing for subscriptions.

### What we use

- **Ruby gem:** `pay` (`7.3.0` locked in `Gemfile.lock`) for subscription/customer/webhook plumbing
- **Ruby gem:** `paddle` (`2.9` locked in `Gemfile.lock`) for Paddle Billing support
- **Frontend SDK:** hosted `Paddle.js` loaded from Paddle's CDN in the Rails layout
- **Checkout mode:** Paddle overlay checkout opened from the React app
- **Webhook endpoint:** `/pay/webhooks/paddle_billing` provided by `pay`

There is no Paddle npm package in this project. The frontend uses the script tag loaded in `app/views/layouts/application.html.erb`.

### App payment flow

1. The frontend posts to `POST /billing/checkout`.
2. Rails builds the checkout payload with `Billing::CheckoutSessionBuilder`.
3. The frontend opens Paddle overlay checkout with the returned `client_token`, `environment`, and `price_id`.
4. Paddle sends webhook events to `POST /pay/webhooks/paddle_billing`.
5. `pay` verifies the webhook signature and syncs billing records.
6. App-specific handlers in `config/initializers/pay_hooks.rb` update entitlements and log payment activity.

### Payment-related env vars

These are the payment vars the app expects in `.env`:

```env
PADDLE_BILLING_ENVIRONMENT=sandbox
PADDLE_BILLING_API_KEY=pdl_sdbx_...
PADDLE_BILLING_CLIENT_TOKEN=test_...
PADDLE_BILLING_SIGNING_SECRET=pdl_ntfset_...
PADDLE_PRICE_BASIC_MONTHLY=pri_...
PADDLE_PRICE_PREMIUM_MONTHLY=pri_...
```

### Payment-related app pieces

- `config/initializers/pay.rb` configures the `pay` gem
- `config/initializers/pay_hooks.rb` handles Paddle subscription and transaction webhooks
- `config/initializers/billing_plans.rb` maps local plans to Paddle price IDs
- `app/services/billing/checkout_session_builder.rb` prepares checkout data
- `app/services/billing/subscription_manager.rb` handles plan changes and cancellations
- `app/services/billing/webhook_processor.rb` processes verified webhook events
- `app/services/billing/payment_logger.rb` stores successful and failed transactions
- `app/models/payment_transaction.rb` stores payment history
- `app/models/webhook_event.rb` stores webhook idempotency records

### Paddle products currently expected

- `basic_monthly` -> `$12.00/month`
- `premium_monthly` -> `$29.00/month`

---

## Testing Paddle Billing Locally With ngrok

Paddle webhooks require a publicly accessible URL. Use [ngrok](https://ngrok.com) to tunnel your local Rails app while `PADDLE_BILLING_ENVIRONMENT=sandbox`.

### 1. Install ngrok

```bash
brew install ngrok
ngrok config add-authtoken <your-ngrok-token>
```

### 2. Start a tunnel

```bash
ngrok http 3000
```

Copy the HTTPS forwarding URL shown (e.g. `https://claudine-trailless-domingo.ngrok-free.dev`).

The Rails development config already allows `*.ngrok-free.app`, `*.ngrok-free.dev`, and `*.ngrok.io` hosts.

### 3. Configure Paddle sandbox

In the [Paddle sandbox dashboard](https://sandbox-vendors.paddle.com):

1. **Notification destination** — go to **Developer Tools → Notifications → New destination** and set the URL to:
   ```
   https://<your-ngrok-subdomain>.ngrok-free.dev/pay/webhooks/paddle_billing
   ```
   Copy the **Secret key** shown and set it in your `.env`:
   ```env
   PADDLE_BILLING_SIGNING_SECRET=pdl_ntfset_...
   ```

2. **Products** — go to **Catalog → Products** and create two products:
   - **Video to Blog Basic** → price: $12.00, recurring monthly
   - **Video to Blog Premium** → price: $29.00, recurring monthly

   Copy each **Price ID** (`pri_...`) and set them in `.env`:
   ```env
   PADDLE_PRICE_BASIC_MONTHLY=pri_...
   PADDLE_PRICE_PREMIUM_MONTHLY=pri_...
   ```

3. **Client token & API key** — go to **Developer Tools → Authentication**:
   ```env
   PADDLE_BILLING_CLIENT_TOKEN=test_...
   PADDLE_BILLING_API_KEY=pdl_sdbx_...
   PADDLE_BILLING_ENVIRONMENT=sandbox
   ```

4. **Default payment link** — set to `http://localhost:3000/dashboard` (used as a fallback; not required for overlay checkout).

### 4. Start the app

Run all payment-related processes locally:

```bash
bin/rails server
bin/vite dev
bundle exec sidekiq
```

### 5. Run a sandbox payment test

1. Sign in locally at `http://localhost:3000`.
2. Open the billing UI and start checkout for Basic or Premium.
3. Complete the Paddle sandbox checkout flow.
4. Confirm the webhook reaches your app through ngrok.

Useful places to verify the test:

- Rails logs should show the webhook hitting `/pay/webhooks/paddle_billing`
- `pay` should create or update the customer/subscription records
- `payment_transactions` should get a row for successful or failed payments
- the billing/profile UI should show the updated plan and payment history

### 6. Restart Rails after env changes

```bash
bin/rails server
```

If you changed Paddle env vars, restart Rails before testing again.

Paddle sandbox webhooks will now reach your local app through the ngrok tunnel.

---

## Notes

- YouTube transcription uses the free YouTube timedtext API — no API key needed
- OAuth (Google/GitHub) requires credentials in `.env` but email/password auth works without them
- File uploads require AWS S3; YouTube URL generation works without any AWS config
- Sidekiq **must** be running for article generation to complete — jobs are queued asynchronously and won't process without a worker
