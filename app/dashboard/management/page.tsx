'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { RateManagement } from '@/components/RateManagement';

export default function ManagementPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => router.back()}
          className="text-sm font-bold text-foreground underline-offset-4 hover:underline"
        >
          Back
        </button>
      </div>
      <RateManagement />
    </div>
  );
}
