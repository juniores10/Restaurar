export interface Company {
  id: string;
  status: number;
  cnpj: string | null;
  legal_name: string;
  trade_name: string | null;
  zip_code: string | null;
  address: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  city_code: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  website: string | null;
  contact_person: string | null;
  is_legal_entity: boolean;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
}

export interface Location {
  id: string;
  type: number;
  status: number;
  legal_name: string;
  trade_name: string | null;
  branch_type: string | null;
  zip_code: string | null;
  address: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  contact_person: string | null;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
}

export interface DataType {
  id: string;
  type: number;
  status: number;
  description: string;
  short_description: string | null;
  related_code: string | null;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
}

export interface Employee {
  id: string;
  status: number;
  name: string;
  registration_number: string;
  cpf: string;
  password: string;
  birth_date: string | null;
  email: string;
  monthly_workload: number;
  workload_sunday: number;
  workload_monday: number;
  workload_tuesday: number;
  workload_wednesday: number;
  workload_thursday: number;
  workload_friday: number;
  workload_saturday: number;
  schedule_sunday: string | null;
  schedule_monday: string | null;
  schedule_tuesday: string | null;
  schedule_wednesday: string | null;
  schedule_thursday: string | null;
  schedule_friday: string | null;
  schedule_saturday: string | null;
  location_id: string | null;
  workplace_id: string | null;
  department_id: string | null;
  position_id: string | null;
  role_id: string | null;
  initial_balance: number;
  signature_status: number;
  signature_url: string | null;
  photo_url: string | null;
  notes: string | null;
  auth_user_id: string | null;
  user_type_id: number | null;
  phone: string | null;
  address: string | null;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
}

export interface UserType {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface TimeBank {
  id: string;
  status: number;
  employee_id: string;
  location_id: string | null;
  work_date: string;
  entry_time_1: string | null;
  exit_time_1: string | null;
  entry_time_2: string | null;
  exit_time_2: string | null;
  entry_time_3: string | null;
  exit_time_3: string | null;
  entry_time_4: string | null;
  exit_time_4: string | null;
  entry_time_5: string | null;
  exit_time_5: string | null;
  entry_time_6: string | null;
  exit_time_6: string | null;
  absence_hours: number;
  late_hours: number;
  advance_hours: number;
  extra_hours: number;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
}

export interface Schedule {
  id: string;
  status: number;
  employee_id: string;
  location_id: string | null;
  start_datetime: string;
  end_datetime: string;
  leave_type: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
}

export enum EmployeeStatus {
  ACTIVE = 0,
  VACATION = 1,
  SUSPENDED = 2,
  AWAY = 3,
  TERMINATED = 4
}

export enum DataTypeKind {
  ROLE = 1,
  DEPARTMENT = 2,
  POSITION = 3,
  LOCATION = 5,
  STATUS = 6
}

export enum SignatureStatus {
  NOT_UPLOADED = 0,
  PENDING_VERIFICATION = 1,
  REJECTED = 2,
  APPROVED = 3
}

export enum LeaveType {
  NONE = 0,
  UNDEFINED = 1,
  DAY_OFF = 2,
  VACATION = 3,
  SUNDAY = 4,
  HOLIDAY = 5,
  DAY_OFF_SPECIAL = 6,
  LICENSED = 7,
  HOME_OFFICE = 8,
  COMPENSATORY_DAY_OFF = 9,
  SUNDAY_OFF = 10,
  HOLIDAY_OFF = 11
}

export enum RecordStatus {
  NORMAL = 0,
  BLOCKED = 1,
  SUSPENDED = 2,
  CANCELLED = 3
}
