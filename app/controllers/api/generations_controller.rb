module Api
  class GenerationsController < ApplicationController
    protect_from_forgery with: :null_session

    def create
      validate_source_params!
      return if performed?

      validate_source_file!
      return if performed?

      check_word_limit!
      return if performed?

      article = Article.create!(build_article_attrs)
      attach_source_file!(article)
      enqueue_generation!(article, current_user&.plan || "guest")

      render json: { article_id: article.id, status: "processing" }, status: :created
    rescue ActiveRecord::RecordInvalid => e
      render json: { error: e.record.errors.full_messages.to_sentence },
             status: :unprocessable_entity
    rescue StandardError => e
      article&.destroy
      render json: { error: "Failed to process file: #{e.message}" },
             status: :unprocessable_entity
    end

    private

    def validate_source_params!
      return if params[:source_url].present? || params[:source_file].present?

      render json: { error: "Provide a video URL or file" }, status: :unprocessable_entity
    end

    def validate_source_file!
      file = params[:source_file]
      return if file.blank?

      unless file.content_type.to_s.start_with?("video/", "audio/")
        render json: { error: "File must be a video or audio file" },
               status: :unprocessable_entity
        return
      end

      return unless file.size > 500.megabytes

      render json: { error: "File must be under 500 MB" }, status: :unprocessable_entity
    end

    def check_word_limit!
      return unless current_user&.free?

      current_user.reset_words_if_needed!
      return if current_user.words_remaining.positive?

      render json: {
        error: "You've used all 2,000 words in your free plan this month. " \
               "Upgrade to keep generating."
      }, status: :unprocessable_entity
    end

    def build_article_attrs
      {
        user: current_user,
        source_url: params[:source_url],
        source_type: params[:source_file].present? ? :file : :url,
        content_mode: params[:content_mode].presence || "article",
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

    def attach_source_file!(article)
      return if params[:source_file].blank?

      article.source_file.attach(
        io: params[:source_file],
        filename: params[:source_file].original_filename,
        content_type: params[:source_file].content_type
      )
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
