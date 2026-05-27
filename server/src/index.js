import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import QueryStream from 'pg-query-stream';
import { ensureDatabaseSchema, pool } from './db.js';
import { createPatient, deletePatient, getPatientById, listPatients, updatePatient } from './patients.js';
import { createUser, getUserByEmail, verifyPassword, signToken, getUserById, verifyToken } from './auth.js';
import { createAppointment, deleteAppointment, getAppointmentById, listAppointments, listAppointmentsByPatient, updateAppointment } from './appointments.js';
import { createMedicalRecord, deleteMedicalRecord, getRecordById, listMedicalRecordsByPatient, updateMedicalRecord } from './medicalRecords.js';
import { listAuditEvents, logAuditEvent } from './audit.js';
import { createMessage, listMessageThread } from './messages.js';
import { getPrescriptionById, listPrescriptions, listPrescriptionsByPatient, markPrescriptionRefilled, requestRefill } from './prescriptions.js';
import { seedDemoData } from './seedDemoData.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 8000;

const getAuthenticatedUser = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Unauthorized' });
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ message: 'Invalid token' });
    return null;
  }

  const user = await getUserById(payload.id);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return null;
  }

  return user;
};

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'afyasyncc-server',
  });
});

app.get('/api/db-test', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS now');
    res.json({
      ok: true,
      database: 'connected',
      time: result.rows[0].now,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      database: 'disconnected',
      message: error instanceof Error ? error.message : 'Unknown database error',
    });
  }
});

app.get('/api/patients', async (_req, res) => {
  try {
    const patients = await listPatients();
    res.json({ data: patients });
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch patients',
    });
  }
});

app.get('/api/patients/:id', async (req, res) => {
  try {
    const patient = await getPatientById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    return res.json({ data: patient });
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch patient',
    });
  }
});

app.post('/api/patients', async (req, res) => {
  try {
    const patient = await createPatient(req.body);
    void logAuditEvent({
      action: 'create',
      entityType: 'patient',
      entityId: patient.id,
      details: { name: patient.name, email: patient.email },
    });
    res.status(201).json({ data: patient });
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to create patient',
    });
  }
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { id, name, email, password, role } = req.body;
    if (!email || !password || !name || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await getUserByEmail(email);
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const userId = id || `user-${Date.now()}`;
    const user = await createUser({ id: userId, name, email, password, role });
    const token = signToken(user);
    return res.status(201).json({ success: true, token, refreshToken: token, user, message: 'Registered' });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing credentials' });

    const user = await verifyPassword(email, password);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user);
    void logAuditEvent({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'login',
      entityType: 'auth',
      entityId: user.id,
      details: { email: user.email },
    });
    return res.json({ success: true, token, refreshToken: token, user, message: 'Logged in' });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Login failed' });
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Missing refresh token' });
    const payload = verifyToken(refreshToken);
    if (!payload) return res.status(401).json({ message: 'Invalid refresh token' });
    const user = await getUserById(payload.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const token = signToken(user);
    return res.json({ success: true, token, refreshToken: token, user, message: 'Token refreshed' });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Refresh failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      void getUserById(payload.id).then((user) => {
        if (user) {
          return logAuditEvent({
            actorId: user.id,
            actorName: user.name,
            actorRole: user.role,
            action: 'logout',
            entityType: 'auth',
            entityId: user.id,
            details: {},
          });
        }
        return null;
      });
    }
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// Serve generated exports
const exportsDir = path.join(process.cwd(), 'server', 'public', 'exports');
fs.mkdirSync(exportsDir, { recursive: true });
app.use('/exports', express.static(exportsDir));

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const user = await getUserById(payload.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let stats = {};

    if (user.role === 'patient') {
      const appointmentsRes = await pool.query(
        'SELECT * FROM appointments WHERE patient_id = $1',
        [user.id]
      );
      const recordsRes = await pool.query(
        'SELECT * FROM medical_records WHERE patient_id = $1',
        [user.id]
      );

      const appointments = appointmentsRes.rows || [];
      const records = recordsRes.rows || [];

      stats = {
        myAppointments: appointments.length,
        upcomingAppointments: appointments.filter((a) => a.status === 'scheduled').length,
        completedAppointments: appointments.filter((a) => a.status === 'completed').length,
        completedRecords: records.length,
      };
    } else {
      // Doctor/Admin stats
      const patientsRes = await pool.query('SELECT COUNT(*) FROM patients');
      const appointmentsRes = await pool.query('SELECT * FROM appointments');
      const recordsRes = await pool.query('SELECT COUNT(*) FROM medical_records');

      const appointments = appointmentsRes.rows || [];

      stats = {
        totalPatients: parseInt(patientsRes.rows[0].count),
        appointmentsToday: appointments.filter((a) => new Date(a.appointment_date).toDateString() === new Date().toDateString()).length,
        totalAppointments: appointments.length,
        completedAppointments: appointments.filter((a) => a.status === 'completed').length,
        pendingReports: 0,
        criticalCases: 0,
      };
    }

    return res.json({ data: stats });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to fetch dashboard stats' });
  }
});

