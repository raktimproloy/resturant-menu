'use client';

import React from 'react';
import { getStatusIcon, getStatusColor, formatDuration } from './utils';

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function OrderHistoryCard({ order }) {
  return (
    <div className="bg-gray-800 rounded-xl p-3 sm:p-4 lg:p-5 border border-gray-700">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-base sm:text-lg font-bold text-white">Order #{order.id?.slice(-4) ?? '—'}</h3>
            {order.priority && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                {order.priority}
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm">Table {order.tableNumber}</p>
          <p className="text-gray-500 text-xs mt-1">{formatDateTime(order.createdAt)}</p>
          {order.completedAt && (
            <p className="text-green-500/90 text-xs mt-0.5">Completed: {formatDateTime(order.completedAt)}</p>
          )}
          {(order.queueTimeSeconds != null || order.processingTimeSeconds != null) && (
            <div className="text-xs text-gray-400 mt-2 space-y-0.5">
              {order.queueTimeSeconds != null && (
                <p>Queue: {formatDuration(order.queueTimeSeconds)}</p>
              )}
              {order.processingTimeSeconds != null && (
                <p>Processing: {formatDuration(order.processingTimeSeconds)}</p>
              )}
            </div>
          )}
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full shrink-0 ${getStatusColor(order.status)}`}>
          {getStatusIcon(order.status)}
          <span className="text-xs sm:text-sm font-medium capitalize">{order.status}</span>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-3">
        <p className="text-sm text-gray-400 mb-2">Items:</p>
        <ul className="space-y-1.5">
          {order.items?.map((item, index) => (
            <li key={index} className="text-gray-300 text-sm">
              <div className="flex justify-between gap-2 flex-wrap">
                <span>{item.quantity}x {item.name}</span>
                <span className="text-green-400 font-medium">{(item.finalPrice ?? item.price) * item.quantity} ৳</span>
              </div>
              {item.extras?.length > 0 && (
                <ul className="ml-4 mt-0.5 text-xs text-gray-400 space-y-0.5">
                  {item.extras.map((e, ei) => (
                    <li key={ei}>+ {e.qty ?? 1}x {e.name} — {Number(e.price) * (e.qty ?? 1)} ৳</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-700">
          <span className="text-gray-400 text-sm">Total</span>
          <span className="text-lg font-bold text-green-400">{Number(order.total)} ৳</span>
        </div>
      </div>
    </div>
  );
}
