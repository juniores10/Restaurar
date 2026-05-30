export interface EmployeeInfo {
  name: string;
  cpf?: string;
  registration?: string;
  position?: string;
  team?: string;
  sector?: string;
  unit?: string;
  shift?: string;
}

export interface DailyRecord {
  date: Date;
  dayOfWeek: string;
  expectedHours: number;
  workedHours: number;
  absentHours: number;
  normalHours: number;
  overtimeHours: number;
  reason?: string;
  observation?: string;
  absenceType: AbsenceType;
  isComputable: boolean;
}

export type AbsenceType =
  | 'saude'
  | 'injustificada'
  | 'atraso'
  | 'ferias'
  | 'folga'
  | 'feriado'
  | 'compensacao'
  | 'licenca'
  | 'normal'
  | 'outros';

export interface ParsedEmployee {
  info: EmployeeInfo;
  periodStart: Date;
  periodEnd: Date;
  records: DailyRecord[];
}

export interface ParseResult {
  success: boolean;
  employees: ParsedEmployee[];
  errors: ParseError[];
  warnings: string[];
  unparsedLines: UnparsedLine[];
}

export interface ParseError {
  page: number;
  line?: number;
  message: string;
  rawText?: string;
}

export interface UnparsedLine {
  page: number;
  lineNumber: number;
  text: string;
  reason: string;
}

export interface AbsenteeismMetrics {
  totalAbsentHours: number;
  totalExpectedHours: number;
  absenteeismRate: number;
  frequency: number;
  severity: number;
  byType: Record<AbsenceType, { hours: number; count: number }>;
  injustifiedPercentage: number;
  healthPercentage: number;
  delayPercentage: number;
  computableHours: number;
  nonComputableHours: number;
}

export interface TeamMetrics {
  team: string;
  metrics: AbsenteeismMetrics;
  employeeCount: number;
}

export interface EmployeeMetrics {
  employee: EmployeeInfo;
  metrics: AbsenteeismMetrics;
  eventCount: number;
  isRecurrent: boolean;
}

export interface TrendData {
  period: string;
  absenteeismRate: number;
  absentHours: number;
  frequency: number;
}

export interface HeatmapData {
  team: string;
  dayOfWeek: number;
  value: number;
}

export interface AbsenteeismFilter {
  dateStart?: Date;
  dateEnd?: Date;
  teams?: string[];
  positions?: string[];
  employees?: string[];
  absenceTypes?: AbsenceType[];
  isComputable?: boolean;
  sectors?: string[];
  units?: string[];
}

export interface AbsenteeismUpload {
  id: string;
  uploaded_by: string;
  file_name: string;
  period_start: string;
  period_end: string;
  status: string;
  records_count: number;
  error_message?: string;
  created_at: string;
}

export interface AbsenteeismRecord {
  id: string;
  upload_id: string;
  employee_name: string;
  employee_id_external?: string;
  sector?: string;
  unit?: string;
  position?: string;
  team?: string;
  shift?: string;
  record_date: string;
  absence_type: string;
  status: string;
  expected_hours: number;
  absent_hours: number;
  worked_hours: number;
  overtime_hours: number;
  reason?: string;
  hourly_cost?: number;
  raw_data?: Record<string, unknown>;
  created_at: string;
}
