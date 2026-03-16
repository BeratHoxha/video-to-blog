class AddContentModeToArticles < ActiveRecord::Migration[7.0]
  def change
    add_column :articles, :content_mode, :string, default: "article", null: false
  end
end