app.get('/api/audit-logs', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const user = await getUserById(payload.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const filters = {
      limit: Math.min(Math.max(Number(req.query.limit) || 50, 1), 100),
      user: req.query.user || undefined,
      role: req.query.role || undefined,
      action: req.query.action || undefined,
      entityType: req.query.entityType || req.query.entity_type || undefined,
      fromDate: req.query.from || undefined,
      toDate: req.query.to || undefined,
    };

    const logs = await listAuditEvents(filters);
    return res.json({ data: logs });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to fetch audit logs' });
  }
});

// Export audit logs as CSV or PDF and return URL
app.get('/api/audit-logs/export', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const payload = verifyToken(token);
    if (!payload) return res.status(401).json({ message: 'Invalid token' });

    const user = await getUserById(payload.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const format = (req.query.format || 'csv').toString().toLowerCase();
    const template = (req.query.template || '').toString().toLowerCase();
    const filters = {
      limit: Math.min(Math.max(Number(req.query.limit) || 1000, 1), 5000),
      user: req.query.user || undefined,
      role: req.query.role || undefined,
      action: req.query.action || undefined,
      entityType: req.query.entityType || req.query.entity_type || undefined,
      fromDate: req.query.from || undefined,
      toDate: req.query.to || undefined,
    };

    const logs = await listAuditEvents(filters);

    const timestamp = Date.now();
    if (format === 'csv') {
      const headers = ['id','actorName','actorRole','action','entityType','entityId','details','createdAt'];
      const rows = logs.map((r) => [
        r.id,
        r.actorName || '',
        r.actorRole || '',
        r.action,
        r.entityType,
        r.entityId || '',
        typeof r.details === 'object' ? JSON.stringify(r.details) : String(r.details || ''),
        new Date(r.createdAt).toISOString(),
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(','))].join('\n');
      const filename = `audit-logs-${timestamp}.csv`;
      const filepath = path.join(exportsDir, filename);
      fs.writeFileSync(filepath, csv, 'utf8');
      // if template=combined, fall through to also build PDF and return both urls
      if (template === 'combined' || template === 'both') {
        // generate PDF as well below by letting code continue
      } else {
        return res.json({ url: `/exports/${filename}` });
      }
    }

    if (format === 'pdf' || template === 'combined' || template === 'both') {
      const filename = `audit-logs-${timestamp}.pdf`;
      const filepath = path.join(exportsDir, filename);
      const doc = new PDFDocument({ size: 'A4', margin: 36 });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // PDF table layout settings
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      // column widths in proportion; details column gets most space
      const colWidths = [140, 100, 70, 90, 90, pageWidth - (140 + 100 + 70 + 90 + 90) - 20];
      const headers = ['Timestamp', 'Actor', 'Role', 'Action', 'Entity', 'Details'];

      const headerFontSize = 12;
      const rowFontSize = 9;
      const rowPadding = 6;

      const startX = doc.x;

      const renderHeader = () => {
        doc.fontSize(headerFontSize).font('Helvetica-Bold');
        let x = startX;
        const y = doc.y;
        // header background
        doc.save().rect(x - 4, y - 4, pageWidth + 8, headerFontSize + 12).fill('#F3F4F6').restore();
        for (let i = 0; i < headers.length; i++) {
          doc.fillColor('#111827').text(headers[i], x + 2, y, { width: colWidths[i] - 4, align: 'left' });
          x += colWidths[i] + 8;
        }
        doc.moveDown(1.0);
        doc.fontSize(rowFontSize).font('Helvetica').fillColor('#000000');
      };

      const drawRowBorders = (yTop, rowHeight) => {
        let x = startX - 4;
        // outer rect
        doc.save().lineWidth(0.5).rect(x, yTop - 4, pageWidth + 8, rowHeight + 8).stroke('#E5E7EB').restore();
        // vertical separators
        x = startX;
        for (let i = 0; i < colWidths.length; i++) {
          doc.moveTo(x + colWidths[i] + 4, yTop - 4).lineTo(x + colWidths[i] + 4, yTop + rowHeight + 4).stroke('#E5E7EB');
          x += colWidths[i] + 8;
        }
      };

      renderHeader();

      for (const r of logs) {
        // Prepare cell texts
        const cols = [
          new Date(r.createdAt).toLocaleString(),
          r.actorName || r.actorId || 'System',
          r.actorRole || 'system',
          r.action,
          r.entityType + (r.entityId ? ` (${r.entityId})` : ''),
          typeof r.details === 'object' ? JSON.stringify(r.details) : String(r.details || ''),
        ];

        // Measure row height by measuring the tallest cell
        let maxHeight = 0;
        let x = startX;
        for (let i = 0; i < cols.length; i++) {
          const h = doc.heightOfString(cols[i], { width: colWidths[i] - 8, align: 'left' });
          if (h > maxHeight) maxHeight = h;
          x += colWidths[i] + 8;
        }
        const rowHeight = Math.max(maxHeight, rowFontSize) + rowPadding;

        // page break check
        if (doc.y > doc.page.height - doc.page.margins.bottom - rowHeight - 40) {
          doc.addPage();
          renderHeader();
        }

        const yTop = doc.y;

        // draw cells
        x = startX;
        for (let i = 0; i < cols.length; i++) {
          doc.text(cols[i], x + 4, yTop, { width: colWidths[i] - 8, align: 'left' });
          x += colWidths[i] + 8;
        }

        // draw borders for the row
        drawRowBorders(yTop, rowHeight);

        doc.moveDown((rowHeight + 6) / 12);
      }

      doc.end();
      stream.on('finish', () => {
        if (template === 'combined' || template === 'both') {
          // both CSV and PDF were generated earlier (CSV filename)
          const csvName = `audit-logs-${timestamp}.csv`;
          return res.json({ urls: [`/exports/${csvName}`, `/exports/${filename}`] });
        }
        return res.json({ url: `/exports/${filename}` });
      });
      stream.on('error', (err) => {
        console.error('Failed to write PDF', err);
        return res.status(500).json({ message: 'Failed to write PDF' });
      });
      return;
    }

    return res.status(400).json({ message: 'Unsupported format' });
  } catch (error) {
    console.error('Export failed', error);
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Export failed' });
  }
});

