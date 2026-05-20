/**
 * Home page
 */

import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const serviceCards = [
  {
    title: 'Clinical Operations',
    description: 'Coordinate patient workflows, team schedules, and front-desk handoffs from one place.',
    accent: 'from-rose-100 via-white to-amber-50',
    badge: '01',
  },
  {
    title: 'Diagnostic Support',
    description: 'Track labs, imaging, and clinical notes with a layout built for quick review.',
    accent: 'from-sky-100 via-white to-cyan-50',
    badge: '02',
  },
  {
    title: 'Secure Records',
    description: 'Keep critical records protected with authentication, offline sync, and encrypted storage.',
    accent: 'from-emerald-100 via-white to-teal-50',
    badge: '03',
  },
  {
    title: 'Patient Engagement',
    description: 'Share appointment updates, reminders, and self-service actions with a clean interface.',
    accent: 'from-violet-100 via-white to-fuchsia-50',
    badge: '04',
  },
];

const quickLinks = ['Emergency', 'Appointments', 'Contact', 'Hours'];

export const Home = () => {
  const navigate = useNavigate();
  const [waveAlt, setWaveAlt] = useState<boolean>(() => {
    try {
      return localStorage.getItem('afy_wave') === 'alt';
    } catch {
      return true;
    }
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('afy_theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('afy_wave', waveAlt ? 'alt' : 'default');
    } catch {}
  }, [waveAlt]);

  useEffect(() => {
    try {
      localStorage.setItem('afy_theme', darkMode ? 'dark' : 'light');
    } catch {}

    const cls = 'dark-mode';
    if (darkMode) document.documentElement.classList.add(cls);
    else document.documentElement.classList.remove(cls);
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-[#faf4f0] text-slate-900">
      <header className="border-b border-rose-950/10 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
        <div className="bg-[#8e171b] text-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 text-sm sm:px-6 lg:px-8">
            {quickLinks.slice(0, 2).map((item) => (
              <span key={item} className="inline-flex items-center gap-2 font-medium">
                <span className="h-2 w-2 rounded-full bg-amber-300" />
                {item}
              </span>
            ))}
            {quickLinks.slice(2).map((item) => (
              <span key={item} className="inline-flex items-center gap-2 font-medium">
                <span className="h-2 w-2 rounded-full bg-amber-300" />
                {item}
              </span>
            ))}
          </div>
        </div>

          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-rose-950/10 bg-gradient-to-br from-rose-100 to-amber-50 text-2xl shadow-sm">
              🏥
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-rose-700">
                Afyasync
              </p>
              <p className="text-lg font-semibold text-slate-900">Clinical Services Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              title="Toggle hero wave"
              onClick={() => setWaveAlt((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              🌊
            </button>

            <button
              type="button"
              title="Toggle theme"
              onClick={() => setDarkMode((d) => !d)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              {darkMode ? '🌙' : '☀️'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex h-11 items-center justify-center rounded-full border border-rose-950/10 bg-slate-900 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Enter portal
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero-wave px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-6xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-rose-100/90">
              Tailwind-powered interface
            </p>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Clinical services with a modern, app-like layout.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-rose-50/90 sm:text-xl">
              This landing page now uses a Tailwind composition inspired by the screenshot: a
              strong utility bar, centered hero, and a two-column service grid designed for fast
              scanning on desktop and mobile.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 hero-animated">
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#8e171b] transition glow-btn primary"
              >
                Create account
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur transition glow-btn"
              >
                Sign in
              </button>
            </div>
          </div>

          {/* Decorative SVG wave */}
          <div className={`hero-wave-svg -mt-12 ${waveAlt ? 'wave-style-2' : 'wave-style-1'}`}>
            <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-28" aria-hidden="true">
              {/* Default wave (gentle peaks) */}
              <path className="wave-default" d="M0,32 C120,64 360,96 720,88 C1080,80 1320,40 1440,24 L1440,120 L0,120 Z" />
              {/* Alternate wave (smooth rolling) */}
              <path className="wave-alt" d="M0,48 C240,96 480,16 720,40 C960,64 1200,120 1440,56 L1440,120 L0,120 Z" />
            </svg>
          </div>

        </section>

        <section className="mx-auto -mt-8 max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-2">
            {serviceCards.map((card) => (
              <article
                key={card.title}
                className="overflow-hidden rounded-[2rem] border border-rose-950/10 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)] glass-card section-fade"
              >
                <div className={`h-56 bg-gradient-to-br ${card.accent} p-5`}>
                  <div className="flex h-full items-end justify-between rounded-[1.5rem] border border-white/60 bg-white/40 p-4 backdrop-blur-sm">
                    <div className="space-y-2">
                      <div className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700 shadow-sm">
                        Service {card.badge}
                      </div>
                      <p className="max-w-xs text-sm leading-6 text-slate-700">
                        Minimal, responsive, and clean cards that echo the screenshot without
                        copying its text.
                      </p>
                    </div>
                    <div className="grid h-28 w-28 place-items-center rounded-[1.5rem] bg-slate-900/90 text-4xl text-white shadow-xl">
                      ✦
                    </div>
                  </div>
                </div>

                <div className="space-y-3 p-6">
                  <h2 className="text-2xl font-extrabold text-slate-900">{card.title}</h2>
                  <p className="text-base leading-7 text-slate-600">{card.description}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-rose-950/10 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Availability</p>
              <p className="mt-2 text-3xl font-black text-slate-900">24/7</p>
              <p className="mt-2 text-sm text-slate-600">Designed for always-on clinical access.</p>
            </div>
            <div className="rounded-[1.5rem] border border-rose-950/10 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Interface</p>
              <p className="mt-2 text-3xl font-black text-slate-900">Tailwind</p>
              <p className="mt-2 text-sm text-slate-600">Utility classes keep the layout consistent.</p>
            </div>
            <div className="rounded-[1.5rem] border border-rose-950/10 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Access</p>
              <p className="mt-2 text-3xl font-black text-slate-900">Secure</p>
              <p className="mt-2 text-sm text-slate-600">Protected routes and offline support stay intact.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Floating contact button */}
      <button
        type="button"
        className="fab pulse"
        onClick={() => navigate('/contact')}
        aria-label="Contact support"
        title="Contact support"
      >
        💬
      </button>
    </div>
  );
};
