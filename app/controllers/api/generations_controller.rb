module Api
  class GenerationsController < ApplicationController
    protect_from_forgery with: :null_session

    def create
      validate_source_params!
      return if performed?

      check_word_limit!
      return if performed?

      article = Article.create!(build_article_attrs)
      enqueue_generation!(article, current_user&.plan || "guest")

      render json: { article_id: article.id, status: "processing" }, status: :created
    rescue ActiveRecord::RecordInvalid => e
      render json: { error: e.record.errors.full_messages.to_sentence },
             status: :unprocessable_entity
    end

    private

    def validate_source_params!
      return if params[:source_url].present? || params[:source_file].present?

      render json: { error: "Provide a video URL or file" }, status: :unprocessable_entity
    end

    def check_word_limit!
      return unless current_user&.free?

      current_user.reset_words_if_needed!
      return if current_user.words_remaining.positive?

      msg = "You've used all 2,000 words in your free plan this month. " \
            "Upgrade to keep generating."
      render json: { error: msg }, status: :unprocessable_entity
    end

    def build_article_attrs
      {
        user: current_user,
        source_url: params[:source_url],
        source_type: params[:source_file].present? ? :file : :url,
        output_type: params[:output_type],
        output_format: params[:output_format],
        include_images: cast_bool(params[:include_images]),
        use_external_links: cast_bool(params[:use_external_links]),
        additional_instructions: params[:additional_instructions],
        session_id: session.id.to_s,
        status: :processing
      }
    end

    def cast_bool(value)
      ActiveModel::Type::Boolean.new.cast(value) || false
    end

    def enqueue_generation!(article, user_tier)
      # Run generation in a background thread so the response returns immediately.
      # The frontend polls /api/articles/:id/status until the job completes.
      Thread.new do
        Rails.application.executor.wrap do
          ArticleGenerationJob.perform_now(article.id, user_tier: user_tier)
        end
      end
    end
  end
end
