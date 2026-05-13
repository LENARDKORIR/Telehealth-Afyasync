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
      <div className="p-6">
        {user?.role === 'patient' ? (
          <>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">My Profile</h1>
            <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl">
              {filteredPatients.length > 0 ? (
                <div className="space-y-4">
                  {filteredPatients.map((patient) => (
                    <div key={patient.id} className="border-b pb-4 last:border-b-0">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-600 text-sm">Name</p>
                          <p className="font-semibold text-gray-800">{patient.name}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Email</p>
                          <p className="font-semibold text-gray-800">{patient.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Phone</p>
                          <p className="font-semibold text-gray-800">{patient.phone}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Date of Birth</p>
                          <p className="font-semibold text-gray-800">{patient.dateOfBirth}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Gender</p>
                          <p className="font-semibold text-gray-800 capitalize">{patient.gender}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Blood Group</p>
                          <p className="font-semibold text-gray-800">{patient.bloodGroup || 'N/A'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-600 text-sm">Address</p>
                          <p className="font-semibold text-gray-800">{patient.address}</p>
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
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Patients</h1>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                + Add Patient
              </button>
            </div>

            <div className="mb-6">
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
