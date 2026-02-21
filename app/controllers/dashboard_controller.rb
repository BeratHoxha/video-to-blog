class DashboardController < ApplicationController
  before_action :authenticate_user!

  def index
    redirect_to onboarding_path unless current_user.onboarding_completed?
  end
end
