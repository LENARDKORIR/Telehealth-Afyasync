import { pool } from './db.js';

const toMessage = (row) => ({
  id: row.id,
  senderId: row.sender_id,
  recipientId: row.recipient_id,
  subject: row.subject,
  body: row.body,
  createdAt: row.created_at,
  readAt: row.read_at,
  senderName: row.sender_name,
  recipientName: row.recipient_name,
});

export async function listMessageThread(userId, otherUserId) {
  const result = await pool.query(
    `SELECT m.*, sender.name AS sender_name, recipient.name AS recipient_name
     FROM messages m
     LEFT JOIN users sender ON sender.id = m.sender_id
     LEFT JOIN users recipient ON recipient.id = m.recipient_id
     WHERE (m.sender_id = $1 AND m.recipient_id = $2)
        OR (m.sender_id = $2 AND m.recipient_id = $1)
     ORDER BY m.created_at ASC`,
    [userId, otherUserId]
  );

  return result.rows.map(toMessage);
}

export async function createMessage({ senderId, recipientId, subject, body }) {
  const id = `message-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const result = await pool.query(
    `INSERT INTO messages (id, sender_id, recipient_id, subject, body, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING *`,
    [id, senderId, recipientId, subject, body]
  );

  return toMessage(result.rows[0]);
}
