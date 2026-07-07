'use client';

export function LoadingSpinner({ size = 'md', label }: { size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeMap[size]} relative`}>
        <div
          className={`${sizeMap[size]} rounded-full border-2 border-slate-700 border-t-sky-400 animate-spin`}
        />
        <div
          className={`absolute inset-1 rounded-full border-2 border-transparent border-b-sky-600 animate-spin`}
          style={{ animationDirection: 'reverse', animationDuration: '0.6s' }}
        />
      </div>
      {label && <p className="text-xs text-slate-400 animate-pulse">{label}</p>}
    </div>
  );
}

export function FullPageLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: '#080f1a' }}>
      <div className="mb-6 relative">
        <div className="w-16 h-16 rounded-full border-2 border-slate-700 border-t-sky-400 animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-violet-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
      </div>
      <div className="text-xl font-bold bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent mb-2">
        Supply Chain Monitor
      </div>
      {label && <p className="text-sm text-slate-500">{label}</p>}
    </div>
  );
}

export function InlineLoader({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-400">
      <div className="w-4 h-4 rounded-full border border-slate-600 border-t-sky-400 animate-spin" />
      {label && <span className="text-xs">{label}</span>}
    </div>
  );
}
