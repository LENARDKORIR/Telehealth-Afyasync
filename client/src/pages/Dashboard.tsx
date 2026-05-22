/**
 * Dashboard page - role-specific dashboard
 */

import { useEffect, useState } from 'react';
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

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
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
      const actualAppointments = appointments.filter((appointment: any) => appointment.status === 'scheduled').length;
      const closedAppointments = appointments.filter((appointment: any) => appointmentStatuses.has(appointment.status)).length;

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

  const loadAdminDashboard = async () => {
    if (!user?.id) return;

    setLoading(true);

    try {
      const [statsRes, logsRes] = await Promise.all([
        api.get('/dashboard/stats').catch(() => ({ data: { data: {} } })),
        api.get('/audit-logs?limit=12').catch(() => ({ data: { data: [] } })),
      ]);

      setStats(statsRes.data.data || {});
      setAuditLogs(logsRes.data.data || []);
    } catch (error) {
      console.error('Failed to load admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    if (user.role === 'patient') {
      void loadPatientDashboard();
      return;
    }

    if (user.role === 'admin') {
      void loadAdminDashboard();
      return;
    }

    setLoading(true);
    setStats({
      totalPatients: 145,
      appointmentsToday: 12,
      pendingReports: 8,
      criticalCases: 3,
      totalAppointments: 892,
      completedAppointments: 756,
    });
    setLoading(false);
  }, [user]);

  const selectedDoctor = availableDoctors.find((doctor) => doctor.id === requestForm.doctorId) || availableDoctors[0];

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
                  <p className="text-gray-600 text-sm">Total Patients</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalPatients}</p>
                </div>
                <span className="text-4xl">👥</span>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-md hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Appointments Today</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.appointmentsToday}</p>
                </div>
                <span className="text-4xl">📅</span>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-md hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Pending Reports</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pendingReports}</p>
                </div>
                <span className="text-4xl">📄</span>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-md hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Critical Cases</p>
                  <p className="text-3xl font-bold text-red-600">{stats.criticalCases}</p>
                </div>
                <span className="text-4xl">🚨</span>
              </div>
            </div>
          </div>
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
                    <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-r from-[#6a45f0] to-[#8e171b] text-2xl font-bold text-white">
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
                    <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-r from-blue-400 to-blue-600 text-2xl font-bold text-white">
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
            <h3 className="mb-4 text-lg font-bold text-gray-800">
              {user?.role === 'admin' ? 'System Audit Log' : 'Recent Activity'}
            </h3>
            <div className="space-y-4">
              {user?.role === 'admin' ? (
                auditLogs.length > 0 ? (
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
                          <p className="mt-1 break-words text-xs text-gray-500">
                            {JSON.stringify(entry.details)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">No audit events recorded yet.</p>
                )
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