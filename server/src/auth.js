import './env.js';
import { pool } from './db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const TOKEN_EXPIRY = '7d';

const normalizeEmail = (email) => email.trim().toLowerCase();

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
  const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [normalizeEmail(email)]);
  return res.rows[0] ? toUser(res.rows[0]) : null;
}

export async function getUserById(id) {
  const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return res.rows[0] ? toUser(res.rows[0]) : null;
}

export async function createUser({ id, name, email, password, role }) {
  const normalizedEmail = normalizeEmail(email);
  const hashed = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();
  const res = await pool.query(
    `INSERT INTO users (id, name, email, password, role, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [id, name, normalizedEmail, hashed, role, now, now]
  );
  return toUser(res.rows[0]);
}

export async function updateUserPassword(id, password) {
  const hashed = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();
  const res = await pool.query(
    'UPDATE users SET password = $2, updated_at = $3 WHERE id = $1 RETURNING *',
    [id, hashed, now]
  );
  return res.rows[0] ? toUser(res.rows[0]) : null;
}

export async function verifyPassword(email, password) {
  const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [normalizeEmail(email)]);
  const row = res.rows[0];
  if (!row) return null;
  const ok = await bcrypt.compare(password, row.password);
  if (!ok) return null;
  return toUser(row);
}

export async function verifyUserPassword(userId, password) {
  const res = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  const row = res.rows[0];
  if (!row) return false;
  return bcrypt.compare(password, row.password);
}

const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export async function createPasswordResetToken(email) {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  await pool.query(
    `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [`reset-${Date.now()}-${crypto.randomUUID()}`, user.id, tokenHash, expiresAt]
  );

  return { token, expiresAt, user };
}

export async function resetPasswordWithToken(token, password) {
  const tokenHash = hashResetToken(token);
  const res = await pool.query(
    `SELECT * FROM password_reset_tokens
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [tokenHash]
  );

  const resetToken = res.rows[0];
  if (!resetToken) return null;

  const user = await updateUserPassword(resetToken.user_id, password);
  await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [resetToken.id]);
  return user;
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
