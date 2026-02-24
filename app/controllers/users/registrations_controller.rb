module Users
  class RegistrationsController < Devise::RegistrationsController
    def create
      build_resource(sign_up_params)
      resource.save
      yield resource if block_given?

      return respond_to_successful_sign_up if resource.persisted?

      render_failed_sign_up
    end

    protected

    def after_sign_up_path_for(_resource)
      onboarding_path
    end

    def after_inactive_sign_up_path_for(_resource)
      onboarding_path
    end

    private

    def respond_to_successful_sign_up
      return respond_to_active_sign_up if resource.active_for_authentication?

      respond_to_inactive_sign_up
    end

    def respond_to_active_sign_up
      set_flash_message! :notice, :signed_up
      sign_up(resource_name, resource)
      respond_to do |format|
        format.html { respond_with resource, location: after_sign_up_path_for(resource) }
        format.json { render json: { redirect_url: after_sign_up_path_for(resource) } }
      end
    end

    def respond_to_inactive_sign_up
      expire_data_after_sign_in!
      set_flash_message! :notice, :"signed_up_but_#{resource.inactive_message}"
      respond_to do |format|
        format.html do
          respond_with resource, location: after_inactive_sign_up_path_for(resource)
        end
        format.json do
          render json: { redirect_url: after_inactive_sign_up_path_for(resource) }
        end
      end
    end

    def render_failed_sign_up
      clean_up_passwords resource
      set_minimum_password_length
      respond_to do |format|
        format.html { respond_with resource, status: :unprocessable_entity }
        format.json do
          render json: { errors: formatted_resource_errors },
                 status: :unprocessable_entity
        end
      end
    end

    def formatted_resource_errors
      resource.errors.messages.transform_keys(&:to_s)
    end
  end
end
