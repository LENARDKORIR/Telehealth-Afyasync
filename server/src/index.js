import { serverRoot } from './env.js';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import QueryStream from 'pg-query-stream';
import { ensureDatabaseSchema, hasDatabaseConfig, pool } from './db.js';
import { createPatient, deletePatient, getPatientById, listPatients, updatePatient } from './patients.js';
import { createUser, getUserByEmail, verifyPassword, signToken, getUserById, verifyToken } from './auth.js';
import { createAppointment, deleteAppointment, getAppointmentById, listAppointments, listAppointmentsByPatient, updateAppointment } from './appointments.js';
import { createMedicalRecord, deleteMedicalRecord, getRecordById, listMedicalRecordsByPatient, updateMedicalRecord } from './medicalRecords.js';
import { listAuditEvents, logAuditEvent } from './audit.js';
import { createMessage, listMessageThread, listUnreadMessages, markMessageThreadRead } from './messages.js';
import { getPrescriptionById, listPrescriptions, listPrescriptionsByPatient, markPrescriptionRefilled, requestRefill } from './prescriptions.js';
import { createDocument, createLabResult, getDocumentById, listDocuments, listDocumentsByOwner, listLabResults, listLabResultsByPatient } from './records.js';
import { seedRealData } from './seedRealData.js';

const app = express();
const port = Number(process.env.PORT) || 8000;
const maxDocumentBytes = 5 * 1024 * 1024;

const normalizeBase64Document = (value) => {
  if (typeof value !== 'string') return '';
  return value.replace(/^data:[^;]+;base64,/, '').trim();
};

const isValidBase64Document = (value) => {
  if (!value || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) return false;
  const normalized = value.replace(/=+$/, '');
  const encoded = Buffer.from(value, 'base64').toString('base64').replace(/=+$/, '');
  return normalized === encoded;
};

