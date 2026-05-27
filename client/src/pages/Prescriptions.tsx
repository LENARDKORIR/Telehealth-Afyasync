import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { prescriptionService } from '../services/prescriptionService';
import type { Prescription } from '../types/prescription';

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  refill_requested: 'bg-amber-50 text-amber-700 border-amber-200',
  refilled: 'bg-blue-50 text-blue-700 border-blue-200',
  paused: 'bg-slate-100 text-slate-700 border-slate-200',
};

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const Prescriptions = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  const loadPrescriptions = async () => {
    setLoading(true);
    setError('');

    try {
      const items = await prescriptionService.getPrescriptions();
      setPrescriptions(items);
    } catch (loadError) {
      console.error('Failed to load prescriptions:', loadError);
      setError('Unable to load prescriptions right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPrescriptions();
  }, [user?.id, user?.role]);

  const refillRequests = useMemo(
    () => prescriptions.filter((item) => item.status === 'refill_requested'),
    [prescriptions]
  );

  const handleRequestRefill = async (id: string) => {
    setSavingId(id);
    setError('');
    setMessage('');

    try {
      const updated = await prescriptionService.requestRefill(id, notesById[id] || '');
      setPrescriptions((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setMessage('Refill request sent securely.');
      setExpandedId(null);
    } catch (requestError) {
      console.error('Failed to request refill:', requestError);
      setError('Unable to request a refill right now.');
    } finally {
      setSavingId(null);
    }
  };

  const handleCompleteRefill = async (id: string) => {
    setSavingId(id);
    setError('');
    setMessage('');

    try {
      const updated = await prescriptionService.completeRefill(id, notesById[id] || '');
      setPrescriptions((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setMessage('Refill marked as completed.');
    } catch (completeError) {
      console.error('Failed to complete refill:', completeError);
      setError('Unable to update the refill right now.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#6a45f0]">Medication care</p>
            <h1 className="text-3xl font-black text-slate-900">Prescriptions</h1>
            <p className="text-sm text-slate-500">Track medication history and manage refill requests.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="space-y-4">
            {loading ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
                Loading prescriptions...
              </div>
            ) : prescriptions.length > 0 ? (
              prescriptions.map((prescription) => {
                const isExpanded = expandedId === prescription.id;
                const isRequestable = prescription.status === 'active';
                const isRequestPending = prescription.status === 'refill_requested';

                return (
                  <article key={prescription.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {prescription.patientName || prescription.patientId}
                        </p>
                        <h2 className="mt-1 text-2xl font-bold text-slate-900">{prescription.medicationName}</h2>
                        <p className="mt-1 text-sm text-slate-500">
                          Prescribed by {prescription.doctorName || prescription.doctorId}
                        </p>
                      </div>
                      <span
                        className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[prescription.status] || statusStyles.active}`}
                      >
                        {prescription.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <p className="text-sm text-slate-500">Dosage</p>
                        <p className="font-semibold text-slate-900">{prescription.dosage}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Frequency</p>
                        <p className="font-semibold text-slate-900">{prescription.frequency}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Duration</p>
                        <p className="font-semibold text-slate-900">{prescription.duration}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Last refill</p>
                        <p className="font-semibold text-slate-900">{formatDate(prescription.lastRefilledAt)}</p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                      <p className="mb-1 text-slate-500">Instructions</p>
                      <p className="whitespace-pre-wrap leading-6">{prescription.instructions}</p>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : prescription.id)}
                        className="inline-flex items-center justify-center rounded-2xl border border-[#6a45f0] bg-[#f5f1ff] px-4 py-2 text-sm font-semibold text-[#6a45f0] transition hover:bg-[#ece5ff]"
                      >
                        {isExpanded ? 'Hide refill request' : 'Request refill'}
                      </button>

                      {(user?.role === 'doctor' || user?.role === 'admin') && isRequestPending && (
                        <button
                          type="button"
                          onClick={() => handleCompleteRefill(prescription.id)}
                          disabled={savingId === prescription.id}
                          className="inline-flex items-center justify-center rounded-2xl bg-[#8e171b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#741215] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingId === prescription.id ? 'Updating...' : 'Mark refilled'}
                        </button>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Refill notes</label>
                        <textarea
                          value={notesById[prescription.id] || ''}
                          onChange={(event) =>
                            setNotesById((current) => ({
                              ...current,
                              [prescription.id]: event.target.value,
                            }))
                          }
                          rows={3}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                          placeholder="Add any refill questions or symptoms..."
                        />
                        <button
                          type="button"
                          onClick={() => handleRequestRefill(prescription.id)}
                          disabled={savingId === prescription.id || !isRequestable}
                          className="mt-3 inline-flex items-center justify-center rounded-2xl bg-[#8e171b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#741215] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingId === prescription.id ? 'Sending...' : 'Submit refill request'}
                        </button>
                        {!isRequestable && (
                          <p className="mt-2 text-sm text-slate-500">
                            Refill requests can be submitted when a prescription is active.
                          </p>
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-slate-600 shadow-sm">
                No prescriptions found.
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Medication history</p>
              <div className="mt-4 space-y-3">
                {prescriptions.slice(0, 4).map((prescription) => (
                  <div key={prescription.id} className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">{prescription.medicationName}</p>
                    <p className="text-sm text-slate-500">
                      {prescription.dosage} · {prescription.frequency}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Updated {formatDate(prescription.updatedAt)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Refill requests</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{refillRequests.length}</p>
              <p className="mt-2 text-sm text-slate-500">Open requests ready for provider review.</p>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
};
