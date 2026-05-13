/**
 * Dashboard layout
 */

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { OfflineBanner } from '../components/OfflineBanner';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar
        onMenuToggle={() => setSidebarOpen((current) => !current)}
      />
      <OfflineBanner />
      <div className="relative flex min-h-[calc(100vh-4rem)]">
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-[2px] md:hidden"
          />
        )}

        <Sidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
};
