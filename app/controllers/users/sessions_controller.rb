module Users
  class SessionsController < Devise::SessionsController
    protected

    def after_sign_in_path_for(_resource)
      current_user.onboarding_completed? ? dashboard_path : onboarding_path
    end
  end
end
