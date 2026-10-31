// src/components/navbar/Navbar.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sun, Moon, Activity, ChevronDown } from 'lucide-react';

export const Navbar = () => {
  const { currentUser, users, switchUser } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-[#09090b]/95">
      <div className="flex h-16 items-center justify-between px-6">
        
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white dark:bg-teal-500 shadow-md shadow-teal-500/20">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Isalu Hospital
            </span>
            <span className="ml-1.5 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-800 dark:bg-teal-950/30 dark:text-teal-400">
              Clinical Governance
            </span>
          </div>
        </div>

        {/* Right Side: Quick Tools & Role Switcher */}
        <div className="flex items-center gap-4">
          
          {/* Light/Dark Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>

          {/* User Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 px-3 text-left transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-[#0c0c0f] dark:hover:bg-zinc-800"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {currentUser?.avatar || '?'}
              </div>
              <div className="hidden text-xs md:block">
                <p className="font-semibold text-zinc-900 dark:text-zinc-50 leading-none mb-0.5">
                  {currentUser?.name}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-none">
                  {currentUser?.role}
                </p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
            </button>

            {showUserDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setShowUserDropdown(false)} 
                />
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-200 bg-white py-1.5 shadow-lg dark:border-zinc-800 dark:bg-[#0c0c0f] z-40">
                  <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
                      Switch Active Role
                    </p>
                  </div>
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUser(u.id);
                        setShowUserDropdown(false);
                      }}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                        currentUser?.id === u.id 
                          ? 'bg-teal-50/50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400 font-medium' 
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {u.avatar}
                      </div>
                      <div>
                        <p className="font-semibold leading-none mb-0.5">{u.name}</p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-none">{u.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;