// Stream audit logs as CSV (attachment) to avoid large file writes
app.get('/api/audit-logs/stream', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const payload = verifyToken(token);
    if (!payload) return res.status(401).json({ message: 'Invalid token' });

    const user = await getUserById(payload.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    // Build WHERE clause similar to listAuditEvents
    const where = [];
    const params = [];
    if (req.query.user?.toString().trim()) {
      params.push(`%${req.query.user.toString().trim()}%`);
      where.push(`(actor_name ILIKE $${params.length} OR actor_id ILIKE $${params.length})`);
    }
    if (req.query.role?.toString().trim()) {
      params.push(req.query.role.toString().trim());
      where.push(`actor_role = $${params.length}`);
    }
    if (req.query.action?.toString().trim()) {
      params.push(req.query.action.toString().trim());
      where.push(`action = $${params.length}`);
    }
    if (req.query.entityType?.toString().trim()) {
      params.push(req.query.entityType.toString().trim());
      where.push(`entity_type = $${params.length}`);
    }
    if (req.query.from) {
      params.push(req.query.from.toString());
      where.push(`created_at::date >= $${params.length}::date`);
    }
    if (req.query.to) {
      params.push(req.query.to.toString());
      where.push(`created_at::date <= $${params.length}::date`);
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 1000, 1), 5000);
    params.push(limit);

    const sql = `SELECT * FROM audit_logs${where.length > 0 ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC LIMIT $${params.length}`;

    const client = await pool.connect();
    try {
      const qs = new QueryStream(sql, params);
      const stream = client.query(qs);

      const timestamp = Date.now();
      const filename = `audit-logs-${timestamp}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.write('id,actorName,actorRole,action,entityType,entityId,details,createdAt\n');

      stream.on('data', (row) => {
        const r = {
          id: row.id,
          actorName: row.actor_name,
          actorRole: row.actor_role,
          action: row.action,
          entityType: row.entity_type,
          entityId: row.entity_id,
          details: row.details,
          createdAt: row.created_at,
        };
        const rowCsv = [
          r.id,
          r.actorName || '',
          r.actorRole || '',
          r.action,
          r.entityType,
          r.entityId || '',
          typeof r.details === 'object' ? JSON.stringify(r.details) : String(r.details || ''),
          new Date(r.createdAt).toISOString(),
        ].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',');
        res.write(rowCsv + '\n');
      });

      stream.on('end', () => {
        res.end();
        client.release();
      });

      stream.on('error', (err) => {
        console.error('Query stream error', err);
        res.status(500).json({ message: 'Stream failed' });
        client.release();
      });
    } catch (err) {
      client.release();
      throw err;
    }
  } catch (error) {
    console.error('Stream export failed', error);
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Export failed' });
  }
});

app.get('/api/patients/:id/records', async (req, res) => {
  try {
    const records = await listMedicalRecordsByPatient(req.params.id);
    res.json({ data: records });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to fetch medical records' });
  }
});

app.put('/api/patients/:id', async (req, res) => {
  try {
    const patient = await updatePatient(req.params.id, req.body);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    void logAuditEvent({
      action: 'update',
      entityType: 'patient',
      entityId: patient.id,
      details: { name: patient.name, email: patient.email },
    });

    return res.json({ data: patient });
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to update patient',
    });
  }
});

app.delete('/api/patients/:id', async (req, res) => {
  try {
    const deleted = await deletePatient(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    void logAuditEvent({
      action: 'delete',
      entityType: 'patient',
      entityId: req.params.id,
      details: {},
    });

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to delete patient',
    });
  }
});

// Patient-specific appointments
app.get('/api/appointments', async (_req, res) => {
  try {
    const appointments = await listAppointments();
    res.json({ data: appointments });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to fetch appointments' });
  }
});

app.get('/api/appointments/patient/:patientId', async (req, res) => {
  try {
    const appointments = await listAppointmentsByPatient(req.params.patientId);
    res.json({ data: appointments });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to fetch appointments' });
  }
});

app.get('/api/appointments/:id', async (req, res) => {
  try {
    const appointment = await getAppointmentById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ data: appointment });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to fetch appointment' });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const appointment = await createAppointment(req.body);
    void logAuditEvent({
      action: 'create',
      entityType: 'appointment',
      entityId: appointment.id,
      details: {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentDate: appointment.appointmentDate,
        status: appointment.status,
      },
    });
    res.status(201).json({ data: appointment });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to create appointment' });
  }
});

app.put('/api/appointments/:id', async (req, res) => {
  try {
    const appointment = await updateAppointment(req.params.id, req.body);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    void logAuditEvent({
      action: 'update',
      entityType: 'appointment',
      entityId: appointment.id,
      details: {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentDate: appointment.appointmentDate,
        status: appointment.status,
      },
    });
    res.json({ data: appointment });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to update appointment' });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const deleted = await deleteAppointment(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Appointment not found' });
    void logAuditEvent({
      action: 'delete',
      entityType: 'appointment',
      entityId: req.params.id,
      details: {},
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to delete appointment' });
  }
});

// Patient-specific medical records
app.get('/api/medical-records/patient/:patientId', async (req, res) => {
  try {
    const records = await listMedicalRecordsByPatient(req.params.patientId);
    res.json({ data: records });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to fetch medical records' });
  }
});

app.get('/api/medical-records/:id', async (req, res) => {
  try {
    const record = await getRecordById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Medical record not found' });
    res.json({ data: record });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to fetch medical record' });
  }
});

app.post('/api/medical-records', async (req, res) => {
  try {
    const record = await createMedicalRecord(req.body);
    void logAuditEvent({
      action: 'create',
      entityType: 'medical_record',
      entityId: record.id,
      details: { patientId: record.patientId, doctorId: record.doctorId, diagnosis: record.diagnosis },
    });
    res.status(201).json({ data: record });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to create medical record' });
  }
});

app.put('/api/medical-records/:id', async (req, res) => {
  try {
    const record = await updateMedicalRecord(req.params.id, req.body);
    if (!record) return res.status(404).json({ message: 'Medical record not found' });
    void logAuditEvent({
      action: 'update',
      entityType: 'medical_record',
      entityId: record.id,
      details: { patientId: record.patientId, doctorId: record.doctorId, diagnosis: record.diagnosis },
    });
    res.json({ data: record });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to update medical record' });
  }
});

app.delete('/api/medical-records/:id', async (req, res) => {
  try {
    const deleted = await deleteMedicalRecord(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Medical record not found' });
    void logAuditEvent({
      action: 'delete',
      entityType: 'medical_record',
      entityId: req.params.id,
      details: {},
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to delete medical record' });
  }
});

app.get('/api/prescriptions', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) {
      return;
    }

    if (user.role === 'patient') {
      const prescriptions = await listPrescriptionsByPatient(user.id);
      return res.json({ data: prescriptions });
    }

    const prescriptions = await listPrescriptions();
    return res.json({ data: prescriptions });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to fetch prescriptions' });
  }
});

app.post('/api/prescriptions/:id/refill-request', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) {
      return;
    }

    const prescription = await getPrescriptionById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    if (user.role === 'patient' && prescription.patientId !== user.id) {
      return res.status(403).json({ message: 'You can only request refills for your own prescriptions' });
    }

    const updated = await requestRefill(req.params.id, req.body?.notes || '');
    if (!updated) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    void logAuditEvent({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'update',
      entityType: 'prescription',
      entityId: updated.id,
      details: { status: updated.status, medicationName: updated.medicationName },
    });

    return res.json({ data: updated });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to request refill' });
  }
});

app.put('/api/prescriptions/:id/refill-complete', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) {
      return;
    }

    if (user.role === 'patient') {
      return res.status(403).json({ message: 'Patients cannot complete refill requests' });
    }

    const updated = await markPrescriptionRefilled(req.params.id, req.body?.notes || '');
    if (!updated) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    void logAuditEvent({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'update',
      entityType: 'prescription',
      entityId: updated.id,
      details: { status: updated.status, medicationName: updated.medicationName },
    });

    return res.json({ data: updated });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to update refill status' });
  }
});

app.get('/api/messages/thread/:otherUserId', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) {
      return;
    }

    const messages = await listMessageThread(user.id, req.params.otherUserId);
    return res.json({ data: messages });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to fetch messages' });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) {
      return;
    }

    const { recipientId, subject, body } = req.body;
    if (!recipientId || !subject || !body) {
      return res.status(400).json({ message: 'Missing message fields' });
    }

    const message = await createMessage({
      senderId: user.id,
      recipientId,
      subject,
      body,
    });

    void logAuditEvent({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'create',
      entityType: 'message',
      entityId: message.id,
      details: { recipientId, subject },
    });

    return res.status(201).json({ data: message });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to send message' });
  }
});

async function start() {
  try {
    await ensureDatabaseSchema();
    await seedDemoData();

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
if (process.env.NODE_ENV !== 'test') {
  start();
}

export { app, start };
