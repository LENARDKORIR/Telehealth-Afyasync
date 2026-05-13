/**
 * Navbar component
 */

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getInitials } from '../utils/helpers';

interface NavbarProps {
  onMenuToggle: () => void;
}

export const Navbar = ({ onMenuToggle }: NavbarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-rose-950/10 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#8e171b] text-white shadow-sm transition hover:bg-[#741215] md:hidden"
          >
            ☰
          </button>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8e171b] shadow-sm">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-900 sm:text-xl">Afyasync Portal</h1>
            <p className="hidden text-xs text-slate-500 sm:block">Clinical workspace with Tailwind styling</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Welcome</p>
            <p className="font-semibold text-slate-900">{user?.name}</p>
          </div>
          <button
            onClick={() => setIsMenuOpen((current) => !current)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8e171b] font-bold text-white transition hover:bg-[#741215]"
          >
            {getInitials(user?.name || 'User')}
          </button>
        </div>

      </div>

      {isMenuOpen && (
        <div className="absolute right-4 top-16 z-50 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
          <button
            onClick={() => navigate('/settings')}
            className="block w-full rounded-xl px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-100"
          >
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="block w-full rounded-xl px-4 py-3 text-left text-sm text-rose-600 transition hover:bg-rose-50"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};
