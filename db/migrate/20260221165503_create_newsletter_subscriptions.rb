class CreateNewsletterSubscriptions < ActiveRecord::Migration[7.0]
  def change
    create_table :newsletter_subscriptions do |t|
      t.string :email, null: false
      t.timestamps
    end

    add_index :newsletter_subscriptions, :email, unique: true
  end
end
