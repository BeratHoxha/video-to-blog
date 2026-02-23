module Api
  class GenerationsController < ApplicationController
    protect_from_forgery with: :null_session

    def create
      unless params[:source_url].present? || params[:source_file].present?
        return render json: { error: "Provide a video URL or file" },
                      status: :unprocessable_entity
      end

      if current_user&.free?
        current_user.reset_words_if_needed!
        if current_user.words_remaining <= 0
          return render json: { error: "You've used all 2,000 words in your free plan this month. Upgrade to keep generating." },
                        status: :unprocessable_entity
        end
      end

      article = Article.create!(
        user: current_user,
        source_url: params[:source_url],
        source_type: params[:source_file].present? ? :file : :url,
        output_type: params[:output_type],
        output_format: params[:output_format],
        include_images: ActiveModel::Type::Boolean.new.cast(params[:include_images]) || false,
        use_external_links: ActiveModel::Type::Boolean.new.cast(params[:use_external_links]) || false,
        additional_instructions: params[:additional_instructions],
        session_id: session.id.to_s,
        status: :processing
      )

      user_tier = current_user&.plan || "guest"

      # Run generation in a background thread so the response returns immediately.
      # The frontend polls /api/articles/:id/status until the job completes.
      Thread.new do
        Rails.application.executor.wrap do
          ArticleGenerationJob.perform_now(article.id, user_tier: user_tier)
        end
      end

      render json: { article_id: article.id, status: "processing" },
             status: :created
    end
  end
end
