module Api
  class ImagesController < ApplicationController
    skip_before_action :verify_authenticity_token
    before_action :authenticate_user_api!

    MAX_SIZE = 10.megabytes

    def upload
      file = params[:file]

      return render json: { error: "No file provided" }, status: :bad_request \
        unless file.present?

      unless file.content_type.to_s.start_with?("image/")
        return render json: { error: "File must be an image" }, status: :bad_request
      end

      if file.size > MAX_SIZE
        return render json: { error: "Image must be under 10 MB" }, status: :bad_request
      end

      blob = ActiveStorage::Blob.create_and_upload!(
        io: file,
        filename: file.original_filename,
        content_type: file.content_type
      )

      render json: { url: url_for(blob) }
    end
  end
end
