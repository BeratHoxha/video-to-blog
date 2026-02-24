source "https://rubygems.org"
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby "3.3.2"

gem "bootsnap", require: false
gem "pg", "~> 1.1"
gem "puma", "~> 5.0"
gem "rack-cors"
gem "rails", "~> 7.0.8", ">= 7.0.8.4"
gem "sprockets-rails" # Required for rails/all compatibility
gem "tzinfo-data", platforms: %i[mingw mswin x64_mingw jruby]

# Frontend (Vite + React)
gem "vite_rails"

# Auth
gem "devise"
gem "omniauth"
gem "omniauth-github", "~> 1.4"
gem "omniauth-google-oauth2"
gem "omniauth-rails_csrf_protection"

# Background jobs
gem "redis", "~> 4.0"
gem "sidekiq"

# Active Storage
gem "aws-sdk-s3", require: false
gem "image_processing", "~> 1.2"

# OpenAI
gem "ruby-openai"

# Export
gem "caracal"
gem "caxlsx"
gem "caxlsx_rails"
gem "matrix" # required by prawn on Ruby >= 3.1
gem "nokogiri"
gem "prawn"
gem "prawn-table"

# Env
gem "dotenv-rails"

group :development, :test do
  gem "debug", platforms: %i[mri mingw x64_mingw]
  gem "factory_bot_rails"
  gem "faker"
  gem "rspec-rails"
end

group :development do
  gem "byebug"
  gem "rubocop", require: false
  gem "rubocop-performance", require: false
  gem "rubocop-rails", require: false
  gem "web-console"
end

group :test do
  gem "shoulda-matchers"
  gem "webmock"
end
