Rails.application.routes.draw do
  # Health check — used by load balancers and deployment systems
  get "/health", to: proc { [200, { "Content-Type" => "text/plain" }, ["ok"]] }

  root "pages#home"
  get "/terms", to: "pages#terms"

  # Billing (Paddle Checkout + subscription lifecycle)
  post "/billing/checkout",     to: "billing#checkout"
  post "/billing/change_plan",  to: "billing#change_plan"
  post "/billing/cancel",       to: "billing#cancel"

  # Settings API
  namespace :settings do
    get "/billing", to: "billing#show"
  end
  # NOTE: Pay::Engine is auto-mounted at /pay by pay gem (Pay.automount_routes = true)

  devise_for :users, controllers: {
    omniauth_callbacks: "users/omniauth_callbacks",
    registrations: "users/registrations",
    sessions: "users/sessions",
    confirmations: "users/confirmations"
  }

  devise_scope :user do
    get "/users/check-email", to: "users/confirmations#check_email",
                              as: :users_check_email
  end

  get "/dashboard", to: "dashboard#index"
  get "/dashboard/articles", to: "dashboard#index"
  get "/dashboard/articles/:id", to: "dashboard#index"
  get "/dashboard/profile", to: "dashboard#index"
  get "/dashboard/billing", to: "dashboard#index"
  get "/onboarding", to: "onboarding#index"
  post "/onboarding", to: "onboarding#complete"

  namespace :api do
    resources :articles, only: %i[index update show destroy] do
      member do
        get :status
        get :export
      end
    end
    resources :generations, only: [:create]
    post "/images/upload", to: "images#upload"
    post "/ai_bot", to: "ai_bot#rewrite"
    post "/newsletter", to: "newsletter#subscribe"
    patch "/users/me", to: "users#update_profile"
  end
end
