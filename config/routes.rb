Rails.application.routes.draw do
  root "pages#home"

  devise_for :users, controllers: {
    omniauth_callbacks: "users/omniauth_callbacks",
    registrations: "users/registrations",
    sessions: "users/sessions"
  }

  get "/dashboard", to: "dashboard#index"
  get "/dashboard/articles", to: "dashboard#index"
  get "/dashboard/articles/:id", to: "dashboard#index"
  get "/dashboard/profile", to: "dashboard#index"
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
    post "/ai_bot", to: "ai_bot#rewrite"
    post "/newsletter", to: "newsletter#subscribe"
    patch "/users/me",   to: "users#update_profile"
    patch "/users/plan", to: "users#update_plan"
  end
end
