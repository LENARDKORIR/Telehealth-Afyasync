/**
 * Appointments page - shows patient's appointments (for patients) or all appointments (for doctors/admins)
 */

import { useState, useEffect } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { ENDPOINTS } from '../utils/constants';

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
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            {user?.role === 'patient' ? 'My Appointments' : 'All Appointments'}
          </h1>
          {user?.role !== 'patient' && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              + Schedule Appointment
            </button>
          )}
        </div>

        {/* Appointments Grid */}
        <div className="grid gap-4">
          {appointments.length > 0 ? (
            appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {user?.role === 'patient' ? `Dr. ${appointment.doctorName}` : appointment.patientName || appointment.patientId}
                    </h3>
                    {user?.role === 'patient' ? (
                      <p className="text-gray-600 text-sm">Reason: {appointment.reason}</p>
                    ) : (
                      <p className="text-gray-600 text-sm">with Dr. {appointment.doctorName}</p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(appointment.status)}`}
                  >
                    {appointment.status}
                  </span>
                </div>
                <div className="flex items-center gap-8 mb-4">
                  <div>
                    <p className="text-gray-600 text-sm">Date</p>
                    <p className="font-semibold text-gray-800">{appointment.appointmentDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Time</p>
                    <p className="font-semibold text-gray-800">{appointment.startTime}</p>
                  </div>
                </div>
                {appointment.notes && (
                  <div className="text-gray-700 text-sm border-t pt-3">
                    <p className="text-gray-600 text-sm mb-1">Notes</p>
                    <p>{appointment.notes}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-600">
              No appointments found
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
