require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module VideoToBlog
  class Application < Rails::Application
    config.load_defaults 7.0

    config.api_only = false
    config.time_zone = "UTC"

    # Autoload app/services and app/jobs
    config.eager_load_paths << Rails.root.join("app/services")
    config.autoload_paths << Rails.root.join("app/services")
    config.autoload_paths << Rails.root.join("app/jobs")

    # Sidekiq as Active Job backend
    config.active_job.queue_adapter = :sidekiq

    # Allow CORS for API routes (configured in initializer)
    config.middleware.insert_before 0, Rack::Cors
  end
end
