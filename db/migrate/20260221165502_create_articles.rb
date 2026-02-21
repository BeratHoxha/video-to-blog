class CreateArticles < ActiveRecord::Migration[7.0]
  def change
    create_table :articles do |t|
      t.references :user, null: true, foreign_key: true
      t.string :title
      t.text :content
      t.string :source_url
      t.integer :source_type, default: 0, null: false
      t.string :output_type
      t.string :output_format
      t.boolean :include_images, default: false, null: false
      t.boolean :use_external_links, default: false, null: false
      t.text :additional_instructions
      t.integer :word_count, default: 0, null: false
      t.integer :status, default: 0, null: false
      t.string :session_id

      t.timestamps
    end

    add_index :articles, :status
    add_index :articles, :session_id
  end
end
