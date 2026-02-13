'use client';

import React from 'react';
import { ConciergeBell, X, Check } from 'lucide-react';

export default function WaiterCallNotification({ notification, onAccept, onClose }) {
  if (!notification?.tableNumber) return null;

  return (
    <div className="fixed top-16 left-3 right-3 sm:left-auto sm:right-4 z-50 bg-cyan-900/95 text-white p-3 sm:p-4 rounded-xl shadow-2xl max-w-sm border border-cyan-500/40">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-cyan-500/30 flex items-center justify-center shrink-0">
            <ConciergeBell className="w-5 h-5 text-cyan-300" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-base">Waiter requested</h3>
            <p className="text-sm mt-1 text-cyan-100">
              Table <span className="font-semibold text-white">{notification.tableNumber}</span> is calling the waiter.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center -m-2 text-cyan-200 hover:text-white touch-manipulation"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="mt-4 pt-3 border-t border-cyan-500/30 flex flex-col sm:flex-row gap-2 justify-end">
        <button
          type="button"
          onClick={() => onAccept?.(notification)}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold rounded-lg text-sm transition min-h-[44px] touch-manipulation"
        >
          <Check className="w-4 h-4" />
          Accept — Water coming
        </button>
      </div>
    </div>
  );
}
