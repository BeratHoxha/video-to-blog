module Users
  class ConfirmationsController < Devise::ConfirmationsController
    # GET /users/check-email
    # Shown immediately after sign-up so the user knows to check their inbox.
    def check_email
      # Renders check_email.html.erb
    end

    protected

    # After a successful confirmation, sign the user in and send them to
    # onboarding (or the dashboard if they already completed it).
    def after_confirmation_path_for(_resource_name, resource)
      sign_in(resource)
      resource.onboarding_completed? ? dashboard_path : onboarding_path
    end
  end
end
