export const USER_TYPES = {
  ADMIN: 1,
  MANAGER: 2,
  EMPLOYEE: 3,
  TERCEIRIZADO: 4,
} as const;

export const EMPLOYEE_STATUS = {
  ACTIVE: 0,
  VACATION: 1,
  LEAVE: 2,
  SUSPENDED: 3,
  TERMINATED: 4,
} as const;

export const STORAGE_BUCKETS = {
  PROFILE_PHOTOS: 'profile-photos',
  DOCUMENTS: 'documents',
  PAYROLL_DOCUMENTS: 'payroll-documents',
  TIME_RECORD_ATTACHMENTS: 'time-record-attachments',
  SIGNATURE_SELFIES: 'signature-selfies',
  EMPLOYEE_SUBMISSIONS: 'employee-submissions',
  NOTICES: 'notices',
  EMPLOYEE_DOCUMENTS: 'employee-documents',
  COMPANY_LOGOS: 'company-logos',
} as const;

export const FILE_CONSTRAINTS = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_PDF_SIZE: 20 * 1024 * 1024, // 20MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;

export const AUTO_REFRESH_INTERVALS = {
  GATE_CONTROL: 5000,
  TIME_TRACKING: 10000,
  NOTIFICATIONS: 30000,
} as const;

export const DATE_FORMATS = {
  BR_SHORT: 'dd/MM/yyyy',
  BR_LONG: 'dd/MM/yyyy HH:mm',
  ISO: 'yyyy-MM-dd',
  TIME_ONLY: 'HH:mm',
} as const;
