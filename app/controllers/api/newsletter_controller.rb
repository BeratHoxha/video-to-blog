module Api
  class NewsletterController < ApplicationController
    protect_from_forgery with: :null_session

    def subscribe
      email = params[:email].to_s.strip.downcase

      if email.blank?
        return render json: { error: "Email is required" },
                      status: :unprocessable_entity
      end

      NewsletterSubscription.find_or_create_by(email: email)
      render json: { success: true }
    rescue ActiveRecord::RecordInvalid => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end
end
