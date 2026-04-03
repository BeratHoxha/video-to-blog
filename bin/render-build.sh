#!/usr/bin/env bash
# Build script run by Render on every deploy.
# Render calls this as the "Build Command" for the web service.
set -e

echo "==> Installing Ruby gems"
bundle install

echo "==> Installing Node packages"
yarn install --frozen-lockfile

echo "==> Building React frontend"
yarn build

echo "==> Precompiling Rails assets"
bundle exec rails assets:precompile

echo "==> Running database migrations"
bundle exec rails db:migrate

echo "==> Build complete"
