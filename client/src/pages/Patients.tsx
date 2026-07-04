/**
 * Patients page - shows patient profile (for patients) or patient list (for doctors/admins)
 */

import { useState, useEffect } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { patientService } from '../services/patientService';
import type { Patient } from '../types/patient';

export const Patients = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'patient' && user?.id) {
      // Patient sees only their own profile
      setLoading(true);
      patientService
        .getPatient(user.id)
        .then((p) => {
          if (p) setPatients([{ ...p, id: user.id }]);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else if (user?.role === 'doctor' || user?.role === 'admin') {
      // Doctors and admins see all patients
      setLoading(true);
      patientService
        .getAllPatients()
        .then(setPatients)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center text-gray-600">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        {user?.role === 'patient' ? (
          <>
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">My Profile</h1>
                <p className="text-sm text-slate-500">Your personal health details</p>
              </div>
            </div>

            <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
              {filteredPatients.length > 0 ? (
                <div className="space-y-4">
                  {filteredPatients.map((patient) => (
                    <div key={patient.id} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="min-w-0">
                          <p className="text-gray-600 text-sm">Name</p>
                          <p className="break-words font-semibold text-slate-900">{patient.name}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-gray-600 text-sm">Email</p>
                          <p className="break-words font-semibold text-slate-900">{patient.email}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-gray-600 text-sm">Phone</p>
                          <p className="font-semibold text-slate-900">{patient.phone}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-gray-600 text-sm">Date of Birth</p>
                          <p className="font-semibold text-slate-900">{patient.dateOfBirth}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-gray-600 text-sm">Gender</p>
                          <p className="font-semibold text-slate-900 capitalize">{patient.gender}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-gray-600 text-sm">Blood Group</p>
                          <p className="font-semibold text-slate-900">{patient.bloodGroup || 'N/A'}</p>
                        </div>
                        <div className="sm:col-span-2 min-w-0">
                          <p className="text-gray-600 text-sm">Address</p>
                          <p className="font-semibold text-slate-900">{patient.address}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Profile information not available</p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Patients</h1>
                <p className="text-sm text-slate-500">Manage patient records from anywhere</p>
              </div>
              <button className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                + Add Patient
              </button>
            </div>

            <div className="mb-6">
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div className="space-y-4 md:hidden">
              {filteredPatients.map((patient) => (
                <article key={patient.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-slate-900">{patient.name}</h2>
                      <p className="mt-1 break-words text-sm text-slate-500">{patient.email}</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      Patient
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500">Phone</p>
                      <p className="font-medium text-slate-900">{patient.phone}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">DOB</p>
                      <p className="font-medium text-slate-900">{patient.dateOfBirth}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3 border-t border-slate-100 pt-4">
                    <button className="text-sm font-semibold text-blue-600">View</button>
                    <button className="text-sm font-semibold text-slate-600">Edit</button>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">DOB</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-gray-800 font-medium">{patient.name}</td>
                      <td className="px-6 py-4 text-gray-600">{patient.email}</td>
                      <td className="px-6 py-4 text-gray-600">{patient.phone}</td>
                      <td className="px-6 py-4 text-gray-600">{patient.dateOfBirth}</td>
                      <td className="px-6 py-4 flex gap-2">
                        <button className="text-blue-600 hover:underline text-sm">View</button>
                        <button className="text-gray-600 hover:underline text-sm">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};
