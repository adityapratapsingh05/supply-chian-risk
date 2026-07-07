'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface User { name: string; email: string; role: string; }

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => { if (d.success) setUser(d.data); })
      .catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  if (!user) return null;

  const initials = user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-150 hover:bg-slate-800"
      >
        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', color: 'white' }}
        >
          {initials}
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-xs font-semibold text-white leading-none">{user.name.split(' ')[0]}</div>
          <div
            className="text-[9px] uppercase tracking-wider leading-none mt-0.5 font-medium"
            style={{ color: user.role === 'admin' ? '#f97316' : '#64748b' }}
          >
            {user.role}
          </div>
        </div>
        <svg
          className={`w-3 h-3 text-slate-500 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden z-50 animate-fade-in"
          style={{
            background: '#0f172a',
            border: '1px solid #1e293b',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          {/* User info */}
          <div className="px-4 py-3" style={{ borderBottom: '1px solid #1e293b' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', color: 'white' }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{user.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
              </div>
            </div>
            <div className="mt-2">
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{
                  background: user.role === 'admin' ? 'rgba(249,115,22,0.15)' : 'rgba(100,116,139,0.15)',
                  color: user.role === 'admin' ? '#f97316' : '#94a3b8',
                  border: `1px solid ${user.role === 'admin' ? 'rgba(249,115,22,0.3)' : 'rgba(100,116,139,0.2)'}`,
                }}
              >
                {user.role}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="p-1.5">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 disabled:opacity-50"
              style={{ color: '#ef4444' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {isLoggingOut ? (
                <div className="w-4 h-4 rounded-full border border-red-500/30 border-t-red-400 animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              )}
              {isLoggingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
