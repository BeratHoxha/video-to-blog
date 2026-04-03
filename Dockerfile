# ── Stage 1: Build the React/Vite frontend ───────────────────────────────────
FROM node:20-slim AS frontend

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

# ── Stage 2: Build the Ruby app ───────────────────────────────────────────────
FROM ruby:3.3.2-slim AS app

# System dependencies
RUN apt-get update -qq && apt-get install -y \
  build-essential \
  libpq-dev \
  curl \
  git \
  ffmpeg \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install gems
COPY Gemfile Gemfile.lock ./
RUN bundle install --without development test --jobs 4 --retry 3

# Copy app source
COPY . .

# Copy compiled frontend assets from Stage 1
COPY --from=frontend /app/public/vite* ./public/

# Precompile assets
RUN RAILS_ENV=production SECRET_KEY_BASE=placeholder bundle exec rails assets:precompile

# Create directories Puma needs
RUN mkdir -p tmp/pids tmp/sockets log

EXPOSE 3000

CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]
