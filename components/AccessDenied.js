import React from 'react';
import { XCircle, Utensils } from 'lucide-react';

const AccessDenied = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans antialiased flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 shadow-2xl text-center">
        <div className="mb-6 flex justify-center">
          <div className="bg-red-900/40 p-4 rounded-full">
            <XCircle className="w-12 h-12 text-red-400" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-3">
          Access Denied
        </h1>
        
        <p className="text-gray-400 mb-6">
          Menu does not exist for you.
        </p>
        
        <div className="flex justify-center mb-6">
          <Utensils className="w-16 h-16 text-gray-700" />
        </div>
        
        <p className="text-sm text-gray-500">
          Please scan a valid QR code to access the menu.
        </p>
      </div>
    </div>
  );
};

export default AccessDenied;

