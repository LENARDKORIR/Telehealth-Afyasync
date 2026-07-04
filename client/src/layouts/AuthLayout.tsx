/**
 * Auth layout
 */

import { OfflineBanner } from '../components/OfflineBanner';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-[#f4f2fb] text-slate-900">
      <div className="relative overflow-hidden auth-shell">
        <OfflineBanner />
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-r from-[#8e171b] via-[#a01924] to-[#3d2d7d]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(106,69,240,0.12),_transparent_28%)]" />
        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid w-full items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="hidden lg:block auth-copy">
              <p className="text-sm font-semibold uppercase tracking-[0.45em] text-[#6a45f0]">
                Secure Telehealth Portal
              </p>
              <h1 className="mt-4 max-w-xl text-5xl font-black tracking-tight text-[#121a33] xl:text-6xl">
                A cleaner clinical workspace for patients and care teams.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-700">
                The sign-in experience now matches the refreshed landing page with a warm,
                editorial layout, softer gradients, and the same calm clinical tone.
              </p>

              <div className="mt-10 auth-hero-art max-w-2xl rounded-[2rem] border border-slate-900/10 bg-white/70 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur">
                <div className="grid grid-cols-[1.15fr_0.85fr] gap-4">
                  <div className="auth-hero-illustration rounded-[1.75rem]">
                    <div className="auth-hero-overlay" />
                    <div className="auth-hero-card">
                      <span className="auth-hero-kicker">Create account</span>
                      <strong>Get started</strong>
                      <span>Join the secure telehealth workspace.</span>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    <div className="rounded-[1.5rem] border border-slate-900/10 bg-white/90 p-4 shadow-sm">
                      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#6a45f0]">Offline sync</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        Records and consultations stay encrypted and sync automatically when the connection returns.
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-slate-900/10 bg-white/90 p-4 shadow-sm">
                      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#6a45f0]">Secure access</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        Patients and providers share one calm workspace across devices.
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 pt-1">
                      <div className="rounded-[1.25rem] border border-slate-900/10 bg-white/80 p-3 shadow-sm">
                        <p className="text-2xl font-black text-[#6a45f0]">24/7</p>
                        <p className="mt-1 text-xs text-slate-600">Access</p>
                      </div>
                      <div className="rounded-[1.25rem] border border-slate-900/10 bg-white/80 p-3 shadow-sm">
                        <p className="text-2xl font-black text-[#6a45f0]">100+</p>
                        <p className="mt-1 text-xs text-slate-600">Plans</p>
                      </div>
                      <div className="rounded-[1.25rem] border border-slate-900/10 bg-white/80 p-3 shadow-sm">
                        <p className="text-2xl font-black text-[#6a45f0]">Sync</p>
                        <p className="mt-1 text-xs text-slate-600">Offline-safe</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-auto w-full max-w-md auth-panel">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
