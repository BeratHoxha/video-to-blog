module Api
  class UsersController < ApplicationController
    protect_from_forgery with: :null_session
    before_action :authenticate_user_api!

    # PATCH /api/users/me — update name and/or password
    def update_profile
      if params[:password].present?
        unless current_user.valid_password?(params[:current_password])
          return render json: { error: "Current password is incorrect" }, status: :unprocessable_entity
        end
        current_user.password = params[:password]
      end
      current_user.name = params[:name] if params[:name].present?
      if current_user.save
        render json: current_user.as_api_json
      else
        render json: { error: current_user.errors.full_messages.first }, status: :unprocessable_entity
      end
    end

    # PATCH /api/users/plan — switch plan
    def update_plan
      plan = params[:plan].to_s
      unless %w[free basic premium].include?(plan)
        return render json: { error: "Invalid plan" }, status: :unprocessable_entity
      end
      current_user.update!(plan: plan)
      render json: current_user.as_api_json
    end
  end
end
