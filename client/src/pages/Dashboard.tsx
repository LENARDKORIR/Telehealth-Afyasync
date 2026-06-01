/**
 * Dashboard page - role-specific dashboard
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

interface DashboardStats {
  totalPatients?: number;
  appointmentsToday?: number;
  pendingReports?: number;
  criticalCases?: number;
  totalAppointments?: number;
  actualAppointments?: number;
  closedAppointments?: number;
  completedAppointments?: number;
  myAppointments?: number;
  upcomingAppointments?: number;
  completedRecords?: number;
  patientVolume?: PatientVolumeAnalytics;
  noShows?: NoShowAnalytics;
  followUpGaps?: FollowUpGapAnalytics;
}

interface ProviderVolumeTrendPoint {
  label: string;
  patients: number;
  appointments: number;
}

interface PatientVolumeAnalytics {
  totalPatients: number;
  activePatients30d: number;
  previousActivePatients30d: number;
  activePatientChangePercent: number;
  newPatients30d: number;
  appointments30d: number;
  trend: ProviderVolumeTrendPoint[];
}

interface NoShowAnalytics {
  count30d: number;
  rate30d: number;
  totalCount: number;
  affectedPatients30d: number;
}

interface FollowUpGapPatient {
  patientId: string;
  patientName: string;
  lastCareDate: string;
  gapDays: number;
  lastAppointmentStatus?: string | null;
}

interface FollowUpGapAnalytics {
  count: number;
  thresholdDays: number;
  patients: FollowUpGapPatient[];
}

interface DoctorOption {
  id: string;
  name: string;
  specialty: string;
  focus: string;
}

interface AppointmentRequestForm {
  specialty: string;
  doctorId: string;
  date: string;
  time: string;
  reason: string;
  notes: string;
}

interface AuditLogEntry {
  id: string;
  actorName?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
  createdAt: string;
}

interface PatientCareStep {
  title: string;
  description: string;
  href: string;
  label: string;
  tone: 'primary' | 'secondary' | 'tertiary' | 'warning' | 'success';
}

interface TaskQueueItem {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
}

interface FollowUpTask {
  patientId: string;
  patientName: string;
  statusLabel: string;
  gapDays: number;
  actionHref: string;
  actionLabel: string;
}

const doctorDirectory: DoctorOption[] = [
  { id: 'dr-joyce-mwangi', name: 'Dr. Joyce Mwangi', specialty: 'Primary Care', focus: 'Routine visits, prescriptions, and follow-ups' },
  { id: 'dr-isaac-owen', name: 'Dr. Isaac Owen', specialty: 'Cardiology', focus: 'Heart health, cholesterol, and blood pressure' },
  { id: 'dr-nadia-kamau', name: 'Dr. Nadia Kamau', specialty: 'Mental Health', focus: 'Stress, anxiety, counseling, and support' },
  { id: 'dr-rita-nyambura', name: 'Dr. Rita Nyambura', specialty: 'Dermatology', focus: 'Skin, hair, allergy, and rash concerns' },
  { id: 'dr-samuel-otieno', name: 'Dr. Samuel Otieno', specialty: 'Orthopedics', focus: 'Bones, joints, sports injuries, and mobility' },
  { id: 'dr-lucy-adhiambo', name: 'Dr. Lucy Adhiambo', specialty: 'Nutrition', focus: 'Weight management, sleep, and healthy habits' },
  { id: 'dr-peter-kariuki', name: 'Dr. Peter Kariuki', specialty: 'Hypertension', focus: 'Blood pressure, prevention, and long-term care' },
  { id: 'dr-farah-abdi', name: 'Dr. Farah Abdi', specialty: 'Pediatrics', focus: 'Family and child-focused preventive care' },
];

const appointmentStatuses = new Set(['completed', 'cancelled', 'no-show']);

const patientCareSteps: PatientCareStep[] = [
  {
    title: 'Messaging',
    description: 'Send a secure question or update to your care team.',
    href: '/messages',
    label: 'Open inbox',
    tone: 'primary',
  },
  {
    title: 'Appointment reminders',
    description: 'Review upcoming visits and keep your schedule on track.',
    href: '/appointments',
    label: 'View appointments',
    tone: 'secondary',
  },
  {
    title: 'Prescription workflow',
    description: 'Request refills and track medication status in one place.',
    href: '/prescriptions',
    label: 'Manage refills',
    tone: 'success',
  },
  {
    title: 'Lab results & documents',
    description: 'Review reports, scans, and care documents when they arrive.',
    href: '/records',
    label: 'Open records',
    tone: 'tertiary',
  },
  {
    title: 'Patient intake',
    description: 'Complete your pre-visit questionnaire before the appointment.',
    href: '/intake',
    label: 'Fill intake',
    tone: 'secondary',
  },
  {
    title: 'Video visits',
    description: 'Join your next telehealth appointment from the waiting room.',
    href: '/appointments',
    label: 'Go to visits',
    tone: 'primary',
  },
  {
    title: 'Emergency escalation',
    description: 'Use the care-coordination flow when symptoms need urgent review.',
    href: '/emergency',
    label: 'Open escalation',
    tone: 'warning',
  },
];

const doctorTaskQueue: TaskQueueItem[] = [
  {
    title: 'Review patient messages',
    description: 'Answer secure inbox threads and urgent symptom escalations.',
    href: '/messages',
    actionLabel: 'Open messages',
  },
  {
    title: 'Close today’s appointments',
    description: 'Reschedule, complete, or delete visits from the appointment board.',
    href: '/appointments',
    actionLabel: 'Manage schedule',
  },
  {
    title: 'Check refill requests',
    description: 'Review prescriptions that need refilling or provider approval.',
    href: '/prescriptions',
    actionLabel: 'Review refills',
  },
  {
    title: 'Monitor care gaps',
    description: 'Use the analytics tiles to catch no-shows and follow-up gaps early.',
    href: '/dashboard',
    actionLabel: 'View analytics',
  },
];

const adminTaskQueue: TaskQueueItem[] = [
  {
    title: 'Review audit logs',
    description: 'Inspect compliance events, filters, and recent activity trends.',
    href: '/dashboard',
    actionLabel: 'Open audit panel',
  },
  {
    title: 'Export compliance data',
    description: 'Download the current audit log view for review or archive.',
    href: '/dashboard',
    actionLabel: 'Export CSV',
  },
  {
    title: 'Watch provider analytics',
    description: 'Track patient volume, no-shows, and follow-up gaps across the clinic.',
    href: '/dashboard',
    actionLabel: 'Open analytics',
  },
  {
    title: 'Check operational alerts',
    description: 'Use the notification feed and audit trail to spot issues quickly.',
    href: '/messages',
    actionLabel: 'Review alerts',
  },
];

const initialSpecialty = doctorDirectory[0]?.specialty || 'Primary Care';
const initialDoctors = doctorDirectory.filter((doctor) => doctor.specialty === initialSpecialty);

const addOneHour = (time: string) => {
  const [hoursString, minutesString] = time.split(':');
  const hours = Number(hoursString);
  const minutes = Number(minutesString);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;

  const endHours = (hours + 1) % 24;
  return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const formatSignedPercent = (value?: number) => {
  const safeValue = value || 0;
  return `${safeValue > 0 ? '+' : ''}${safeValue}%`;
};

const formatShortDate = (value?: string | null) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [nextVideoVisitId, setNextVideoVisitId] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditFilters, setAuditFilters] = useState({
    user: '',
    role: '',
    action: '',
    entityType: '',
    from: '',
    to: '',
    limit: 50,
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestError, setRequestError] = useState('');
  const [requestForm, setRequestForm] = useState<AppointmentRequestForm>({
    specialty: initialSpecialty,
    doctorId: initialDoctors[0]?.id || doctorDirectory[0].id,
    date: '',
    time: '',
    reason: '',
    notes: '',
  });

  const availableDoctors = doctorDirectory.filter((doctor) => doctor.specialty === requestForm.specialty);

  const loadPatientDashboard = async () => {
    if (!user?.id) return;

    setLoading(true);

    try {
      const [appointmentsRes, recordsRes] = await Promise.all([
        api.get(`/appointments/patient/${user.id}`).catch(() => ({ data: { data: [] } })),
        api.get(`/medical-records/patient/${user.id}`).catch(() => ({ data: { data: [] } })),
      ]);

      const appointments = appointmentsRes.data.data || [];
      const records = recordsRes.data.data || [];
      const upcomingVideoVisit = [...appointments]
        .filter((appointment: any) => appointment.status === 'scheduled')
        .sort((left: any, right: any) => {
          const leftDate = new Date(`${left.appointmentDate}T${left.startTime}`).getTime();
          const rightDate = new Date(`${right.appointmentDate}T${right.startTime}`).getTime();
          return leftDate - rightDate;
        })[0];
      const actualAppointments = appointments.filter((appointment: any) => appointment.status === 'scheduled').length;
      const closedAppointments = appointments.filter((appointment: any) => appointmentStatuses.has(appointment.status)).length;

      setNextVideoVisitId(upcomingVideoVisit?.id || '');
      setStats({
        myAppointments: appointments.length,
        totalAppointments: appointments.length,
        actualAppointments,
        closedAppointments,
        upcomingAppointments: actualAppointments,
        completedAppointments: appointments.filter((appointment: any) => appointment.status === 'completed').length,
        completedRecords: records.length,
      });
    } catch (error) {
      console.error('Failed to load patient dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProviderDashboard = async (includeAuditLogs: boolean) => {
    if (!user?.id) return;

    setLoading(true);

    try {
      const [statsRes, logsRes] = await Promise.all([
        api.get('/dashboard/stats').catch(() => ({ data: { data: {} } })),
        includeAuditLogs
          ? api.get('/audit-logs?limit=12').catch(() => ({ data: { data: [] } }))
          : Promise.resolve({ data: { data: [] } }),
      ]);

      setStats(statsRes.data.data || {});
      setAuditLogs(logsRes.data.data || []);
    } catch (error) {
      console.error('Failed to load provider dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminDashboard = async () => {
    await loadProviderDashboard(true);
  };

  const fetchFilteredAudit = async () => {
    try {
      const params = new URLSearchParams();
      if (auditFilters.user) params.append('user', auditFilters.user);
      if (auditFilters.role) params.append('role', auditFilters.role);
      if (auditFilters.action) params.append('action', auditFilters.action);
      if (auditFilters.entityType) params.append('entityType', auditFilters.entityType);
      if (auditFilters.from) params.append('from', auditFilters.from);
      if (auditFilters.to) params.append('to', auditFilters.to);
      params.append('limit', String(auditFilters.limit || 100));

      const res = await api.get(`/audit-logs?${params.toString()}`);
      setAuditLogs(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch filtered audit logs', err);
    }
  };

  const handleExportCSV = () => {
    if (!auditLogs || auditLogs.length === 0) return;
    const headers = ['id','actorName','actorRole','action','entityType','entityId','details','createdAt'];
    const rows = auditLogs.map((r) => [
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
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!user?.id) return;

    if (user.role === 'patient') {
      void loadPatientDashboard();
      return;
    }

    void loadProviderDashboard(user.role === 'admin');
  }, [user]);

  const selectedDoctor = availableDoctors.find((doctor) => doctor.id === requestForm.doctorId) || availableDoctors[0];
  const patientVolume = stats.patientVolume;
  const noShows = stats.noShows;
  const followUpGaps = stats.followUpGaps;
  const providerTrendMax = Math.max(
    1,
    ...(patientVolume?.trend || []).flatMap((point) => [point.patients, point.appointments])
  );

  const activeTaskQueue = user?.role === 'patient'
    ? patientCareSteps.map((step) => ({
        title: step.title,
        description: step.description,
        href: step.href,
        actionLabel: step.label,
      }))
    : user?.role === 'admin'
      ? adminTaskQueue
      : doctorTaskQueue;

  const queueTitle = user?.role === 'patient'
    ? 'Care queue'
    : user?.role === 'admin'
      ? 'Compliance queue'
      : 'Clinical queue';

  const queueSubtitle = user?.role === 'patient'
    ? 'Your next steps are organized by the tasks patients use most.'
    : user?.role === 'admin'
      ? 'Administrative work is grouped for compliance review and export.'
      : 'Prioritize inbox follow-up, schedule management, and refill review.';

  const followUpTasks: FollowUpTask[] = user?.role !== 'patient'
    ? (followUpGaps?.patients || []).map((patient) => ({
        patientId: patient.patientId,
        patientName: patient.patientName,
        statusLabel: patient.lastAppointmentStatus || 'care gap',
        gapDays: patient.gapDays,
        actionHref: `/messages?contact=${encodeURIComponent(patient.patientId)}`,
        actionLabel: 'Message patient',
      }))
    : [];

  const handleRequestChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setRequestError('');
    setRequestMessage('');

    if (name === 'specialty') {
      const doctorsForSpecialty = doctorDirectory.filter((doctor) => doctor.specialty === value);
      setRequestForm((prev) => ({
        ...prev,
        specialty: value,
        doctorId: doctorsForSpecialty[0]?.id || prev.doctorId,
      }));
      return;
    }

    setRequestForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      setRequestError('Please sign in to request an appointment.');
      return;
    }

    if (!requestForm.specialty || !requestForm.doctorId || !requestForm.date || !requestForm.time || !requestForm.reason) {
      setRequestError('Please select a specialty, doctor, date, time, and reason.');
      return;
    }

    if (!selectedDoctor) {
      setRequestError('Please choose a valid doctor for the selected specialty.');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/appointments', {
        id: `appointment-${Date.now()}`,
        patientId: user.id,
        doctorId: selectedDoctor.id,
        appointmentDate: requestForm.date,
        startTime: requestForm.time,
        endTime: addOneHour(requestForm.time),
        status: 'scheduled',
        reason: requestForm.reason,
        notes: [
          `Specialty: ${selectedDoctor.specialty}`,
          `Preferred doctor: ${selectedDoctor.name}`,
          requestForm.notes ? `Notes: ${requestForm.notes}` : '',
        ]
          .filter(Boolean)
          .join(' | '),
      });

      setRequestMessage(`Request sent to ${selectedDoctor.name} in ${selectedDoctor.specialty}.`);
      setRequestForm((prev) => ({
        ...prev,
        date: '',
        time: '',
        reason: '',
        notes: '',
      }));
      await loadPatientDashboard();
    } catch (error) {
      console.error('Failed to request appointment:', error);
      setRequestError('Unable to send the request right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center text-gray-600">Loading dashboard...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-800">Welcome, {user?.name}! 👋</h1>
          <p className="text-gray-600">
            Role: <span className="font-semibold capitalize">{user?.role}</span>
          </p>
        </div>

        <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-md sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#6a45f0]">{queueTitle}</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                {user?.role === 'patient'
                  ? 'Move through your care tasks in order'
                  : user?.role === 'admin'
                    ? 'Review compliance work and export logs'
                    : 'Keep today’s clinical work moving'}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{queueSubtitle}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {activeTaskQueue.map((task) => (
              <Link
                key={task.title}
                to={task.href}
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-[#6a45f0]/25 hover:bg-[#f7f4ff] hover:shadow-sm"
              >
                <h3 className="text-lg font-bold text-slate-900">{task.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{task.description}</p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#6a45f0]">
                  {task.actionLabel}
                  <span className="transition group-hover:translate-x-1">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {user?.role === 'patient' ? (
          <>
            <div className="mb-8 grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-md lg:grid-cols-[1fr_1.2fr] lg:p-8">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#6a45f0]">
                    Request an appointment
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                    Choose the right doctor for your needs
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                    Pick a specialty first, then select a doctor who focuses on that field. This keeps the request specific so your appointment goes to the right specialist.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {doctorDirectory.slice(0, 6).map((doctor) => (
                    <button
                      key={doctor.id}
                      type="button"
                      onClick={() =>
                        setRequestForm((prev) => ({
                          ...prev,
                          specialty: doctor.specialty,
                          doctorId: doctor.id,
                        }))
                      }
                      className={`rounded-2xl border px-4 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                        requestForm.doctorId === doctor.id
                          ? 'border-[#6a45f0] bg-[#f5f1ff]'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <p className="font-semibold text-slate-900">{doctor.name}</p>
                      <p className="text-sm text-slate-600">{doctor.specialty}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{doctor.focus}</p>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleRequestSubmit} className="space-y-4 rounded-3xl bg-slate-50 p-5 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Specialty</label>
                    <select
                      name="specialty"
                      value={requestForm.specialty}
                      onChange={handleRequestChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                    >
                      {Array.from(new Set(doctorDirectory.map((doctor) => doctor.specialty))).map((specialty) => (
                        <option key={specialty} value={specialty}>
                          {specialty}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Doctor</label>
                    <select
                      name="doctorId"
                      value={requestForm.doctorId}
                      onChange={handleRequestChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                    >
                      {availableDoctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={requestForm.date}
                      onChange={handleRequestChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Time</label>
                    <input
                      type="time"
                      name="time"
                      value={requestForm.time}
                      onChange={handleRequestChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Reason</label>
                  <input
                    type="text"
                    name="reason"
                    value={requestForm.reason}
                    onChange={handleRequestChange}
                    placeholder="Describe what you want to discuss"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Additional notes</label>
                  <textarea
                    name="notes"
                    value={requestForm.notes}
                    onChange={handleRequestChange}
                    rows={4}
                    placeholder="Add any symptoms, history, or preferences"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                  />
                </div>

                {requestError && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {requestError}
                  </div>
                )}

                {requestMessage && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {requestMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-[#8e171b] px-4 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#741215] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? 'Sending request...' : 'Request appointment'}
                </button>
              </form>
            </div>

            <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-md sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#6a45f0]">
                    Step-by-step care
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                    Jump into the highest-impact workflows
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                    Messaging, reminders, refills, intake, records, and emergency escalation are grouped here so you can move through care in a predictable order.
                  </p>
                </div>

                <Link
                  to="/settings"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Review preferences
                </Link>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {patientCareSteps.map((step) => {
                  const resolvedHref = step.title === 'Video visits' && nextVideoVisitId
                    ? `/video-visits/${nextVideoVisitId}`
                    : step.href;

                  const toneStyles: Record<PatientCareStep['tone'], string> = {
                    primary: 'border-[#6a45f0]/20 bg-[#f6f2ff] text-[#4c2fc0]',
                    secondary: 'border-slate-200 bg-slate-50 text-slate-700',
                    tertiary: 'border-cyan-200 bg-cyan-50 text-cyan-700',
                    warning: 'border-rose-200 bg-rose-50 text-rose-700',
                    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
                  };

                  return (
                    <Link
                      key={step.title}
                      to={resolvedHref}
                      className={`group rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-sm ${toneStyles[step.tone]}`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-80">Step</p>
                      <h3 className="mt-2 text-xl font-bold text-slate-900">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                        {step.label}
                        <span className="transition group-hover:translate-x-1">→</span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {nextVideoVisitId && (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Your next scheduled video visit is ready to open from the card above.
                </div>
              )}
            </section>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl bg-white p-6 shadow-md hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Actual Appointments</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.actualAppointments || 0}</p>
                  </div>
                  <span className="text-4xl">📅</span>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-md hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Closed Appointments</p>
                    <p className="text-3xl font-bold text-rose-600">{stats.closedAppointments || 0}</p>
                  </div>
                  <span className="text-4xl">🔒</span>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-md hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Medical Records</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.completedRecords || 0}</p>
                  </div>
                  <span className="text-4xl">📋</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="rounded-2xl bg-white p-6 shadow-md hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Patient Volume</p>
                  <p className="text-3xl font-bold text-gray-800">{patientVolume?.activePatients30d ?? 0}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {formatSignedPercent(patientVolume?.activePatientChangePercent)} vs prior 30 days
                  </p>
                </div>
                <span className="text-sm font-bold text-slate-400">30d</span>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-md hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">New Patients</p>
                  <p className="text-3xl font-bold text-blue-600">{patientVolume?.newPatients30d ?? 0}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {stats.appointmentsToday || 0} appointments today
                  </p>
                </div>
                <span className="text-sm font-bold text-slate-400">30d</span>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-md hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">No-show Rate</p>
                  <p className="text-3xl font-bold text-yellow-600">{noShows?.rate30d ?? 0}%</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {noShows?.count30d ?? 0} missed visits
                  </p>
                </div>
                <span className="text-sm font-bold text-slate-400">30d</span>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-md hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Follow-up Gaps</p>
                  <p className="text-3xl font-bold text-red-600">{followUpGaps?.count ?? 0}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Past {followUpGaps?.thresholdDays ?? 30} days without next visit
                  </p>
                </div>
                <span className="text-sm font-bold text-slate-400">Care</span>
              </div>
            </div>
          </div>
        )}

        {user?.role !== 'patient' && (
          <div className="mb-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-2xl bg-white p-6 shadow-md">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Patient volume trend</h2>
                  <p className="text-sm text-slate-500">
                    Weekly unique patients and appointment load from the last six weeks.
                  </p>
                </div>
                <div className="text-sm font-semibold text-slate-600">
                  {patientVolume?.appointments30d ?? 0} visits in 30 days
                </div>
              </div>

              <div className="space-y-4">
                {(patientVolume?.trend || []).map((point) => (
                  <div key={point.label} className="grid gap-2 sm:grid-cols-[88px_1fr_96px] sm:items-center">
                    <div className="text-sm font-semibold text-slate-600">{point.label}</div>
                    <div className="space-y-2">
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#6a45f0]"
                          style={{ width: `${Math.max(4, Math.round((point.patients / providerTrendMax) * 100))}%` }}
                        />
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#8e171b]"
                          style={{ width: `${Math.max(4, Math.round((point.appointments / providerTrendMax) * 100))}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-slate-500">
                      <span className="font-semibold text-slate-900">{point.patients}</span> patients
                      <br />
                      <span className="font-semibold text-slate-900">{point.appointments}</span> visits
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#6a45f0]" />
                  Unique patients
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#8e171b]" />
                  Appointments
                </span>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-md">
              <h2 className="text-xl font-bold text-slate-900">Care follow-up signals</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-800">No-shows</p>
                  <p className="mt-2 text-3xl font-black text-amber-900">{noShows?.count30d ?? 0}</p>
                  <p className="mt-1 text-sm text-amber-800">
                    {noShows?.affectedPatients30d ?? 0} patients, {noShows?.rate30d ?? 0}% of visits
                  </p>
                </div>
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-sm font-semibold text-rose-800">Follow-up gaps</p>
                  <p className="mt-2 text-3xl font-black text-rose-900">{followUpGaps?.count ?? 0}</p>
                  <p className="mt-1 text-sm text-rose-800">
                    Patients without a scheduled next visit
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {(followUpGaps?.patients || []).length > 0 ? (
                  followUpGaps?.patients.map((patient) => (
                    <div key={patient.patientId} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="wrap-break-word font-semibold text-slate-900">{patient.patientName}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            Last care {formatShortDate(patient.lastCareDate)}
                            {patient.lastAppointmentStatus ? ` - ${patient.lastAppointmentStatus}` : ''}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                          {patient.gapDays}d
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                    No follow-up gaps detected.
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {user?.role !== 'patient' && followUpTasks.length > 0 && (
          <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-md sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#6a45f0]">Care plans</p>
                <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">Follow-up tasks to close care gaps intentionally</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  Each task pairs a patient gap with the next concrete action so providers can close the loop instead of only reviewing metrics.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {followUpTasks.map((task) => (
                <article key={task.patientId} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Follow-up task</p>
                      <h3 className="mt-1 wrap-break-word text-lg font-bold text-slate-900">{task.patientName}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {task.gapDays} day gap · {task.statusLabel}
                      </p>
                    </div>
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                      Open
                    </span>
                  </div>

                  <div className="mt-4 space-y-3 rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">
                    <p>Review recent care, send a check-in, and plan the next visit.</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Link to={task.actionHref} className="inline-flex items-center justify-center rounded-xl bg-[#6a45f0] px-3 py-2 font-semibold text-white transition hover:bg-[#5638d6]">
                        {task.actionLabel}
                      </Link>
                      <Link to="/appointments" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 transition hover:bg-slate-50">
                        Schedule follow-up
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-bold text-gray-800">
              {user?.role === 'patient' ? 'Appointment Overview' : 'Appointment Statistics'}
            </h3>
            <div className="flex h-64 items-center justify-center rounded-lg bg-gray-50">
              <div className="text-center">
                {user?.role === 'patient' ? (
                  <>
                    <p className="mb-4 text-gray-600">
                      Actual: {stats.actualAppointments || 0} / Closed: {stats.closedAppointments || 0}
                    </p>
                    <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-linear-to-r from-[#6a45f0] to-[#8e171b] text-2xl font-bold text-white">
                      {stats.myAppointments
                        ? Math.round(((stats.closedAppointments || 0) / (stats.myAppointments || 1)) * 100)
                        : 0}
                      %
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mb-4 text-gray-600">
                      Completed: {stats.completedAppointments || 0} / {stats.totalAppointments || 0}
                    </p>
                    <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-linear-to-r from-blue-400 to-blue-600 text-2xl font-bold text-white">
                      {stats.totalAppointments
                        ? Math.round(((stats.completedAppointments || 0) / (stats.totalAppointments || 1)) * 100)
                        : 0}
                      %
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-md">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <h3 className="text-lg font-bold text-gray-800">
                {user?.role === 'admin' ? 'Compliance audit log' : 'Recent activity'}
              </h3>
              {user?.role === 'admin' && (
                <p className="text-sm text-slate-500">
                  Filter, review, and export audit records for compliance checks.
                </p>
              )}
            </div>
            <div className="space-y-4">
              {user?.role === 'admin' ? (
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <input placeholder="User or actor id" value={auditFilters.user} onChange={(e) => setAuditFilters((p) => ({...p, user: e.target.value}))} className="rounded-md border px-3 py-2" />
                    <input placeholder="Role" value={auditFilters.role} onChange={(e) => setAuditFilters((p) => ({...p, role: e.target.value}))} className="rounded-md border px-3 py-2" />
                    <input placeholder="Action" value={auditFilters.action} onChange={(e) => setAuditFilters((p) => ({...p, action: e.target.value}))} className="rounded-md border px-3 py-2" />
                    <input placeholder="Entity type" value={auditFilters.entityType} onChange={(e) => setAuditFilters((p) => ({...p, entityType: e.target.value}))} className="rounded-md border px-3 py-2" />
                    <input type="date" value={auditFilters.from} onChange={(e) => setAuditFilters((p) => ({...p, from: e.target.value}))} className="rounded-md border px-3 py-2" />
                    <input type="date" value={auditFilters.to} onChange={(e) => setAuditFilters((p) => ({...p, to: e.target.value}))} className="rounded-md border px-3 py-2" />
                    <button onClick={fetchFilteredAudit} className="ml-2 rounded-md bg-[#6a45f0] px-3 py-2 text-white">Filter</button>
                    <button onClick={() => { setAuditFilters({user:'',role:'',action:'',entityType:'',from:'',to:'',limit:50}); void loadAdminDashboard(); }} className="ml-2 rounded-md border px-3 py-2">Reset</button>
                    <button onClick={handleExportCSV} className="ml-auto rounded-md border px-3 py-2">Export CSV</button>
                  </div>

                  {auditLogs.length > 0 ? (
                    auditLogs.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3 border-b pb-4 last:border-b-0 last:pb-0">
                        <span className="text-2xl">🧾</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800">
                            {entry.actorName || 'System'} {entry.action} {entry.entityType.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-gray-600">
                            {entry.actorRole || 'system'} • {entry.entityId || 'n/a'} • {new Date(entry.createdAt).toLocaleString()}
                          </p>
                          {entry.details && Object.keys(entry.details).length > 0 && (
                            <p className="mt-1 wrap-break-word text-xs text-gray-500">
                              {JSON.stringify(entry.details)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600">No audit events recorded yet.</p>
                  )}
                </div>
              ) : user?.role === 'patient' ? (
                <>
                  <div className="flex items-center gap-3 border-b pb-4">
                    <span className="text-2xl">📅</span>
                    <div>
                      <p className="font-semibold text-gray-800">Actual Appointments</p>
                      <p className="text-sm text-gray-600">{stats.actualAppointments || 0} scheduled</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 border-b pb-4">
                    <span className="text-2xl">🔒</span>
                    <div>
                      <p className="font-semibold text-gray-800">Closed Appointments</p>
                      <p className="text-sm text-gray-600">{stats.closedAppointments || 0} completed or closed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📋</span>
                    <div>
                      <p className="font-semibold text-gray-800">Medical Records</p>
                      <p className="text-sm text-gray-600">{stats.completedRecords || 0} on file</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 border-b pb-4">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="font-semibold text-gray-800">Appointment Completed</p>
                      <p className="text-sm text-gray-600">Dr. Smith with Patient John</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 border-b pb-4">
                    <span className="text-2xl">📋</span>
                    <div>
                      <p className="font-semibold text-gray-800">Report Generated</p>
                      <p className="text-sm text-gray-600">Monthly clinic report ready</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👤</span>
                    <div>
                      <p className="font-semibold text-gray-800">New Patient Registered</p>
                      <p className="text-sm text-gray-600">Patient Emma Johnson</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
