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
  completedAppointments?: number;
  myAppointments?: number;
  upcomingAppointments?: number;
  completedRecords?: number;
}

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    if (user.role === 'patient') {
      // Load patient-specific stats
      Promise.all([
        api.get(`/appointments/patient/${user.id}`).catch(() => ({ data: { data: [] } })),
        api.get(`/medical-records/patient/${user.id}`).catch(() => ({ data: { data: [] } })),
      ])
        .then(([appointmentsRes, recordsRes]) => {
          const appointments = appointmentsRes.data.data || [];
          const records = recordsRes.data.data || [];
          const scheduled = appointments.filter((a: any) => a.status === 'scheduled').length;
          const completed = appointments.filter((a: any) => a.status === 'completed').length;

          setStats({
            myAppointments: appointments.length,
            upcomingAppointments: scheduled,
            completedAppointments: completed,
            completedRecords: records.length,
          });
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      // Load doctor/admin stats (static for now)
      setStats({
        totalPatients: 145,
        appointmentsToday: 12,
        pendingReports: 8,
        criticalCases: 3,
        totalAppointments: 892,
        completedAppointments: 756,
      });
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center text-gray-600">Loading dashboard...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {user?.name}! 👋</h1>
        <p className="text-gray-600 mb-8">
          Role: <span className="font-semibold capitalize">{user?.role}</span>
        </p>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {user?.role === 'patient' ? (
            <>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">My Appointments</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.myAppointments || 0}</p>
                  </div>
                  <span className="text-4xl">📅</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Upcoming</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.upcomingAppointments || 0}</p>
                  </div>
                  <span className="text-4xl">⏰</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Completed</p>
                    <p className="text-3xl font-bold text-green-600">{stats.completedAppointments || 0}</p>
                  </div>
                  <span className="text-4xl">✅</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Medical Records</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.completedRecords || 0}</p>
                  </div>
                  <span className="text-4xl">📋</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Patients</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.totalPatients}</p>
                  </div>
                  <span className="text-4xl">👥</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Appointments Today</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.appointmentsToday}</p>
                  </div>
                  <span className="text-4xl">📅</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Pending Reports</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.pendingReports}</p>
                  </div>
                  <span className="text-4xl">📄</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Critical Cases</p>
                    <p className="text-3xl font-bold text-red-600">{stats.criticalCases}</p>
                  </div>
                  <span className="text-4xl">🚨</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Appointments Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {user?.role === 'patient' ? 'Appointment Progress' : 'Appointment Statistics'}
            </h3>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Completed: {stats.completedAppointments || 0} / {stats.totalAppointments || stats.myAppointments || 0}
                </p>
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-2xl">
                  {stats.totalAppointments || stats.myAppointments
                    ? Math.round(
                        ((stats.completedAppointments || 0) /
                          (stats.totalAppointments || stats.myAppointments || 1)) *
                          100
                      )
                    : 0}
                  %
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {user?.role === 'patient' ? (
                <>
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="font-semibold text-gray-800">Appointments Completed</p>
                      <p className="text-sm text-gray-600">{stats.completedAppointments} total</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <span className="text-2xl">📋</span>
                    <div>
                      <p className="font-semibold text-gray-800">Medical Records</p>
                      <p className="text-sm text-gray-600">{stats.completedRecords} on file</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⏰</span>
                    <div>
                      <p className="font-semibold text-gray-800">Upcoming Appointments</p>
                      <p className="text-sm text-gray-600">{stats.upcomingAppointments} scheduled</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="font-semibold text-gray-800">Appointment Completed</p>
                      <p className="text-sm text-gray-600">Dr. Smith with Patient John</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pb-4 border-b">
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
