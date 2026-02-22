source "https://rubygems.org"
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby "3.3.2"

gem "rails", "~> 7.0.8", ">= 7.0.8.4"
gem "sprockets-rails" # Required for rails/all compatibility
gem "pg", "~> 1.1"
gem "puma", "~> 5.0"
gem "bootsnap", require: false
gem "tzinfo-data", platforms: %i[mingw mswin x64_mingw jruby]
gem "rack-cors"

# Frontend (Vite + React)
gem "vite_rails"

# Auth
gem "devise"
gem "omniauth"
gem "omniauth-google-oauth2"
gem "omniauth-github", "~> 1.4"
gem "omniauth-rails_csrf_protection"

# Background jobs
gem "sidekiq"
gem "redis", "~> 4.0"

# Active Storage
gem "aws-sdk-s3", require: false
gem "image_processing", "~> 1.2"

# OpenAI
gem "ruby-openai"

# Export
gem "matrix" # required by prawn on Ruby >= 3.1
gem "prawn"
gem "prawn-table"
gem "caracal"
gem "caxlsx"
gem "caxlsx_rails"
gem "nokogiri"

# Env
gem "dotenv-rails"

group :development, :test do
  gem "debug", platforms: %i[mri mingw x64_mingw]
  gem "rspec-rails"
  gem "factory_bot_rails"
  gem "faker"
end

group :development do
  gem "web-console"
  gem "byebug"
end

group :test do
  gem "webmock"
  gem "shoulda-matchers"
end
