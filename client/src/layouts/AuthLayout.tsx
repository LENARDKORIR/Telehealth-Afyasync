/**
 * Auth layout
 */

import { OfflineBanner } from '../components/OfflineBanner';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-[#faf4f0] text-slate-900">
      <div className="relative overflow-hidden">
        <OfflineBanner />
        <div className="absolute inset-x-0 top-0 h-56 bg-[#8e171b]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(190,18,60,0.12),_transparent_26%)]" />
        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid w-full items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="hidden lg:block">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-900">
                Secure Telehealth Portal
              </p>
              <h1 className="mt-4 max-w-xl text-5xl font-black tracking-tight text-slate-900 xl:text-6xl">
                A cleaner clinical workspace for patients and care teams.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-800">
                The sign-in experience now matches the refreshed landing page with a warm,
                medical-themed Tailwind composition.
              </p>
            </div>

            <div className="mx-auto w-full max-w-md">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