const sanitizeDownloadFileName = (value) => {
  const sanitized = String(value || 'document')
    .replace(/[\r\n"]/g, '')
    .replace(/[\\/]/g, '-')
    .trim();

  return sanitized || 'document';
};

const parseDateValue = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toDateKey = (date) => date.toISOString().slice(0, 10);

const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const addDays = (date, days) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

const percentage = (part, total) => (total > 0 ? Math.round((part / total) * 100) : 0);

const buildProviderAnalytics = ({ patients, appointments, records }) => {
  const now = new Date();
  const today = startOfDay(now);
  const todayKey = toDateKey(today);
  const nextDay = addDays(today, 1);
  const last30Start = addDays(today, -30);
  const previous30Start = addDays(today, -60);
  const followUpGapDays = 30;
  const followUpGapStart = addDays(today, -followUpGapDays);

  const datedAppointments = appointments
    .map((appointment) => ({
      ...appointment,
      date: parseDateValue(appointment.appointment_date),
    }))
    .filter((appointment) => appointment.date);

  const appointmentsLast30 = datedAppointments.filter(
    (appointment) => appointment.date >= last30Start && appointment.date < nextDay
  );
  const appointmentsPrevious30 = datedAppointments.filter(
    (appointment) => appointment.date >= previous30Start && appointment.date < last30Start
  );
  const activePatients30d = new Set(appointmentsLast30.map((appointment) => appointment.patient_id)).size;
  const previousActivePatients30d = new Set(appointmentsPrevious30.map((appointment) => appointment.patient_id)).size;
  const activePatientChangePercent = previousActivePatients30d > 0
    ? Math.round(((activePatients30d - previousActivePatients30d) / previousActivePatients30d) * 100)
    : activePatients30d > 0
      ? 100
      : 0;

  const newPatients30d = patients.filter((patient) => {
    const createdAt = parseDateValue(patient.created_at);
    return createdAt && createdAt >= last30Start && createdAt < nextDay;
  }).length;

  const patientVolumeTrend = Array.from({ length: 6 }, (_item, index) => {
    const periodStart = addDays(today, -7 * (5 - index));
    const periodEnd = addDays(periodStart, 7);
    const bucketAppointments = datedAppointments.filter(
      (appointment) => appointment.date >= periodStart && appointment.date < periodEnd
    );

    return {
      label: periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      patients: new Set(bucketAppointments.map((appointment) => appointment.patient_id)).size,
      appointments: bucketAppointments.length,
    };
  });

  const noShowsLast30 = appointmentsLast30.filter((appointment) => appointment.status === 'no-show');
  const totalNoShows = datedAppointments.filter((appointment) => appointment.status === 'no-show');

  const recordsByPatient = records.reduce((map, record) => {
    const recordDate = parseDateValue(record.record_date || record.created_at);
    if (!recordDate) return map;

    const current = map.get(record.patient_id);
    if (!current || recordDate > current) {
      map.set(record.patient_id, recordDate);
    }

    return map;
  }, new Map());

  const appointmentsByPatient = datedAppointments.reduce((map, appointment) => {
    const current = map.get(appointment.patient_id) || [];
    current.push(appointment);
    map.set(appointment.patient_id, current);
    return map;
  }, new Map());

  const followUpGaps = patients
    .map((patient) => {
      const patientAppointments = appointmentsByPatient.get(patient.id) || [];
      const upcomingAppointment = patientAppointments
        .filter((appointment) => appointment.status === 'scheduled' && appointment.date >= today)
        .sort((a, b) => a.date.getTime() - b.date.getTime())[0];

      if (upcomingAppointment) {
        return null;
      }

      const lastClosedAppointment = patientAppointments
        .filter((appointment) => ['completed', 'cancelled', 'no-show'].includes(appointment.status))
        .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
      const lastRecordDate = recordsByPatient.get(patient.id);
      const lastAppointmentDate = lastClosedAppointment?.date || null;
      const lastCareDate = [lastAppointmentDate, lastRecordDate]
        .filter(Boolean)
        .sort((a, b) => b.getTime() - a.getTime())[0];

      if (!lastCareDate || lastCareDate > followUpGapStart) {
        return null;
      }

      return {
        patientId: patient.id,
        patientName: patient.name,
        lastCareDate: toDateKey(lastCareDate),
        gapDays: Math.floor((today.getTime() - startOfDay(lastCareDate).getTime()) / 86400000),
        lastAppointmentStatus: lastClosedAppointment?.status || null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.gapDays - a.gapDays);

  return {
    patientVolume: {
      totalPatients: patients.length,
      activePatients30d,
      previousActivePatients30d,
      activePatientChangePercent,
      newPatients30d,
      appointments30d: appointmentsLast30.length,
      trend: patientVolumeTrend,
    },
    noShows: {
      count30d: noShowsLast30.length,
      rate30d: percentage(noShowsLast30.length, appointmentsLast30.length),
      totalCount: totalNoShows.length,
      affectedPatients30d: new Set(noShowsLast30.map((appointment) => appointment.patient_id)).size,
    },
    followUpGaps: {
      count: followUpGaps.length,
      thresholdDays: followUpGapDays,
      patients: followUpGaps.slice(0, 5),
    },
    appointmentsToday: datedAppointments.filter((appointment) => toDateKey(appointment.date) === todayKey).length,
    totalAppointments: datedAppointments.length,
    completedAppointments: datedAppointments.filter((appointment) => appointment.status === 'completed').length,
  };
};

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

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition'],
  optionsSuccessStatus: 204,
  preflightContinue: false,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'afyasyncc-server',
  });
});

app.get('/api/db-test', async (_req, res) => {
  if (!hasDatabaseConfig) {
    return res.status(503).json({
      ok: false,
      database: 'not_configured',
      message: 'DATABASE_URL is missing. Add it to server/.env or deployment environment variables.',
    });
  }

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
const exportsDir = path.join(serverRoot, 'public', 'exports');
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
      const [patientsRes, appointmentsRes, recordsRes] = await Promise.all([
        pool.query('SELECT * FROM patients'),
        pool.query('SELECT * FROM appointments'),
        pool.query('SELECT * FROM medical_records'),
      ]);

      const patients = patientsRes.rows || [];
      const appointments = appointmentsRes.rows || [];
      const records = recordsRes.rows || [];
      const analytics = buildProviderAnalytics({ patients, appointments, records });

      stats = {
        totalPatients: analytics.patientVolume.totalPatients,
        appointmentsToday: analytics.appointmentsToday,
        totalAppointments: analytics.totalAppointments,
        completedAppointments: analytics.completedAppointments,
        pendingReports: analytics.followUpGaps.count,
        criticalCases: analytics.noShows.count30d,
        patientVolume: analytics.patientVolume,
        noShows: analytics.noShows,
        followUpGaps: analytics.followUpGaps,
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

app.post('/api/appointments/request', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) {
      return;
    }

    if (user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can request appointments' });
    }

    const { doctorId, appointmentDate, startTime, endTime, reason, notes } = req.body;
    if (!doctorId || !appointmentDate || !startTime || !reason) {
      return res.status(400).json({ message: 'Doctor, date, time, and reason are required' });
    }

    const appointment = await createAppointment({
      id: `appointment-request-${Date.now()}`,
      patientId: user.id,
      doctorId,
      appointmentDate,
      startTime,
      endTime: endTime || startTime,
      status: 'scheduled',
      reason,
      notes,
    });

    void logAuditEvent({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'request',
      entityType: 'appointment',
      entityId: appointment.id,
      details: {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentDate: appointment.appointmentDate,
        status: appointment.status,
      },
    });

    return res.status(201).json({ data: appointment });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to request appointment' });
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

app.get('/api/lab-results', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) {
      return;
    }

    const labResults = user.role === 'patient'
      ? await listLabResultsByPatient(user.id)
      : await listLabResults();

    return res.json({ data: labResults });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to fetch lab results' });
  }
});

