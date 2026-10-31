// src/components/sidebar/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, ShieldAlert, AlertTriangle } from 'lucide-react';

export const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Staff Meetings', path: '/meetings', icon: CalendarDays },
    { name: 'Incidents Log', path: '/incidents', icon: ShieldAlert },
    { name: 'Risk Register', path: '/risks', icon: AlertTriangle },
  ];

  return (
    <aside className="w-64 border-r border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#09090b] flex flex-col gap-1.5 h-[calc(100vh-64px)] sticky top-16 overflow-y-auto">
      <div className="mb-4">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Main Navigation
        </p>
      </div>
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-850 dark:hover:text-zinc-100'
                }`
              }
            >
              <Icon className="h-4.5 w-4.5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
      
      {/* Footer Info */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 mt-auto">
        <div className="rounded-lg bg-zinc-50 p-3.5 dark:bg-[#0c0c0f]">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider dark:text-zinc-500">
            Clinical Governance
          </p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
            Complies with hospital quality standard ISO 9001 & NHIS Guidelines.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
