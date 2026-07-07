import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { UserMenu } from '@/components/ui/UserMenu';

export const metadata: Metadata = {
  title: 'Supply Chain Risk Monitor | AI-Powered Disruption Intelligence',
  description: 'Real-time supply chain risk monitoring, AI-powered scoring, and executive briefing generation for global operations teams.',
  keywords: 'supply chain, risk monitoring, AI, disruption analysis, logistics intelligence',
  openGraph: {
    title: 'Supply Chain Risk Monitor',
    description: 'Real-time AI-powered supply chain risk visualization and mitigation',
    type: 'website',
  },
};

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: '⬡' },
  { href: '/simulation', label: 'Simulation', icon: '⚡' },
  { href: '/briefing', label: 'Briefing', icon: '📋' },
  { href: '/admin', label: 'Admin', icon: '⚙' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⬡</text></svg>" />
      </head>
      <body className="min-h-screen" style={{ background: '#080f1a' }}>
        {/* Ambient background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
            style={{ background: 'radial-gradient(circle, #0ea5e9, transparent)' }}
          />
          <div
            className="absolute top-1/3 -right-40 w-80 h-80 rounded-full opacity-8 blur-3xl"
            style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }}
          />
          <div
            className="absolute bottom-0 left-1/3 w-96 h-64 rounded-full opacity-5 blur-3xl"
            style={{ background: 'radial-gradient(circle, #ef4444, transparent)' }}
          />
        </div>

        {/* Nav */}
        <nav
          className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-6"
          style={{
            background: 'rgba(8,15,26,0.95)',
            borderBottom: '1px solid rgba(51,65,85,0.6)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-center gap-3 mr-8">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)' }}
            >
              ⬡
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-none">Supply Chain</div>
              <div className="text-[10px] text-slate-500 leading-none mt-0.5">Risk Monitor</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <span className="text-[11px]">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-slate-500">Live</span>
            </div>
            <div
              className="text-[10px] px-2 py-1 rounded-lg text-slate-400"
              style={{ background: '#1e293b', border: '1px solid #334155' }}
            >
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div style={{ borderLeft: '1px solid #1e293b', paddingLeft: '12px' }}>
              <UserMenu />
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="pt-14 relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
