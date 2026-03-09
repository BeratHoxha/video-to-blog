class CreatePaymentTransactions < ActiveRecord::Migration[7.0]
  def change
    create_table :payment_transactions do |t|
      t.references :user, null: false, foreign_key: true
      t.string :paddle_transaction_id, null: false
      t.string :paddle_subscription_id
      t.string :plan_key
      t.integer :amount_cents
      t.string :currency
      t.integer :status, null: false, default: 0
      t.string :failure_reason
      t.datetime :paid_at

      t.timestamps
    end

    add_index :payment_transactions, :paddle_transaction_id, unique: true
    add_index :payment_transactions, :status
  end
end
