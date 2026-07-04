import { Link, useParams } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface TopicResource {
  label: string;
  href: string;
}

interface TopicDetail {
  title: string;
  eyebrow: string;
  intro: string;
  summary: string;
  bullets: string[];
  sourceNote: string;
  resources: TopicResource[];
}

const topicDetails: Record<string, TopicDetail> = {
  '24-7-care': {
    title: '24/7 Care',
    eyebrow: 'Anytime access',
    intro: 'Telehealth gives patients a way to reach care when the clinic is closed, the commute is hard, or the need is urgent but not an emergency.',
    summary:
      'HHS describes telehealth as a way to understand what to expect from a virtual visit, what can be treated through telehealth, and how it can support chronic conditions and behavioral health care.',
    bullets: [
      'Good for common illnesses, follow-ups, medication questions, and quick triage.',
      'Helpful when you need guidance fast but do not need an in-person emergency room visit.',
      'Works best with a stable connection, but the care model can support rural and busy patients too.',
    ],
    sourceNote: 'Source-backed summary based on Telehealth.HHS.gov patient guidance.',
    resources: [
      { label: 'Telehealth patient guide', href: 'https://telehealth.hhs.gov/patients' },
      { label: 'What can be treated through telehealth?', href: 'https://telehealth.hhs.gov/patients/what-can-be-treated-through-telehealth' },
    ],
  },
  'primary-care': {
    title: 'Primary Care',
    eyebrow: 'Your first stop',
    intro: 'Primary care focuses on routine checkups, prevention, common illness, medication refills, and coordinating referrals when more specialized care is needed.',
    summary:
      'Primary care is the place to keep long-term health organized: regular visits, screenings, vaccinations, and a provider who knows your history.',
    bullets: [
      'Use it for annual checkups, preventive screenings, and everyday concerns.',
      'It helps coordinate referrals and keeps your medications and records aligned.',
      'It is often the entry point for ongoing care rather than a one-time visit.',
    ],
    sourceNote: 'This page is a concise clinical summary based on widely used primary-care guidance and telehealth patient resources.',
    resources: [
      { label: 'Telehealth and ongoing care', href: 'https://telehealth.hhs.gov/patients' },
      { label: 'NIMH health topics directory', href: 'https://www.nimh.nih.gov/health/topics' },
    ],
  },
  'mental-health': {
    title: 'Mental Health',
    eyebrow: 'Support and treatment',
    intro: 'Mental health care can cover anxiety, depression, trauma, OCD, ADHD, bipolar disorder, and many other conditions that affect daily life.',
    summary:
      'NIMH provides health-topic guidance for disorders and support options, including therapies, medications, coping with traumatic events, and finding help.',
    bullets: [
      'Talk therapy, medication, and combined treatment plans can all play a role.',
      'Professional support matters when stress, mood, sleep, or focus starts affecting work, school, or relationships.',
      'Crisis support is available through emergency services and suicide-prevention resources.',
    ],
    sourceNote: 'Source-backed summary based on NIMH mental health topic pages.',
    resources: [
      { label: 'NIMH health topics', href: 'https://www.nimh.nih.gov/health/topics' },
      { label: 'Caring for your mental health', href: 'https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health' },
    ],
  },
  'condition-management': {
    title: 'Condition Management',
    eyebrow: 'Long-term health support',
    intro: 'Condition management brings together monitoring, coaching, and treatment follow-up for chronic concerns such as blood pressure, weight, and metabolic health.',
    summary:
      'CDC guidance emphasizes prevention, monitoring, and lifestyle support for health conditions such as high blood pressure and healthy-weight management.',
    bullets: [
      'Tracking numbers and symptoms helps catch changes early.',
      'Nutrition, exercise, sleep, and stress management all matter.',
      'Ongoing support is often more effective than occasional one-off visits.',
    ],
    sourceNote: 'Source-backed summary based on CDC blood-pressure and healthy-weight guidance.',
    resources: [
      { label: 'High blood pressure overview', href: 'https://www.cdc.gov/high-blood-pressure/index.html' },
      { label: 'Healthy weight and growth', href: 'https://www.cdc.gov/healthy-weight-growth/about/index.html' },
    ],
  },
  'specialty-care': {
    title: 'Specialty Care',
    eyebrow: 'Expert referrals',
    intro: 'Specialty care is the next step when a provider needs deeper expertise in a focused area such as cardiology, dermatology, orthopedics, or behavioral health.',
    summary:
      'The care pathway usually starts with a primary-care visit, then a referral to a specialist when the condition needs targeted evaluation, testing, or a more advanced plan.',
    bullets: [
      'Specialists can focus on one body system or a narrower set of conditions.',
      'Referral-based care helps avoid duplicate tests and conflicting treatment plans.',
      'A well-coordinated specialist visit should still keep the full care team informed.',
    ],
    sourceNote: 'This page uses a general clinical-care summary because specialty care is best understood as a referral pathway across multiple disciplines.',
    resources: [
      { label: 'Telehealth provider guidance', href: 'https://telehealth.hhs.gov/providers' },
      { label: 'NIMH treatment and support topics', href: 'https://www.nimh.nih.gov/health/topics' },
    ],
  },
  'healthy-habits': {
    title: 'Everyday Healthy Habits',
    eyebrow: 'Prevention first',
    intro: 'Healthy habits are the day-to-day behaviors that protect long-term health: eating well, moving more, sleeping enough, and reducing stress.',
    summary:
      'NIH wellness toolkits and CDC healthy-weight guidance both stress that body, mind, and environment influence health, and that small routine changes can make a real difference.',
    bullets: [
      'Eat a balanced diet with enough water and fewer sugary drinks.',
      'Stay physically active and keep a regular sleep routine.',
      'Use stress-reduction habits and social support to stay consistent.',
    ],
    sourceNote: 'Source-backed summary based on NIH wellness toolkits and CDC healthy-weight guidance.',
    resources: [
      { label: 'NIH wellness toolkits', href: 'https://www.nih.gov/health-information/your-healthiest-self-wellness-toolkits' },
      { label: 'CDC healthy weight and growth', href: 'https://www.cdc.gov/healthy-weight-growth/about/index.html' },
    ],
  },
};

