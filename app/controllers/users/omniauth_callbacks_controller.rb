module Users
  class OmniauthCallbacksController < Devise::OmniauthCallbacksController
    def google_oauth2
      handle_auth("Google")
    end

    def github
      handle_auth("GitHub")
    end

    def failure
      redirect_to root_path, alert: "Authentication failed: #{failure_message}"
    end

    private

    def handle_auth(provider_name)
      @user = User.from_omniauth(request.env["omniauth.auth"])

      if @user.persisted?
        sign_in_and_redirect @user, event: :authentication
        set_flash_message(:notice, :success, kind: provider_name) if is_navigational_format?
      else
        session["devise.#{provider_name.downcase}_data"] =
          request.env["omniauth.auth"].except("extra")
        redirect_to new_user_registration_url,
                    alert: @user.errors.full_messages.join("\n")
      end
    end
  end
end
