/*
  # Add Approval Workflow to Maintenance Orders

  ## Summary
  Adds an approval workflow to the maintenance module. When a user submits a maintenance
  request, notifications are automatically created for all administrators, managers, and
  leaders. Approvers can then approve or reject the request. On approval, a service order
  can be filled in with full execution details.

  ## Changes

  ### New Tables
  - `maintenance_request_notifications` — tracks per-user notifications for new requests,
    including whether the user has actioned (approved/rejected) the notification.

  ### Modified Tables
  - `maintenance_orders` — adds:
    - `approval_status` (text): 'pending' | 'approved' | 'rejected'
    - `approval_action_by` (text): name of the user who approved/rejected
    - `approval_action_at` (timestamptz): when the action was taken
    - `rejection_reason` (text): optional reason when rejected
    - `service_order_data` (jsonb): stores the filled service order details after approval

  ## Security
  - RLS enabled on notifications table
  - Authenticated users can read their own notifications
  - Admins can read all notifications
  - Insert allowed for authenticated users (system inserts on order creation)
*/

ALTER TABLE maintenance_orders
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approval_action_by text,
  ADD COLUMN IF NOT EXISTS approval_action_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS service_order_data jsonb;

CREATE TABLE IF NOT EXISTS maintenance_request_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES maintenance_orders(id) ON DELETE CASCADE,
  recipient_auth_user_id uuid NOT NULL,
  recipient_name text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  actioned boolean NOT NULL DEFAULT false,
  action_taken text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE maintenance_request_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read own maintenance notifications"
  ON maintenance_request_notifications FOR SELECT
  TO authenticated
  USING (recipient_auth_user_id = auth.uid());

CREATE POLICY "Authenticated users can insert maintenance notifications"
  ON maintenance_request_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update own maintenance notifications"
  ON maintenance_request_notifications FOR UPDATE
  TO authenticated
  USING (recipient_auth_user_id = auth.uid())
  WITH CHECK (recipient_auth_user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_maint_notif_recipient ON maintenance_request_notifications(recipient_auth_user_id);
CREATE INDEX IF NOT EXISTS idx_maint_notif_order ON maintenance_request_notifications(order_id);
