module Api
  class ArticlesController < ApplicationController
    protect_from_forgery with: :null_session
    before_action :authenticate_user_api!, only: [:index, :destroy]
    before_action :load_article, only: [:show, :status, :export, :destroy]

    def index
      articles = current_user.articles.completed.recent
      render json: { articles: articles.map(&:as_api_json) }
    end

    def show
      render json: { article: @article.as_api_json }
    end

    def status
      render json: @article.as_status_json
    end

    def export
      authenticate_user_api!
      return unless current_user

      format = params[:format].to_s.downcase
      allowed = %w[pdf docx pptx]

      unless allowed.include?(format)
        return render json: { error: "Invalid format" }, status: :bad_request
      end

      unless @article.user == current_user
        return render json: { error: "Unauthorized" }, status: :unauthorized
      end

      content = ExportService.call(article: @article, format: format)
      mime_types = {
        "pdf" => "application/pdf",
        "docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "pptx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }

      send_data content,
                type: mime_types[format],
                filename: "#{@article.title.parameterize}.#{format}",
                disposition: "attachment"
    rescue ExportService::ExportError => e
      render json: { error: e.message }, status: :unprocessable_entity
    end

    def destroy
      @article.destroy
      head :no_content
    end

    private

    def load_article
      @article = Article.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Article not found" }, status: :not_found
    end
  end
end
