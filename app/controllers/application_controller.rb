class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  def authenticate_user_api!
    unless current_user
      render json: { error: "Unauthorized" }, status: :unauthorized
    end
  end

  def current_user_json
    return nil unless current_user

    current_user.as_api_json
  end

  helper_method :current_user_json
end
