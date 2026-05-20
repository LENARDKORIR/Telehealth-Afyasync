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

              <div className="mt-8 grid max-w-xl grid-cols-3 gap-4">
                <div className="rounded-[1.25rem] border border-slate-900/10 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <p className="text-2xl font-black text-[#6a45f0]">24/7</p>
                  <p className="mt-1 text-sm text-slate-700">Access</p>
                </div>
                <div className="rounded-[1.25rem] border border-slate-900/10 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <p className="text-2xl font-black text-[#6a45f0]">100+</p>
                  <p className="mt-1 text-sm text-slate-700">Plans</p>
                </div>
                <div className="rounded-[1.25rem] border border-slate-900/10 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <p className="text-2xl font-black text-[#6a45f0]">Sync</p>
                  <p className="mt-1 text-sm text-slate-700">Offline-safe</p>
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
