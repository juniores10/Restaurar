/*
  # Add initial hour balance to employees

  1. Modified Tables
    - `employees`
      - `initial_hour_balance` (numeric, default 0) - Initial hour bank balance in decimal hours for time tracking calculations

  2. Notes
    - This field stores the starting balance (positive or negative) that will be added to the calculated time bank balance
    - Value is in decimal hours (e.g., 2.5 = 2h30min, -1.25 = -1h15min)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'initial_hour_balance'
  ) THEN
    ALTER TABLE employees ADD COLUMN initial_hour_balance numeric DEFAULT 0;
  END IF;
END $$;
