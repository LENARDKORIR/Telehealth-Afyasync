/**
 * Appointments page - shows patient's appointments (for patients) or all appointments (for doctors/admins)
 */

import { useState, useEffect } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

interface Appointment {
  id: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: string;
  startTime: string;
  endTime?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  reason: string;
  notes?: string;
}

export const Appointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    if (user.role === 'patient') {
      // Patients see only their appointments
      api
        .get(`/appointments/patient/${user.id}`)
        .then((res) => setAppointments(res.data.data))
        .catch((err) => console.error('Failed to load appointments:', err))
        .finally(() => setLoading(false));
    } else {
      // Doctors and admins see all appointments
      api
        .get('/appointments')
        .then((res) => setAppointments(res.data.data))
        .catch((err) => console.error('Failed to load appointments:', err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const getStatusColor = (status: string) => {
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center text-gray-600">Loading appointments...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {user?.role === 'patient' ? 'My Appointments' : 'All Appointments'}
            </h1>
            <p className="text-sm text-slate-500">Review visits, notes, and next steps on any screen</p>
          </div>
          {user?.role !== 'patient' && (
            <button className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
              + Schedule Appointment
            </button>
          )}
        </div>

        {/* Appointments Grid */}
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
                      {user?.role === 'patient' ? `Dr. ${appointment.doctorName}` : appointment.patientName || appointment.patientId}
                    </h3>
                    {user?.role === 'patient' ? (
                      <p className="break-words text-sm text-slate-500">Reason: {appointment.reason}</p>
                    ) : (
                      <p className="break-words text-sm text-slate-500">with Dr. {appointment.doctorName}</p>
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
                    <p className="font-semibold text-slate-900">{appointment.startTime}</p>
                  </div>
                </div>
                {appointment.notes && (
                  <div className="border-t border-slate-100 pt-3 text-sm text-slate-700">
                    <p className="mb-1 text-slate-500">Notes</p>
                    <p className="break-words">{appointment.notes}</p>
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