export const HealthTopic = () => {
  const { topic = '' } = useParams();
  const detail = topicDetails[topic];

  if (!detail) {
    return (
      <DashboardLayout>
        <div className="mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center px-4 py-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#6a45f0]">Learn more</p>
          <h1 className="mt-4 text-3xl font-black text-[#3d2d7d] sm:text-4xl">Topic not found</h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
            The page you tried to open is not available. Go back to the landing page and choose a health topic from the cards.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[#6a45f0] px-6 text-sm font-semibold text-white transition hover:bg-[#5638d6]"
          >
            Return home
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:p-8 lg:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#6a45f0]">{detail.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#3d2d7d] sm:text-4xl lg:text-5xl">
            {detail.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">{detail.intro}</p>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-[1.5rem] bg-[#f7f4ff] p-6">
              <h2 className="text-xl font-bold text-slate-900">What this covers</h2>
              <p className="mt-3 text-base leading-8 text-slate-700">{detail.summary}</p>
              <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-700">
                {detail.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-3">
                    <span className="mt-2 h-2.5 w-2.5 flex-none rounded-full bg-[#6a45f0]" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </section>

            <aside className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-bold text-slate-900">References</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{detail.sourceNote}</p>
              <div className="mt-6 space-y-3">
                {detail.resources.map((resource) => (
                  <a
                    key={resource.href}
                    href={resource.href}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#6a45f0] transition hover:border-[#6a45f0] hover:bg-[#f5f1ff]"
                  >
                    {resource.label}
                  </a>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
