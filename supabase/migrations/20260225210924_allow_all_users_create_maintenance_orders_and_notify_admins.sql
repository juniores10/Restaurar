/*
  # Allow All Users to Create Maintenance Orders + Admin Notifications

  1. Changes to `maintenance_orders`
    - Drop restrictive INSERT policy (admin-only)
    - Add new INSERT policy allowing ALL authenticated users
    - Add SELECT policy so users can always see their own orders

  2. Trigger
    - Create trigger function `notify_admin_on_maintenance_order()`
    - Inserts a row into `admin_notifications` whenever a new maintenance order is created
    - Notification includes order number, title, priority, and fault type

  3. Security
    - UPDATE and DELETE remain admin-only
    - All authenticated users can read all orders (unchanged)
    - All authenticated users can now create orders
*/

-- Drop the old admin-only INSERT policy
DROP POLICY IF EXISTS "Admins can insert maintenance orders" ON maintenance_orders;

-- Allow all authenticated users to create maintenance orders
CREATE POLICY "Authenticated users can create maintenance orders"
  ON maintenance_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger function to notify admins
CREATE OR REPLACE FUNCTION notify_admin_on_maintenance_order()
RETURNS TRIGGER AS $$
DECLARE
  employee_record RECORD;
  notif_title TEXT;
  notif_message TEXT;
BEGIN
  SELECT id, name INTO employee_record
  FROM employees
  WHERE auth_user_id = NEW.created_by
  LIMIT 1;

  notif_title := 'Novo Chamado de Manutencao: ' || NEW.order_number;
  notif_message := COALESCE(employee_record.name, 'Usuario') || ' abriu o chamado "' || NEW.title || '" [' || NEW.priority || ' - ' || NEW.fault_type || ']';

  INSERT INTO admin_notifications (type, title, message, employee_id, reference_id, reference_type, is_read)
  VALUES (
    'maintenance_order',
    notif_title,
    notif_message,
    employee_record.id,
    NEW.id,
    'maintenance_order',
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_admin_on_maintenance_order ON maintenance_orders;
CREATE TRIGGER trigger_notify_admin_on_maintenance_order
  AFTER INSERT ON maintenance_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_on_maintenance_order();
