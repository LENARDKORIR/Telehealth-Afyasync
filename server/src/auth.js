import { pool } from './db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const TOKEN_EXPIRY = '7d';

const toUser = (row) => ({
  id: row.id,
  email: row.email,
  name: row.name,
  role: row.role,
  avatar: row.avatar,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function getUserByEmail(email) {
  const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows[0] ? toUser(res.rows[0]) : null;
}

export async function getUserById(id) {
  const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return res.rows[0] ? toUser(res.rows[0]) : null;
}

export async function createUser({ id, name, email, password, role }) {
  const hashed = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();
  const res = await pool.query(
    `INSERT INTO users (id, name, email, password, role, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [id, name, email, hashed, role, now, now]
  );
  return toUser(res.rows[0]);
}

export async function verifyPassword(email, password) {
  const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const row = res.rows[0];
  if (!row) return null;
  const ok = await bcrypt.compare(password, row.password);
  if (!ok) return null;
  return toUser(row);
}

export function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
