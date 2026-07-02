import { useMemo, useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../hooks/useAuth';

type PlanStatus = 'active' | 'review' | 'done';

interface CareTask {
  id: string;
  title: string;
  note: string;
  due: string;
  done: boolean;
}

interface CarePlan {
  id: string;
  title: string;
  focus: string;
  status: PlanStatus;
  owner: string;
  summary: string;
  nextStep: string;
  tasks: CareTask[];
}

const initialPlans: CarePlan[] = [
  {
    id: 'bp-care-plan',
    title: 'Blood pressure management',
    focus: 'Weekly monitoring and medication adherence',
    status: 'active',
    owner: 'Dr. Joyce Mwangi',
    summary: 'Track home readings, review medication habits, and keep the follow-up visit aligned with the patient’s routine.',
    nextStep: 'Schedule a review call after two successful readings.',
    tasks: [
      { id: 'bp-1', title: 'Take morning blood pressure reading', note: 'Record both systolic and diastolic values.', due: 'Today', done: true },
      { id: 'bp-2', title: 'Refill antihypertensive medication', note: 'Confirm refill timing before the weekend.', due: 'Tomorrow', done: false },
      { id: 'bp-3', title: 'Complete symptom check-in', note: 'Share dizziness or headaches after the last dose.', due: 'Friday', done: false },
    ],
  },
  {
    id: 'post-visit-follow-up',
    title: 'Post-visit follow-up',
    focus: 'Recovery, medication questions, and next steps',
    status: 'review',
    owner: 'Care team',
    summary: 'Coordinate the recovery plan between the patient, specialist, and primary care team for a smoother transition.',
    nextStep: 'Share the updated care checklist with the patient by end of day.',
    tasks: [
      { id: 'fv-1', title: 'Review visit summary', note: 'Confirm the updated treatment notes are visible.', due: 'Today', done: true },
      { id: 'fv-2', title: 'Send aftercare instructions', note: 'Attach steps for hydration and rest.', due: 'Today', done: false },
    ],
  },
];

const statusStyles: Record<PlanStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  review: 'bg-amber-50 text-amber-700 border-amber-200',
  done: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const CarePlans = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState(initialPlans);
  const [activePlanId, setActivePlanId] = useState(initialPlans[0]?.id ?? '');

  const activePlan = useMemo(
    () => plans.find((plan) => plan.id === activePlanId) ?? plans[0],
    [activePlanId, plans]
  );

  const completedTasks = useMemo(
    () => plans.reduce((total, plan) => total + plan.tasks.filter((task) => task.done).length, 0),
    [plans]
  );

  const toggleTask = (planId: string, taskId: string) => {
    setPlans((current) =>
      current.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              tasks: plan.tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)),
            }
          : plan
      )
    );
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#6a45f0]">Care coordination</p>
          <h1 className="text-3xl font-black text-slate-900">Care plans</h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Keep follow-up tasks, recovery milestones, and treatment actions visible for patients and care teams.
          </p>
        </div>

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Progress snapshot</p>
              <p className="text-2xl font-black text-slate-900">{completedTasks} completed tasks</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Signed in as <span className="font-semibold text-slate-900">{user?.name || 'care team'}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-3">
            {plans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setActivePlanId(plan.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  activePlan?.id === plan.id
                    ? 'border-[#6a45f0] bg-[#f5f1ff] shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold text-slate-900">{plan.title}</h2>
                  <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${statusStyles[plan.status]}`}>
                    {plan.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{plan.focus}</p>
              </button>
            ))}
          </aside>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {activePlan ? (
              <>
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{activePlan.owner}</p>
                    <h2 className="mt-2 text-2xl font-black text-slate-900">{activePlan.title}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">{activePlan.summary}</p>
                  </div>
                  <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-sm font-semibold ${statusStyles[activePlan.status]}`}>
                    {activePlan.status}
                  </span>
                </div>

                <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Next step</p>
                  <p className="mt-1">{activePlan.nextStep}</p>
                </div>

                <div className="mt-6 space-y-3">
                  {activePlan.tasks.map((task) => (
                    <label key={task.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={() => toggleTask(activePlan.id, task.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-[#6a45f0] focus:ring-[#6a45f0]"
                      />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className={`font-semibold ${task.done ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{task.title}</p>
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{task.due}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{task.note}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">No care plans available yet.</p>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};
