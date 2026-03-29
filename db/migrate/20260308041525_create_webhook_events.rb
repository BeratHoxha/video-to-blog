class CreateWebhookEvents < ActiveRecord::Migration[7.0]
  def change
    create_table :webhook_events do |t|
      t.string :provider, null: false
      t.string :event_id, null: false
      t.string :event_type, null: false
      t.datetime :processed_at, null: false

      t.timestamps
    end

    add_index :webhook_events, %i[provider event_id], unique: true
  end
end
