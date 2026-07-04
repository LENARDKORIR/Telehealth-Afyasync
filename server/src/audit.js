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

export async function listAuditEvents({
  limit = 50,
  user,
  role,
  action,
  entityType,
  fromDate,
  toDate,
} = {}) {
  const where = [];
  const params = [];

  if (user?.trim()) {
    params.push(`%${user.trim()}%`);
    where.push(`(actor_name ILIKE $${params.length} OR actor_id ILIKE $${params.length})`);
  }

  if (role?.trim()) {
    params.push(role.trim());
    where.push(`actor_role = $${params.length}`);
  }

  if (action?.trim()) {
    params.push(action.trim());
    where.push(`action = $${params.length}`);
  }

  if (entityType?.trim()) {
    params.push(entityType.trim());
    where.push(`entity_type = $${params.length}`);
  }

  if (fromDate?.trim()) {
    params.push(fromDate.trim());
    where.push(`created_at::date >= $${params.length}::date`);
  }

  if (toDate?.trim()) {
    params.push(toDate.trim());
    where.push(`created_at::date <= $${params.length}::date`);
  }

  params.push(limit);

  const result = await pool.query(
    `SELECT *
     FROM audit_logs${where.length > 0 ? `
     WHERE ${where.join(' AND ')}` : ''}
     ORDER BY created_at DESC
     LIMIT $${params.length}`,
    params
  );

  return result.rows.map(toAuditLog);
}
