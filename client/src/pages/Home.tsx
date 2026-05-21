/**
 * Home page
 */

import { Link, useNavigate } from 'react-router-dom';

const quickLinks = ['Emergency', 'Appointments', 'Contact', 'Hours'];

const footerColumns = [
  {
    title: 'Individuals',
    links: [
      { label: '24/7 Care', to: '/register' },
      { label: 'Mental Health', to: '/register' },
      { label: 'Weight Management', to: '/patients' },
      { label: 'Diabetes Management', to: '/patients' },
      { label: 'Hypertension Management', to: '/patients' },
      { label: 'Specialty & Wellness', to: '/appointments' },
      { label: 'Primary Care', to: '/login' },
    ],
  },
  {
    title: 'Organizations',
    links: [
      { label: 'Our Approach', to: '/' },
      { label: 'Employers', to: '/register' },
      { label: 'Health Plans', to: '/dashboard' },
      { label: 'Hospitals & Health Systems', to: '/dashboard' },
      { label: 'Resource Center', to: '/reports' },
    ],
  },
  {
    title: 'Clinicians',
    links: [
      { label: 'Commitment to Quality', to: '/settings' },
      { label: 'Provider Careers', to: '/login' },
    ],
  },
  {
    title: 'Who we are',
    links: [
      { label: 'Our Company', to: '/' },
      { label: 'Our Impact', to: '/dashboard' },
      { label: 'Leadership', to: '/dashboard' },
      { label: 'Careers', to: '/register' },
      { label: 'Industry Events', to: '/reports' },
      { label: 'Newsroom', to: '/reports' },
      { label: 'Investors', to: '/reports' },
    ],
  },
  {
    title: 'Helpful Links',
    links: [
      { label: 'Contact Us', to: '/login' },
      { label: 'Health Library', to: '/reports' },
      { label: 'Help Center', to: '/settings' },
      { label: 'Legal, Privacy & Compliance', to: '/settings' },
      { label: 'Your Privacy Choices', to: '/settings' },
      { label: 'Language Assistance Services', to: '/settings' },
      { label: 'Community Guidelines', to: '/settings' },
    ],
  },
];

const storeLinks = [
  {
    label: 'App Store',
    subtitle: 'Download on the',
    href: 'https://apps.apple.com/us/search?term=Telehealth',
  },
  {
    label: 'Google Play',
    subtitle: 'Get it on',
    href: 'https://play.google.com/store/search?q=Telehealth&c=apps',
  },
];

const serviceCards = [
  {
    title: '24/7 Care',
    description:
      'Talk to a medical provider anytime, day or night. Whether it is symptoms, allergies or infections, get the care you need from anywhere.',
    link: 'Learn more →',
    tone: 'card-tile-1',
    image: '/landing-images/care-247.svg',
  },
  {
    title: 'Primary Care',
    description:
      'Stay on top of your health with board-certified providers supporting your checkups, preventative care and prescriptions.',
    link: 'Learn more →',
    tone: 'card-tile-2',
    image: '/landing-images/primary-care.svg',
  },
  {
    title: 'Mental Health',
    description:
      'Access a network of licensed therapists and psychiatrists to help navigate anxiety, stress, depression and more.',
    link: 'Telehealth Mental Health →',
    tone: 'card-tile-3',
    image: '/landing-images/mental-health.svg',
  },
  {
    title: 'Condition Management',
    description:
      'Get personalized coaching and connected devices for diabetes, weight and blood pressure management built to last.',
    link: 'Diabetes →',
    tone: 'card-tile-4',
    image: '/landing-images/condition-management.svg',
  },
  {
    title: 'Specialty Care',
    description:
      'Consult with specialists to review your case and guide you through everything from minor concerns to major diagnoses.',
    link: 'Dermatology →',
    tone: 'card-tile-5',
    image: '/landing-images/specialty-care.svg',
  },
  {
    title: 'Everyday Healthy Habits',
    description:
      'Build healthier habits with trained professionals who support your nutrition, fitness and sleep goals.',
    link: 'Nutrition →',
    tone: 'card-tile-6',
    image: '/landing-images/healthy-habits.svg',
  },
];

