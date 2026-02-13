import React from 'react';
import { Bell, X, VolumeX } from 'lucide-react';
import { priorityStyles } from './utils';

export default function OrderNotification({ notification, onClose, onMute }) {
  if (!notification) return null;

  return (
    <div className="fixed top-16 left-3 right-3 sm:left-auto sm:right-4 z-50 bg-indigo-600 text-white p-3 sm:p-4 rounded-xl shadow-2xl max-w-sm animate-slide-in">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 sm:gap-3 min-w-0">
          <Bell className="w-5 h-5 sm:w-6 sm:h-6 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <h3 className="font-bold text-base sm:text-lg">New Order!</h3>
            <p className="text-xs sm:text-sm mt-1 break-words">
              Table {notification.tableNumber} - Order #{notification.id?.slice(-4) ?? '—'}
              {notification.priority && (
                <span className={`ml-1 sm:ml-2 px-2 py-0.5 rounded text-xs ${priorityStyles[notification.priority]?.bg || 'bg-gray-700'} ${priorityStyles[notification.priority]?.text || 'text-gray-300'}`}>
                  {notification.priority}
                </span>
              )}
            </p>
            <p className="text-xs mt-1 opacity-90">
              Total: {Number(notification.total)} ৳
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center -m-2 text-white hover:text-gray-200 touch-manipulation"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="mt-3 pt-3 border-t border-indigo-500/30 flex justify-end">
        <button
          onClick={() => onMute?.(notification.id)}
          className="flex items-center gap-2 px-4 py-3 sm:py-2 bg-indigo-700 hover:bg-indigo-800 rounded-lg text-xs font-semibold transition min-h-[44px] sm:min-h-0 touch-manipulation"
        >
          <VolumeX className="w-3.5 h-3.5" />
          Stop Sound
        </button>
      </div>
    </div>
  );
}
