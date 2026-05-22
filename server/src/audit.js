import { pool } from './db.js';

const toAuditLog = (row) => ({
  id: row.id,
  actorId: row.actor_id,
  actorName: row.actor_name,
  actorRole: row.actor_role,
  action: row.action,
  entityType: row.entity_type,
  entityId: row.entity_id,
  details: row.details,
  createdAt: row.created_at,
});

export async function logAuditEvent({
  actorId = null,
  actorName = null,
  actorRole = null,
  action,
  entityType,
  entityId = null,
  details = {},
}) {
  const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const result = await pool.query(
    `INSERT INTO audit_logs (
      id,
      actor_id,
      actor_name,
      actor_role,
      action,
      entity_type,
      entity_id,
      details
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb) RETURNING *`,
    [id, actorId, actorName, actorRole, action, entityType, entityId, JSON.stringify(details)]
  );

  return toAuditLog(result.rows[0]);
}

export async function listAuditEvents(limit = 50) {
  const result = await pool.query(
    `SELECT *
     FROM audit_logs
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows.map(toAuditLog);
}
