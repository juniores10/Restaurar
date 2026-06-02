/*
  # Maintenance Photos Storage

  1. New Storage Bucket
    - `maintenance-photos`: stores photos uploaded when closing maintenance orders
      - Public bucket for easier image display
      - Files organized by order_id

  2. New Column
    - `maintenance_orders.close_photos`: jsonb array storing the uploaded photo URLs and metadata
      - Structure: [{ url, type: 'inicio'|'fim', uploaded_at }]

  3. Security
    - Authenticated users can upload photos
    - Authenticated users can read photos
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_orders' AND column_name = 'close_photos'
  ) THEN
    ALTER TABLE maintenance_orders ADD COLUMN close_photos jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'maintenance-photos',
  'maintenance-photos',
  true,
  10485760,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/heic','image/heif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated can upload maintenance photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'maintenance-photos');

CREATE POLICY "Authenticated can read maintenance photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'maintenance-photos');

CREATE POLICY "Authenticated can delete own maintenance photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'maintenance-photos');
