import { useMemo, useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { getPatientLanguagePack } from '../utils/patientLanguage';

const visitTypeOptions = ['Routine checkup', 'New symptoms', 'Medication review', 'Follow-up'];

export const Intake = () => {
  const { user } = useAuth();
  const languagePack = useMemo(() => getPatientLanguagePack(user?.id), [user?.id]);
  const [form, setForm] = useState({
    visitType: visitTypeOptions[0],
    symptoms: '',
    medications: '',
    allergies: '',
    notes: '',
  });
  const [message, setMessage] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setMessage('');
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('Intake saved locally and ready to share with your clinician at the next visit.');
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#6a45f0]">{languagePack.pageLabel}</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">{languagePack.intakeTitle}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{languagePack.intakeSubtitle}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Visit type</label>
                <select
                  name="visitType"
                  value={form.visitType}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                >
                  {visitTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{languagePack.symptomLabel}</label>
                <textarea
                  name="symptoms"
                  value={form.symptoms}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                  placeholder="Tell us what brought you in"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">{languagePack.medicationLabel}</label>
                  <textarea
                    name="medications"
                    value={form.medications}
                    onChange={handleChange}
                    rows={4}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                    placeholder="List prescriptions, supplements, or over-the-counter medicines"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">{languagePack.allergyLabel}</label>
                  <textarea
                    name="allergies"
                    value={form.allergies}
                    onChange={handleChange}
                    rows={4}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                    placeholder="List medication or food allergies"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{languagePack.noteLabel}</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#6a45f0] focus:ring-4 focus:ring-[#6a45f0]/10"
                  placeholder="Add anything else your clinician should know"
                />
              </div>

              {message && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {message}
                </div>
              )}

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl bg-[#8e171b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#741215]"
              >
                {languagePack.submitLabel}
              </button>
            </form>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Pre-visit checklist</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>Bring a current medication list.</li>
                <li>Note any recent symptoms or changes.</li>
                <li>Upload documents or lab results from outside clinics in Records.</li>
                <li>Use Messages for urgent questions before the visit.</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{languagePack.reminderTitle}</p>
              <p className="mt-2 text-sm text-slate-600">{languagePack.reminderSubtitle}</p>
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Appointment reminders are already available in the Appointments screen.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
};