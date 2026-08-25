



'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import CryptoTable from '@/components/CryptoTable';
import { RateEngine } from '@/components/RateEngine';

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeView, setActiveView] = useState<'crypto' | 'rates'>('rates');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Tabs */}
      <div className="sticky top-0 bg-card border-b border-border shadow-card z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveView('rates')}
              className={`px-4 py-4 font-medium border-b-2 transition-colors ${
                activeView === 'rates'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`} 
            >
              FX Rate Engine
            </button>
            <button
              onClick={() => setActiveView('crypto')}
              className={`px-4 py-4 font-medium border-b-2 transition-colors ${
                activeView === 'crypto'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Crypto Prices
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {activeView === 'rates' ? <RateEngine /> : <CryptoTable />}
      </div>
    </div>
  );
}
