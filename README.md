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

---

## Prerequisites

Make sure the following are installed before you begin:

- **Ruby** 3.3.2 — via [rbenv](https://github.com/rbenv/rbenv) or [asdf](https://asdf-vm.com)
- **Node.js** 22+ — via [nvm](https://github.com/nvm-sh/nvm) or [asdf](https://asdf-vm.com)
- **Yarn** — `npm install -g yarn`
- **PostgreSQL** 14+ — `brew install postgresql@14`
- **Redis** — `brew install redis`

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

## Notes

- YouTube transcription uses the free YouTube timedtext API — no API key needed
- OAuth (Google/GitHub) requires credentials in `.env` but email/password auth works without them
- File uploads require AWS S3; YouTube URL generation works without any AWS config
- Sidekiq **must** be running for article generation to complete — jobs are queued asynchronously and won't process without a worker
