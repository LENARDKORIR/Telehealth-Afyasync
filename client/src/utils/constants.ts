/**
 * Constants for the application
 */

const rawApiBaseUrl = import.meta.env.VITE_API_URL?.trim();

const isLocalhostUrl = (value: string) => /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?\/api\/?$/i.test(value);

export const API_BASE_URL = rawApiBaseUrl && !isLocalhostUrl(rawApiBaseUrl) ? rawApiBaseUrl : '/api';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Secure Telehealth Portal';

// Token storage keys
export const TOKEN_KEY = 'telehealth_token';
export const REFRESH_TOKEN_KEY = 'telehealth_refresh_token';
export const USER_KEY = 'telehealth_user';

// IndexedDB configuration
export const DB_NAME = 'TelehealthDB';
export const DB_VERSION = 1;
export const STORES = {
  PATIENTS: 'patients',
  APPOINTMENTS: 'appointments',
  MEDICAL_RECORDS: 'medicalRecords',
  PRESCRIPTIONS: 'prescriptions',
  SYNC_QUEUE: 'syncQueue',
};

// Sync configuration
export const SYNC_INTERVAL = 30000; // 30 seconds
export const SYNC_BATCH_SIZE = 50;
export const SYNC_TIMEOUT = 10000; // 10 seconds

// API endpoints
export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH_TOKEN: '/auth/refresh',
  LOGOUT: '/auth/logout',

  // Patients
  PATIENTS: '/patients',
  PATIENT_DETAIL: (id: string) => `/patients/${id}`,
  PATIENT_RECORDS: (id: string) => `/patients/${id}/records`,

  // Appointments
  APPOINTMENTS: '/appointments',
  APPOINTMENT_DETAIL: (id: string) => `/appointments/${id}`,

  // Medical Records
  MEDICAL_RECORDS: '/medical-records',
  RECORD_DETAIL: (id: string) => `/medical-records/${id}`,

  // Dashboard
  DASHBOARD_STATS: '/dashboard/stats',
};

// Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  PATIENT: 'patient',
} as const;

// Chart colors
export const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
};

// Appointment statuses
export const APPOINTMENT_STATUSES = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show',
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  UNAUTHORIZED: 'Unauthorized. Please login again.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
};
