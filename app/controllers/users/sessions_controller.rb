module Users
  class SessionsController < Devise::SessionsController
    def create
      credential_errors = validate_credentials
      return render_credential_errors(credential_errors) if credential_errors.any?

      self.resource = warden.authenticate(auth_options)

      if resource
        set_flash_message!(:notice, :signed_in)
        sign_in(resource_name, resource)

        respond_to do |format|
          format.html { respond_with resource, location: after_sign_in_path_for(resource) }
          format.json { render json: { redirect_url: after_sign_in_path_for(resource) } }
        end
        return
      end

      render_invalid_credentials
    end

    protected

    def after_sign_in_path_for(_resource)
      current_user.onboarding_completed? ? dashboard_path : onboarding_path
    end

    private

    def validate_credentials
      errors = {}
      errors[:email] = ["can't be blank"] if sign_in_params[:email].blank?
      errors[:password] = ["can't be blank"] if sign_in_params[:password].blank?
      errors
    end

    def render_credential_errors(errors)
      respond_to do |format|
        format.html do
          self.resource = resource_class.new(sign_in_params.slice(:email))
          errors.each do |field, messages|
            messages.each { |message| resource.errors.add(field, message) }
          end
          clean_up_passwords(resource)
          render :new, status: :unprocessable_entity
        end
        format.json { render json: { errors: errors }, status: :unprocessable_entity }
      end
    end

    def render_invalid_credentials
      message = I18n.t(
        "devise.failure.invalid",
        authentication_keys: resource_class.human_attribute_name(:email).downcase
      )

      respond_to do |format|
        format.html do
          self.resource = resource_class.new(sign_in_params.slice(:email))
          resource.errors.add(:base, message)
          clean_up_passwords(resource)
          render :new, status: :unauthorized
        end
        format.json { render json: { errors: { base: [message] } }, status: :unauthorized }
      end
    end
  end
end
