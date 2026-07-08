/**
 * Constants for the application
 */

const rawApiBaseUrl = import.meta.env.VITE_API_URL?.trim();

const DEFAULT_PROD_API_BASE_URL = "https://telehealth-afyasync.onrender.com/api";

const normalizeApiBaseUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '/api';
  }

  const withoutHash = trimmed.split('#')[0].split('?')[0].replace(/\/+$/, '');
  const lowerValue = withoutHash.toLowerCase();

  if (lowerValue.startsWith('postgres://') || lowerValue.startsWith('postgresql://')) {
    return DEFAULT_PROD_API_BASE_URL;
  }

  if (/^https?:\/\//i.test(withoutHash)) {
    try {
      const url = new URL(withoutHash);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return DEFAULT_PROD_API_BASE_URL;
      }

      const segments = url.pathname.split('/').filter(Boolean);
      const apiIndex = segments.findIndex((segment) => segment.toLowerCase() === 'api');

      if (apiIndex >= 0) {
        url.pathname = `/${segments.slice(0, apiIndex + 1).join('/')}`;
        return url.toString().replace(/\/$/, '');
      }

      return `${url.origin}/api`;
    } catch {
      return DEFAULT_PROD_API_BASE_URL;
    }
  }

  const segments = withoutHash.split('/').filter(Boolean);
  const apiIndex = segments.findIndex((segment) => segment.toLowerCase() === 'api');

  if (apiIndex >= 0) {
    return `/${segments.slice(0, apiIndex + 1).join('/')}`;
  }

  return '/api';
};

const isBrowser = typeof window !== 'undefined';
const isLocalHost = isBrowser && ['localhost', '127.0.0.1'].includes(window.location.hostname);

const resolvedApiBaseUrl = rawApiBaseUrl
  ? normalizeApiBaseUrl(rawApiBaseUrl)
  : isLocalHost
    ? '/api'
    : DEFAULT_PROD_API_BASE_URL;

// Only warn in development when env is missing to avoid noisy production logs.
if (!rawApiBaseUrl && !isLocalHost && import.meta.env.DEV) {
  console.warn('VITE_API_URL is not set. Falling back to default production API endpoint.');
}

export const API_BASE_URL = resolvedApiBaseUrl;
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Secure Telehealth Portal';

// Token storage keys
export const TOKEN_KEY = 'telehealth_token';
export const REFRESH_TOKEN_KEY = 'telehealth_refresh_token';
export const USER_KEY = 'telehealth_user';

// IndexedDB configuration
export const DB_NAME = 'TelehealthDB';
export const DB_VERSION = 2;
export const STORES = {
  PATIENTS: 'patients',
  APPOINTMENTS: 'appointments',
  MEDICAL_RECORDS: 'medicalRecords',
  PRESCRIPTIONS: 'prescriptions',
  USERS: 'users',
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

  // Messages
  MESSAGES_THREAD: (otherUserId: string) => `/messages/thread/${otherUserId}`,
  MESSAGES_UNREAD: '/messages/unread',
  MESSAGES: '/messages',

  // Prescriptions
  PRESCRIPTIONS: '/prescriptions',
  PRESCRIPTION_REFILL_REQUEST: (id: string) => `/prescriptions/${id}/refill-request`,
  PRESCRIPTION_REFILL_COMPLETE: (id: string) => `/prescriptions/${id}/refill-complete`,

  // Medical Records
  MEDICAL_RECORDS: '/medical-records',
  RECORD_DETAIL: (id: string) => `/medical-records/${id}`,

  // Lab Results and Documents
  LAB_RESULTS: '/lab-results',
  DOCUMENTS: '/documents',
  DOCUMENT_DOWNLOAD: (id: string) => `/documents/${id}/download`,

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
