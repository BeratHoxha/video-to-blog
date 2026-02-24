class Article < ApplicationRecord
  belongs_to :user, optional: true

  enum status: { processing: 0, complete: 1, failed: 2 }
  enum source_type: { url: 0, file: 1 }

  validates :status, presence: true
  validate :user_has_remaining_words_for_generation, on: :create

  scope :recent, -> { order(created_at: :desc) }
  scope :for_user, ->(user) { where(user: user) }
  scope :completed, -> { where(status: :complete) }

  before_save :calculate_word_count, if: :content_changed?

  def generation_options
    {
      output_type: output_type,
      output_format: output_format,
      include_images: include_images,
      use_external_links: use_external_links,
      additional_instructions: additional_instructions
    }
  end

  def as_api_json
    {
      id: id,
      title: title,
      content: content,
      source_url: source_url,
      source_type: source_type,
      output_type: output_type,
      output_format: output_format,
      include_images: include_images,
      use_external_links: use_external_links,
      word_count: word_count,
      status: status,
      created_at: created_at
    }
  end

  def as_status_json
    base = { id: id, status: status, title: title }
    return base unless complete?

    base.merge(content: content, word_count: word_count, output_format: output_format)
  end

  private

  def calculate_word_count
    return unless content.present?

    self.word_count = content.gsub(/<[^>]+>/, " ").split.length
  end

  def user_has_remaining_words_for_generation
    return unless user&.free?
    return unless user.persisted?
    return unless user.words_remaining.to_i <= 0

    errors.add(:base, "Monthly word limit reached. Upgrade to continue.")
  end
end
