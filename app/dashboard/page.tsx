



'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import CryptoTable from '@/components/CryptoTable';
import { RateEngine } from '@/components/RateEngine';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeView, setActiveView] = useState<'crypto' | 'rates'>('rates');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const view = new URLSearchParams(window.location.search).get('view');
    setActiveView(view === 'crypto' ? 'crypto' : 'rates');
  }, []);

  const setView = (view: 'crypto' | 'rates') => {
    setActiveView(view);
    const href = view === 'crypto' ? '/dashboard?view=crypto' : '/dashboard';
    window.history.replaceState(null, '', href);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="fx-page min-h-[calc(100vh-8rem)]">
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-lg border border-border bg-white/50 p-1 lg:hidden">
        {(['rates', 'crypto'] as const).map((view) => (
          <button
            key={view}
            onClick={() => setView(view)}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-bold uppercase tracking-[0.08em] transition',
              activeView === view
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-secondary'
            )}
          >
            {view === 'rates' ? 'FX Rate' : 'Crypto'}
          </button>
        ))}
      </div>

      <div>
        {activeView === 'rates' ? <RateEngine /> : <CryptoTable />}
      </div>
    </div>
  );
}