app.post('/api/lab-results', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) {
      return;
    }

    if (user.role === 'patient') {
      return res.status(403).json({ message: 'Patients cannot create lab results' });
    }

    const { patientId, testName, resultValue, unit, referenceRange, status, notes, resultDate } = req.body;
    if (!patientId || !testName || !resultValue || !resultDate) {
      return res.status(400).json({ message: 'Missing lab result fields' });
    }

    const record = await createLabResult({
      id: `lab-${Date.now()}`,
      patientId,
      doctorId: user.id,
      testName,
      resultValue,
      unit,
      referenceRange,
      status,
      notes,
      resultDate,
    });

    void logAuditEvent({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'create',
      entityType: 'lab_result',
      entityId: record.id,
      details: { patientId: record.patientId, testName: record.testName, status: record.status },
    });

    return res.status(201).json({ data: record });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to create lab result' });
  }
});

app.get('/api/documents', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) {
      return;
    }

    const documents = user.role === 'patient'
      ? await listDocumentsByOwner(user.id)
      : await listDocuments();

    return res.json({ data: documents.map(({ contentBase64, ...document }) => document) });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to fetch documents' });
  }
});

app.post('/api/documents', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) {
      return;
    }

    const { ownerId, fileName, mimeType, contentBase64, description } = req.body;
    const normalizedContentBase64 = normalizeBase64Document(contentBase64);
    if (!ownerId || !fileName || !mimeType || !normalizedContentBase64) {
      return res.status(400).json({ message: 'Missing document fields' });
    }

    if (user.role === 'patient' && ownerId !== user.id) {
      return res.status(403).json({ message: 'Patients can only upload documents to their own record' });
    }

    if (!isValidBase64Document(normalizedContentBase64)) {
      return res.status(400).json({ message: 'Document content must be valid base64' });
    }

    const documentBytes = Buffer.from(normalizedContentBase64, 'base64');
    if (documentBytes.byteLength > maxDocumentBytes) {
      return res.status(413).json({ message: 'Document must be 5 MB or smaller' });
    }

    const document = await createDocument({
      id: `document-${Date.now()}`,
      ownerId,
      uploadedById: user.id,
      fileName,
      mimeType,
      contentBase64: normalizedContentBase64,
      description,
    });

    void logAuditEvent({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'create',
      entityType: 'document',
      entityId: document.id,
      details: { ownerId: document.ownerId, fileName: document.fileName },
    });

    return res.status(201).json({
      data: {
        ...document,
        contentBase64: undefined,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to upload document' });
  }
});

app.get('/api/documents/:id/download', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) {
      return;
    }

    const document = await getDocumentById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (user.role === 'patient' && document.ownerId !== user.id) {
      return res.status(403).json({ message: 'You can only download your own documents' });
    }

    const fileBuffer = Buffer.from(document.contentBase64, 'base64');
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizeDownloadFileName(document.fileName)}"`);
    return res.send(fileBuffer);
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to download document' });
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

app.get('/api/messages/unread', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) {
      return;
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
    const messages = await listUnreadMessages(user.id, limit);
    return res.json({ data: messages });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to fetch unread messages' });
  }
});

app.get('/api/messages/thread/:otherUserId', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) {
      return;
    }

    await markMessageThreadRead(user.id, req.params.otherUserId);
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
    if (hasDatabaseConfig) {
      await ensureDatabaseSchema();
      await seedRealData();
    } else {
      console.warn('DATABASE_URL is missing. Starting API without database-backed routes.');
    }

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (process.env.NODE_ENV !== 'test' && isDirectRun) {
  start();
}

export { app, start };