export const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f4f2fb] text-slate-900">
      <header className="border-b border-slate-900/10 bg-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="bg-[#3d2d7d] text-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 text-sm sm:px-6 lg:px-8">
            {quickLinks.slice(0, 2).map((item) => (
              <span key={item} className="inline-flex items-center gap-2 font-medium">
                <span className="h-2 w-2 rounded-full bg-[#9f8cff]" />
                {item}
              </span>
            ))}
            {quickLinks.slice(2).map((item) => (
              <span key={item} className="inline-flex items-center gap-2 font-medium">
                <span className="h-2 w-2 rounded-full bg-[#9f8cff]" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-900/10 bg-gradient-to-br from-[#efe9ff] to-white text-2xl shadow-sm">
              🏥
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#6a45f0]">
                Afyasync
              </p>
              <p className="text-lg font-semibold text-slate-900">Clinical Services Platform</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="inline-flex h-11 items-center justify-center rounded-full border border-slate-900/10 bg-slate-900 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            Enter portal
          </button>
        </div>
      </header>

      <main>
        <section className="px-4 pt-16 sm:px-6 lg:px-8 lg:pt-20">
          <div className="mx-auto max-w-5xl text-center">
            <h1 className="text-4xl font-black tracking-tight text-[#3d2d7d] sm:text-5xl lg:text-6xl">
              The care you need, all in one place
            </h1>
            <div className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-700 sm:text-xl">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#6a45f0]">About</p>
              <p className="mt-3">
                A secure web platform that connects patients and healthcare providers — online or
                offline. Medical records and consultations are encrypted and automatically synced
                the moment connectivity is restored.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {serviceCards.map((card) => (
              <article
                key={card.title}
                className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
              >
                <div className={`card-photo ${card.tone}`}>
                  <img src={card.image} alt={card.title} className="card-photo-image" />
                  <div className="card-photo-overlay" />
                  <div className="card-photo-copy">
                    <span>{card.title}</span>
                  </div>
                </div>

                <div className="space-y-3 px-1 pt-5">
                  <h2 className="px-1 text-2xl font-black text-[#3d2d7d]">{card.title}</h2>
                  <p className="px-1 text-lg leading-8 text-slate-800">{card.description}</p>
                  <a
                    href="/login"
                    className="inline-flex items-center gap-2 px-1 text-lg font-medium text-[#6a45f0] transition hover:translate-x-1"
                  >
                    {card.link}
                    <span aria-hidden="true">→</span>
                  </a>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="inline-flex h-14 items-center justify-center rounded-full bg-[#6a45f0] px-8 text-base font-semibold text-white shadow-[0_20px_40px_rgba(106,69,240,0.25)] transition hover:-translate-y-0.5 hover:bg-[#5638d6]"
            >
              Get care now
            </button>
          </div>

          <div className="mt-20 rounded-[2rem] border border-slate-900/10 bg-white px-6 py-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] lg:px-10 lg:py-10">
            <div className="mx-auto max-w-6xl text-center">
              <h2 className="text-3xl font-black tracking-tight text-[#3d2d7d] sm:text-4xl lg:text-5xl">
                Transforming virtual care into a catalyst for better health
              </h2>
              <div className="mt-8 flex flex-wrap justify-center gap-8 text-sm font-bold uppercase tracking-[0.2em] text-[#6a45f0]">
                <span className="border-b-4 border-[#6a45f0] pb-2">Health Plans</span>
                <span>Employers</span>
                <span>Hospitals &amp; Health Systems</span>
              </div>

              <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:text-left">
                <div>
                  <h3 className="text-4xl font-black tracking-tight text-[#3d2d7d] sm:text-5xl">
                    A high-quality care experience - anywhere, anytime
                  </h3>
                  <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
                    Create meaningful outcomes and measurable ROI for your population. Afyasync
                    delivers and orchestrates care with the calm, screen-first layout shown in the
                    screenshots above.
                  </p>
                  <div className="mt-8 grid gap-6 sm:grid-cols-2">
                    <div>
                      <p className="text-5xl font-black text-[#6a45f0]">100+</p>
                      <p className="mt-2 text-base text-slate-700">
                        U.S. health plans partner with Afyasync
                      </p>
                    </div>
                    <div>
                      <p className="text-5xl font-black text-[#6a45f0]">100M+</p>
                      <p className="mt-2 text-base text-slate-700">
                        People have access to virtual care
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="mt-10 inline-flex h-12 items-center justify-center rounded-full border-2 border-[#6a45f0] bg-white px-7 text-base font-semibold text-[#6a45f0] transition hover:bg-[#6a45f0] hover:text-white"
                  >
                    Learn more
                  </button>
                </div>

                <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#eadffb] via-white to-[#e3f2ff] p-4 shadow-[0_24px_60px_rgba(61,45,127,0.18)]">
                  <div className="relative h-[380px] rounded-[1.5rem] bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.95),transparent_24%),radial-gradient(circle_at_80%_18%,rgba(255,255,255,0.75),transparent_22%),linear-gradient(180deg,#efe7ff_0%,#e3eefc_100%)]">
                    <div className="absolute left-8 top-12 h-32 w-32 rounded-[2rem] bg-white/70 shadow-[0_18px_40px_rgba(15,23,42,0.12)]" />
                    <div className="absolute right-10 top-16 h-48 w-32 rounded-[2rem] bg-[#b8c8f7]/70 shadow-[0_18px_40px_rgba(15,23,42,0.12)]" />
                    <div className="absolute bottom-8 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-[#6a45f0]/90 shadow-[0_16px_30px_rgba(106,69,240,0.35)]" />
                    <div className="absolute inset-x-8 bottom-6 rounded-[1.25rem] bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm">
                      Trusted care, simplified scheduling, and better outcomes.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-900/10 bg-white px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="max-w-6xl text-sm leading-6 text-slate-700 sm:text-base">
              The testimonials, opinions and statements reflect one individual’s personal
              experience with Telehealth. Results and experiences may vary from person to person
              and will be unique to each individual. The testimonials are voluntarily provided and
              are not paid. The individual in the photo is not the individual who provided this
              testimonial.
            </p>

            <div className="mt-12 grid gap-10 lg:grid-cols-[0.9fr_repeat(5,minmax(0,1fr))]">
              <div className="space-y-6">
                <div>
                  <p className="text-3xl font-black tracking-tight text-[#3d2d7d]">Telehealth</p>
                  <p className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Headquarters
                  </p>
                  <p className="mt-2 text-base leading-7 text-slate-800">
                    Telehealth, Inc.
                    <br />
                    Ronald Ngala Street,
                    <br />
                    Nairobi, Kenya
                  </p>
                </div>

                <p className="max-w-sm text-2xl font-black leading-8 text-slate-900">
                  Empowering all people everywhere to live their healthiest lives.
                </p>
              </div>

              {footerColumns.map((column) => (
                <div key={column.title}>
                  <h3 className="text-lg font-black text-[#3d2d7d]">{column.title}</h3>
                  <ul className="mt-4 space-y-3 text-base leading-7 text-slate-800">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <Link to={link.to} className="transition hover:text-[#6a45f0] hover:underline">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-col gap-4 border-t border-slate-900/10 pt-6 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
              <p>© 2026 Telehealth, Inc. PL015954.A</p>
              <div className="flex flex-wrap gap-3">
                {storeLinks.map((store) => (
                  <a
                    key={store.label}
                    href={store.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex min-w-[180px] items-center gap-3 rounded-2xl border border-slate-900/10 bg-slate-950 px-4 py-3 text-white shadow-[0_12px_24px_rgba(15,23,42,0.2)] transition hover:-translate-y-0.5 hover:bg-black"
                    aria-label={`${store.subtitle} ${store.label}`}
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-lg">
                      {store.label === 'App Store' ? '' : '▶'}
                    </span>
                    <span className="leading-tight">
                      <span className="block text-[10px] uppercase tracking-[0.22em] text-white/70">
                        {store.subtitle}
                      </span>
                      <span className="block text-lg font-semibold">
                        {store.label}
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};