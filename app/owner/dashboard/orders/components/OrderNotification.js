import React from 'react';
import { Bell, X, VolumeX } from 'lucide-react';
import { priorityStyles } from './utils';

export default function OrderNotification({ notification, onClose, onMute }) {
  if (!notification) return null;

  return (
    <div className="fixed top-4 left-4 right-4 lg:left-auto lg:right-4 z-50 bg-indigo-600 text-white p-3 lg:p-4 rounded-xl shadow-2xl max-w-sm lg:max-w-sm animate-slide-in">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 lg:gap-3">
          <Bell className="w-5 h-5 lg:w-6 lg:h-6 mt-1 flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="font-bold text-base lg:text-lg">New Order!</h3>
            <p className="text-xs lg:text-sm mt-1 break-words">
              Table {notification.tableNumber} - Order #{notification.id.slice(-4)}
              {notification.priority && (
                <span className={`ml-2 px-2 py-0.5 rounded text-xs ${priorityStyles[notification.priority]?.bg || 'bg-gray-700'} ${priorityStyles[notification.priority]?.text || 'text-gray-300'}`}>
                  {notification.priority}
                </span>
              )}
            </p>
            <p className="text-xs mt-1 opacity-90">
              Total: {Number(notification.total).toFixed(2)} BDT
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
            <button
            onClick={onClose}
            className="text-white hover:text-gray-200 flex-shrink-0 self-end"
            >
            <X className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
        </div>
      </div>
      
      {/* Stop Notification Button */}
      <div className="mt-3 pt-3 border-t border-indigo-500/30 flex justify-end">
        <button 
            onClick={() => onMute && onMute(notification.id)}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 rounded-lg text-xs font-semibold transition"
        >
            <VolumeX className="w-3 h-3" />
            Stop Sound
        </button>
      </div>
    </div>
  );
}
