/*
  # Add Face Detection Data to Signatures

  1. Changes to Tables
    - `payroll_signatures`
      - Add `face_detected` (boolean) - Se detectou pelo menos um rosto
      - Add `faces_count` (integer) - Quantidade de rostos detectados
      - Add `face_confidence` (numeric) - Nível de confiança da detecção (0-1)
      - Add `face_detection_error` (text) - Mensagem de erro caso a detecção falhe

  2. Purpose
    - Armazenar dados de validação facial para auditoria
    - Garantir que a selfie é de uma pessoa real
    - Prevenir fraudes com fotos de fotos ou documentos
*/

-- Add face detection columns to payroll_signatures
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payroll_signatures' AND column_name = 'face_detected'
  ) THEN
    ALTER TABLE payroll_signatures 
    ADD COLUMN face_detected boolean DEFAULT false,
    ADD COLUMN faces_count integer DEFAULT 0,
    ADD COLUMN face_confidence numeric(5, 4),
    ADD COLUMN face_detection_error text;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN payroll_signatures.face_detected IS 'Indica se pelo menos um rosto foi detectado na selfie';
COMMENT ON COLUMN payroll_signatures.faces_count IS 'Quantidade de rostos detectados na selfie';
COMMENT ON COLUMN payroll_signatures.face_confidence IS 'Nível de confiança da detecção facial (0-1)';
COMMENT ON COLUMN payroll_signatures.face_detection_error IS 'Mensagem de erro se a detecção facial falhar';
