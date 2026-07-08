import './env.js';
import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
export const hasDatabaseConfig = Boolean(connectionString);

const createMissingDatabaseUrlError = () =>
  new Error('DATABASE_URL is missing. Add it to server/.env or deployment environment variables.');

// Keep current SSL behavior, but opt into libpq compatibility to avoid the pg warning.
const urlWithSSL = connectionString
  ? connectionString.includes('uselibpqcompat=true')
    ? connectionString
    : connectionString + (connectionString.includes('?') ? '&' : '?') + 'uselibpqcompat=true'
  : '';

const unavailablePool = {
  async query() {
    throw createMissingDatabaseUrlError();
  },
  async connect() {
    throw createMissingDatabaseUrlError();
  },
  async end() {},
};

export const pool = hasDatabaseConfig
  ? new Pool({
      connectionString: urlWithSSL,
      ssl: {
        rejectUnauthorized: false,
      },
    })
  : unavailablePool;

export async function ensureDatabaseSchema() {
  if (!hasDatabaseConfig) {
    throw createMissingDatabaseUrlError();
  }

  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
      blood_group TEXT,
      address TEXT NOT NULL,
      medical_history JSONB NOT NULL DEFAULT '[]'::jsonb,
      emergency_contact TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      avatar TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      doctor_id TEXT NOT NULL,
      appointment_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show')),
      reason TEXT NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS medical_records (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      doctor_id TEXT NOT NULL,
      diagnosis TEXT NOT NULL,
      symptoms TEXT[],
      prescription TEXT,
      notes TEXT NOT NULL,
      record_date TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS prescriptions (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      doctor_id TEXT NOT NULL,
      medication_name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      frequency TEXT NOT NULL,
      duration TEXT NOT NULL,
      instructions TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('active', 'refill_requested', 'refilled', 'paused')),
      refill_requested_at TIMESTAMPTZ,
      last_refilled_at TIMESTAMPTZ,
      refill_notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT,
      actor_name TEXT,
      actor_role TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      recipient_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      read_at TIMESTAMPTZ
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lab_results (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      doctor_id TEXT NOT NULL,
      test_name TEXT NOT NULL,
      result_value TEXT NOT NULL,
      unit TEXT,
      reference_range TEXT,
      status TEXT NOT NULL CHECK (status IN ('normal', 'abnormal', 'critical')),
      notes TEXT,
      result_date TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      uploaded_by_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      content_base64 TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}
