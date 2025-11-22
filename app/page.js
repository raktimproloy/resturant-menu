'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { validateTableAccess } from '@/lib/encryption';
import AccessDenied from '@/components/AccessDenied';

const App = dynamic(() => import('../components/App'), { ssr: false });

export default function Home() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Get URL parameters
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const id = params.get('id');
    const table = params.get('table');

    // If no parameters, deny access
    if (!code || !id || !table) {
      setIsAuthorized(false);
      setIsChecking(false);
      return;
    }

    // Validate access
    try {
      const isValid = validateTableAccess(code, id, table);
      setIsAuthorized(isValid);
    } catch (error) {
      console.error('Validation error:', error);
      setIsAuthorized(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-900 text-white font-sans antialiased flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not authorized
  if (!isAuthorized) {
    return <AccessDenied />;
  }

  // Show app if authorized
  return <App />;
}
