import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { getPatientLanguagePack } from '../utils/patientLanguage';

export const Emergency = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const languagePack = useMemo(() => getPatientLanguagePack(user?.id), [user?.id]);

  const urgentContactHref = '/messages?contact=urgent-care-team&subject=Urgent%20symptoms&body=I%20need%20urgent%20help%20from%20the%20care%20team.';

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-rose-700">{languagePack.emergencyCta}</p>
          <h1 className="mt-2 text-3xl font-black text-rose-950">Emergency escalation</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-rose-900/80 sm:text-base">
            {languagePack.emergencyHelp}
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-slate-900">What to do now</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
              <p>If you have chest pain, trouble breathing, sudden weakness, heavy bleeding, or severe confusion, use emergency services first.</p>
              <p>If the situation is urgent but not life-threatening, send a secure message to the urgent care team so a clinician can review it quickly.</p>
              <p>You can also use your saved language preference on patient-facing screens to keep instructions easier to follow.</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to={urgentContactHref}
                className="inline-flex items-center justify-center rounded-2xl bg-[#8e171b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#741215]"
              >
                Message urgent care
              </Link>
              <button
                type="button"
                onClick={() => navigate('/appointments')}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Open appointments
              </button>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Escalation checklist</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>Call emergency services if symptoms are severe or life-threatening.</li>
                <li>Use secure messaging for urgent-but-stable symptoms.</li>
                <li>Keep the intake form updated before the next visit.</li>
                <li>Review lab results and documents in Records after escalation.</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Emergency note</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                This page is a care-coordination tool, not a replacement for local emergency services.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
};