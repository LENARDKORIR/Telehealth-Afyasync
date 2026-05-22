/**
 * Appointments page - shows patient's appointments or the doctor/admin appointment board
 */

import { useEffect, useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show';

interface Appointment {
  id: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName?: string;
  appointmentDate: string;
  startTime: string;
  endTime?: string;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
}

interface AppointmentEditForm {
  appointmentDate: string;
  startTime: string;
  reason: string;
  notes: string;
}

const doctorDirectory = [
  { id: 'dr-joyce-mwangi', name: 'Dr. Joyce Mwangi', specialty: 'Primary Care' },
  { id: 'dr-isaac-owen', name: 'Dr. Isaac Owen', specialty: 'Cardiology' },
  { id: 'dr-nadia-kamau', name: 'Dr. Nadia Kamau', specialty: 'Mental Health' },
  { id: 'dr-rita-nyambura', name: 'Dr. Rita Nyambura', specialty: 'Dermatology' },
  { id: 'dr-samuel-otieno', name: 'Dr. Samuel Otieno', specialty: 'Orthopedics' },
  { id: 'dr-lucy-adhiambo', name: 'Dr. Lucy Adhiambo', specialty: 'Nutrition' },
  { id: 'dr-peter-kariuki', name: 'Dr. Peter Kariuki', specialty: 'Hypertension' },
  { id: 'dr-farah-abdi', name: 'Dr. Farah Abdi', specialty: 'Pediatrics' },
];

const getDoctorLabel = (doctorId: string, doctorName?: string) =>
  doctorName || doctorDirectory.find((doctor) => doctor.id === doctorId)?.name || doctorId;

const getStatusColor = (status: AppointmentStatus) => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'no-show':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatTimeForInput = (time: string) => {
  const match = time.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
  if (!match) {
    return time.length >= 5 ? time.slice(0, 5) : '';
  }

  let hours = Number(match[1]);
  const minutes = match[2];
  const period = match[3]?.toUpperCase();

  if (period === 'PM' && hours < 12) {
    hours += 12;
  }

  if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, '0')}:${minutes}`;
};

const addOneHour = (time: string) => {
  const [hoursString, minutesString] = time.split(':');
  const hours = Number(hoursString);
  const minutes = Number(minutesString);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;

  const endHours = (hours + 1) % 24;
  return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const Appointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState('');
  const [editForm, setEditForm] = useState<AppointmentEditForm>({
    appointmentDate: '',
    startTime: '',
    reason: '',
    notes: '',
  });

  const loadAppointments = async () => {
    if (!user?.id) return;

    setLoading(true);

    try {
      const endpoint = user.role === 'patient' ? `/appointments/patient/${user.id}` : '/appointments';
      const response = await api.get(endpoint);
      setAppointments(response.data.data || []);
    } catch (error) {
      console.error('Failed to load appointments:', error);
      setStatusError('Unable to load appointments right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAppointments();
  }, [user?.id, user?.role]);

  const beginReschedule = (appointment: Appointment) => {
    setStatusError('');
    setStatusMessage('');
    setEditingAppointmentId(appointment.id);
    setEditForm({
      appointmentDate: appointment.appointmentDate,
      startTime: formatTimeForInput(appointment.startTime),
      reason: appointment.reason,
      notes: appointment.notes || '',
    });
  };

  const cancelEdit = () => {
    setEditingAppointmentId(null);
    setEditForm({
      appointmentDate: '',
      startTime: '',
      reason: '',
      notes: '',
    });
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveReschedule = async (appointment: Appointment) => {
    if (!editForm.appointmentDate || !editForm.startTime || !editForm.reason) {
      setStatusError('Choose a new date, time, and reason before rescheduling.');
      return;
    }

    setSavingId(appointment.id);
    setStatusError('');
    setStatusMessage('');

    try {
      await api.put(`/appointments/${appointment.id}`, {
        appointmentDate: editForm.appointmentDate,
        startTime: editForm.startTime,
        endTime: addOneHour(editForm.startTime),
        status: 'scheduled',
        reason: editForm.reason,
        notes: editForm.notes,
      });

      setStatusMessage('Appointment rescheduled successfully.');
      cancelEdit();
      await loadAppointments();
    } catch (error) {
      console.error('Failed to reschedule appointment:', error);
      setStatusError('Unable to reschedule the appointment right now.');
    } finally {
      setSavingId(null);
    }
  };

  const closeAppointment = async (appointment: Appointment) => {
    setSavingId(appointment.id);
    setStatusError('');
    setStatusMessage('');

    try {
      await api.put(`/appointments/${appointment.id}`, {
        status: 'completed',
      });

      setStatusMessage('Appointment marked as closed.');
      if (editingAppointmentId === appointment.id) {
        cancelEdit();
      }
      await loadAppointments();
    } catch (error) {
      console.error('Failed to close appointment:', error);
      setStatusError('Unable to close the appointment right now.');
    } finally {
      setSavingId(null);
    }
  };

  const deleteAppointment = async (appointment: Appointment) => {
    const confirmed = window.confirm('Delete this appointment permanently?');
    if (!confirmed) return;

    setSavingId(appointment.id);
    setStatusError('');
    setStatusMessage('');

    try {
      await api.delete(`/appointments/${appointment.id}`);
      setStatusMessage('Appointment deleted.');
      if (editingAppointmentId === appointment.id) {
        cancelEdit();
      }
      await loadAppointments();
    } catch (error) {
      console.error('Failed to delete appointment:', error);
      setStatusError('Unable to delete the appointment right now.');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center text-gray-600">Loading appointments...</div>
      </DashboardLayout>
    );
  }

  const isDoctorView = user?.role !== 'patient';

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {user?.role === 'patient' ? 'My Appointments' : 'Doctor Appointment Board'}
            </h1>
            <p className="text-sm text-slate-500">
              {user?.role === 'patient'
                ? 'Review your visits, notes, and next steps on any screen.'
                : 'Reschedule, close, or delete appointments from one place.'}
            </p>
          </div>
        </div>

        {statusError && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {statusError}
          </div>
        )}

        {statusMessage && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {statusMessage}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {appointments.length > 0 ? (
            appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-6"
              >
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-bold text-slate-900">
                      {user?.role === 'patient'
                        ? `Dr. ${getDoctorLabel(appointment.doctorId, appointment.doctorName)}`
                        : appointment.patientName || appointment.patientId}
                    </h3>
                    {user?.role === 'patient' ? (
                      <p className="break-words text-sm text-slate-500">Reason: {appointment.reason}</p>
                    ) : (
                      <p className="break-words text-sm text-slate-500">
                        Doctor: {getDoctorLabel(appointment.doctorId, appointment.doctorName)}
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold sm:text-sm ${getStatusColor(appointment.status)}`}
                  >
                    {appointment.status}
                  </span>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Date</p>
                    <p className="font-semibold text-slate-900">{appointment.appointmentDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Time</p>
                    <p className="font-semibold text-slate-900">
                      {appointment.startTime}
                      {appointment.endTime ? ` - ${appointment.endTime}` : ''}
                    </p>
                  </div>
                </div>

                <div className="mb-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="mb-1 text-slate-500">Appointment details</p>
                  <p className="font-medium text-slate-900">{appointment.reason}</p>
                  {appointment.notes && <p className="mt-2 break-words">{appointment.notes}</p>}
                </div>

                {isDoctorView && (
                  <div className="space-y-3">
                    {editingAppointmentId === appointment.id ? (
                      <div className="space-y-3 rounded-2xl border border-[#6a45f0]/20 bg-[#f7f4ff] p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                              New date
                            </label>
                            <input
                              type="date"
                              name="appointmentDate"
                              value={editForm.appointmentDate}
                              onChange={handleEditChange}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                              New time
                            </label>
                            <input
                              type="time"
                              name="startTime"
                              value={editForm.startTime}
                              onChange={handleEditChange}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                            Reason
                          </label>
                          <input
                            type="text"
                            name="reason"
                            value={editForm.reason}
                            onChange={handleEditChange}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                            Notes
                          </label>
                          <textarea
                            name="notes"
                            value={editForm.notes}
                            onChange={handleEditChange}
                            rows={3}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                          />
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => saveReschedule(appointment)}
                            disabled={savingId === appointment.id}
                            className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#6a45f0] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5a39d1] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {savingId === appointment.id ? 'Saving...' : 'Save reschedule'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-3">
                        <button
                          type="button"
                          onClick={() => beginReschedule(appointment)}
                          disabled={savingId === appointment.id}
                          className="inline-flex items-center justify-center rounded-xl border border-[#6a45f0] bg-[#f5f1ff] px-3 py-2 text-sm font-semibold text-[#6a45f0] transition hover:bg-[#ece5ff] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Reschedule
                        </button>
                        <button
                          type="button"
                          onClick={() => closeAppointment(appointment)}
                          disabled={savingId === appointment.id || appointment.status === 'completed'}
                          className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Close
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAppointment(appointment)}
                          disabled={savingId === appointment.id}
                          className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-600 shadow-sm">
              No appointments found
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
