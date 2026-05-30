/*
  # Create Schedule System - Tables

  1. New Tables
    - `shift_times` - Stores shift time options
    - `day_options` - Stores day type options
    - `schedules` - Monthly schedule headers
    - `schedule_employees` - Employees assigned to a schedule
    - `schedule_entries` - Daily entries for each employee

  2. Security
    - Enable RLS on all tables
*/

CREATE TABLE IF NOT EXISTS shift_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_time time,
  end_time time,
  status integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shift_times ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS day_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text DEFAULT '#FFFF00',
  status integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE day_options ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department_id uuid REFERENCES departments(id),
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL,
  status integer DEFAULT 0,
  created_by uuid REFERENCES employees(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS schedule_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid REFERENCES schedules(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(schedule_id, employee_id)
);

ALTER TABLE schedule_employees ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS schedule_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid REFERENCES schedules(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  day integer NOT NULL CHECK (day >= 1 AND day <= 31),
  shift_time_id uuid REFERENCES shift_times(id),
  day_option_id uuid REFERENCES day_options(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(schedule_id, employee_id, day)
);

ALTER TABLE schedule_entries ENABLE ROW LEVEL SECURITY;

INSERT INTO shift_times (name, start_time, end_time) VALUES
  ('07h às 16h', '07:00', '16:00'),
  ('08h às 17h', '08:00', '17:00'),
  ('09h às 18h', '09:00', '18:00'),
  ('10h às 19h', '10:00', '19:00'),
  ('11h às 20h', '11:00', '20:00'),
  ('13h às 22h', '13:00', '22:00'),
  ('15h às 00h', '15:00', '00:00'),
  ('10h às 22h', '10:00', '22:00'),
  ('12h às 00h', '12:00', '00:00')
ON CONFLICT DO NOTHING;

INSERT INTO day_options (name, color) VALUES
  ('SÁBADO', '#FFFF00'),
  ('DOMINGO', '#FFFF00'),
  ('FOLGA', '#90EE90'),
  ('FOLGA BH', '#90EE90'),
  ('FOLGA SÁB', '#90EE90'),
  ('FOLGA DOMINGO', '#90EE90'),
  ('FOLGA FERIADO', '#90EE90'),
  ('DAY OFF', '#87CEEB'),
  ('FERIADO', '#FF6B6B')
ON CONFLICT DO NOTHING;
