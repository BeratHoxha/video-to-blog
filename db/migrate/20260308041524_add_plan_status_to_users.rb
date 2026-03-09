class AddPlanStatusToUsers < ActiveRecord::Migration[7.0]
  def up
    add_column :users, :plan_status, :integer, default: 0, null: false
    add_column :users, :plan_expires_at, :datetime

    # Backfill: existing paid users are considered active (plan != free/0)
    execute "UPDATE users SET plan_status = 2 WHERE plan != 0"
  end

  def down
    remove_column :users, :plan_status
    remove_column :users, :plan_expires_at
  end
end
