'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BlockedPage() {
  const router = useRouter();

  useEffect(() => {
    const checkUnblocked = async () => {
      try {
        const res = await fetch('/api/block/me', { cache: 'no-store' });
        const data = await res.json();
        if (!data.blocked) {
          router.refresh(); // Re-fetch current page, URL and params stay the same
        }
      } catch {
        // Ignore errors, will retry
      }
    };

    checkUnblocked();
    const interval = setInterval(checkUnblocked, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl border border-red-900/50 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Access Temporarily Blocked</h1>
        <p className="text-gray-400 text-sm">
          Your access has been restricted for 10 minutes. Please try again later.
        </p>
        <p className="text-gray-500 text-xs mt-3">Checking for updates...</p>
      </div>
    </div>
  );
}
