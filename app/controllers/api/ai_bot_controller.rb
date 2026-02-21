module Api
  class AIBotController < ApplicationController
    protect_from_forgery with: :null_session
    before_action :authenticate_user_api!

    def rewrite
      selection = params[:selection].to_s.strip
      prompt = params[:prompt].to_s.strip

      if selection.blank? || prompt.blank?
        return render json: { error: "Selection and prompt are required" },
                      status: :unprocessable_entity
      end

      result = AIBotService.call(
        selection: selection,
        prompt: prompt,
        user: current_user
      )

      render json: {
        result: result,
        ai_bot_calls_remaining: current_user.ai_bot_calls_remaining
      }
    rescue AIBotService::AIBotLimitError => e
      render json: {
        error: e.message,
        upgrade_required: true,
        ai_bot_calls_remaining: 0
      }, status: :forbidden
    end
  end
end
