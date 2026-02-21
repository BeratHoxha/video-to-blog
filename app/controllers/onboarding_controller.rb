class OnboardingController < ApplicationController
  before_action :authenticate_user!

  def index
    redirect_to dashboard_path if current_user.onboarding_completed?
  end

  def complete
    current_user.update!(
      use_case: onboarding_params[:use_case],
      plan: onboarding_params[:plan] || :free,
      onboarding_completed: true
    )
    redirect_to dashboard_path
  end

  private

  def onboarding_params
    params.require(:onboarding).permit(:use_case, :plan)
  end
end
