'use client';

import React from 'react';
import { X, Bell, ConciergeBell, Package, CheckCircle } from 'lucide-react';

const typeConfig = {
  call_waiter: { icon: ConciergeBell, label: 'Call for waiter', color: 'text-cyan-400' },
  water_coming: { icon: CheckCircle, label: 'Water on the way', color: 'text-green-400' },
  order_placed: { icon: Package, label: 'Order placed', color: 'text-indigo-400' },
  order_update: { icon: Package, label: 'Order update', color: 'text-amber-400' },
};

function formatTime(iso) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  } catch {
    return '';
  }
}

export default function NotificationPanel({ notifications = [], onClose, isOpen }) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="fixed top-14 right-0 bottom-0 w-full max-w-sm bg-gray-800 border-l border-gray-700 shadow-2xl z-50 flex flex-col rounded-tl-xl">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            Notifications
          </h2>
          <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No notifications yet.</p>
          ) : (
            <ul className="space-y-2">
              {[...notifications].reverse().map((n) => {
                const config = typeConfig[n.type] || { icon: Bell, label: n.type, color: 'text-gray-400' };
                const Icon = config.icon;
                return (
                  <li key={n.id} className="p-3 rounded-xl bg-gray-700/50 border border-gray-600/50">
                    <div className="flex gap-3">
                      <div className={`shrink-0 w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center ${config.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">{config.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{n.body}</p>
                        {n.time && <p className="text-xs text-gray-500 mt-1">{formatTime(n.time)}</p>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
