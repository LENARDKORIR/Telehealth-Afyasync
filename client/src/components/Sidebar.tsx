/**
 * Sidebar component
 */

import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NAVIGATION_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'doctor', 'patient'] },
  { path: '/patients', label: 'Patients', icon: '👥', roles: ['admin', 'doctor'] },
  { path: '/appointments', label: 'Appointments', icon: '📅', roles: ['admin', 'doctor', 'patient'] },
  { path: '/messages', label: 'Messages', icon: '💬', roles: ['admin', 'doctor', 'patient'] },
  { path: '/intake', label: 'Intake', icon: '📝', roles: ['admin', 'doctor', 'patient'] },
  { path: '/prescriptions', label: 'Prescriptions', icon: '💊', roles: ['admin', 'doctor', 'patient'] },
  { path: '/records', label: 'Records', icon: 'R', roles: ['admin', 'doctor', 'patient'] },
  { path: '/emergency', label: 'Emergency', icon: '🚨', roles: ['admin', 'doctor', 'patient'] },
  { path: '/reports', label: 'Reports', icon: '📄', roles: ['admin', 'doctor'] },
  { path: '/settings', label: 'Settings', icon: '⚙️', roles: ['admin', 'doctor', 'patient'] },
];

interface SidebarProps {
  isOpen: boolean;
  onNavigate: () => void;
}

export const Sidebar = ({ isOpen, onNavigate }: SidebarProps) => {
  const { user } = useAuth();

  const visibleItems = NAVIGATION_ITEMS.filter(
    (item) => !user || item.roles.includes(user.role)
  );

  return (
    <aside
      className={`${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-72 overflow-y-auto bg-[#8e171b] text-white shadow-2xl transition-transform duration-300 md:static md:top-0 md:h-auto md:w-64 md:translate-x-0 md:shadow-none`}
    >
      <nav className="space-y-2 p-4 sm:p-6">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-rose-50/85 hover:bg-white/10 hover:text-white'
              }`
            }
            onClick={onNavigate}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
