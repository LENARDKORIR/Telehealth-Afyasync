import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { ensureDatabaseSchema, pool } from './db.js';
import { createPatient, deletePatient, getPatientById, listPatients, updatePatient } from './patients.js';
import { createUser, getUserByEmail, verifyPassword, signToken, getUserById } from './auth.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 8000;

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

app.put('/api/patients/:id', async (req, res) => {
  try {
    const patient = await updatePatient(req.params.id, req.body);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

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

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to delete patient',
    });
  }
});

async function start() {
  try {
    await ensureDatabaseSchema();

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

start();
