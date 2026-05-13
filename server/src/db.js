import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is missing. Add it to server/.env or deployment environment variables.');
}

// Keep current SSL behavior, but opt into libpq compatibility to avoid the pg warning.
const urlWithSSL = connectionString.includes('uselibpqcompat=true')
  ? connectionString
  : connectionString + (connectionString.includes('?') ? '&' : '?') + 'uselibpqcompat=true';

export const pool = new Pool({
  connectionString: urlWithSSL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function ensureDatabaseSchema() {
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
}
