'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Edit2, Clock, Printer } from 'lucide-react';
import EditOrderForm from './EditOrderForm';
import ClientInfoPanel from './ClientInfoPanel';
import { priorityStyles, getStatusIcon, getStatusColor, formatTime, formatElapsedTimer, formatDuration } from './utils';

export default function OrderCard({
  order,
  isEditing,
  editFormData,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onAddItemClick,
  onUpdateItemQuantity,
  onRemoveItem,
  onUpdatePrice,
  onAccept,
  onCancel,
  onStatusChange,
  onDone,
  onPrint,
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  // Time in queue = since createdAt; time in progress = since acceptedAt (stored when status changed)
  const baseMs = (order.status === 'accepted' || order.status === 'processing') && order.acceptedAt
    ? new Date(order.acceptedAt).getTime()
    : order.createdAt ? new Date(order.createdAt).getTime() : 0;
  const elapsedSec = baseMs ? (now - baseMs) / 1000 : 0;
  const showTimer = order.status === 'pending' || order.status === 'accepted' || order.status === 'processing';
  const timerLabel = order.status === 'pending' ? 'in queue' : 'in progress';

  return (
    <div className="bg-gray-800 rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-700 hover:border-gray-600 transition">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3 lg:mb-4">
        <div className="flex-1 min-w-0 w-full">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white truncate">Order #{order.id.slice(-4)}</h3>
            {order.priority && (() => {
              const priorityStyle = priorityStyles[order.priority];
              const PriorityIcon = priorityStyle?.icon;
              return (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${priorityStyle?.bg || 'bg-gray-700'} ${priorityStyle?.text || 'text-gray-300'}`}>
                  {PriorityIcon && <PriorityIcon className="w-3 h-3" />}
                  {order.priority}
                </div>
              );
            })()}
          </div>
          <p className="text-gray-400 text-sm lg:text-base">Table: {order.tableNumber}</p>
          <p className="text-gray-500 text-xs lg:text-sm mt-1">
            {formatTime(order.createdAt)}
          </p>
          {showTimer && (
            <p className="text-cyan-400 text-xs lg:text-sm mt-1 flex items-center gap-1.5 font-medium tabular-nums">
              <Clock className="w-3.5 h-3.5" />
              {formatElapsedTimer(elapsedSec)} {timerLabel}
            </p>
          )}
          {order.status === 'completed' && (order.queueTimeSeconds != null || order.processingTimeSeconds != null) && (
            <div className="text-xs text-gray-400 mt-2 space-y-0.5">
              {order.queueTimeSeconds != null && (
                <p>Queue: {formatDuration(order.queueTimeSeconds)}</p>
              )}
              {order.processingTimeSeconds != null && (
                <p>Processing: {formatDuration(order.processingTimeSeconds)}</p>
              )}
            </div>
          )}
          <ClientInfoPanel deviceInfo={order.deviceInfo} onBlock />
        </div>
        <div className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full shrink-0 ${getStatusColor(order.status)}`}>
          {getStatusIcon(order.status)}
          <span className="text-xs sm:text-sm font-medium capitalize">{order.status}</span>
        </div>
      </div>

      {isEditing ? (
        <EditOrderForm
          editFormData={editFormData}
          onUpdateItemQuantity={onUpdateItemQuantity}
          onRemoveItem={onRemoveItem}
          onUpdatePrice={onUpdatePrice}
          onCancel={onCancelEdit}
          onSave={onSaveEdit}
          onAddItemClick={onAddItemClick}
        />
      ) : (
        <>
          <div className="mb-4">
            {order.hasLaterOrderItems && (
              <div className="mb-3 p-2 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
                <p className="text-xs text-yellow-400 font-semibold flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                  This order contains items from later orders
                </p>
              </div>
            )}
            <p className="text-sm text-gray-400 mb-2">Items:</p>
            <ul className="space-y-2">
              {order.items.map((item, index) => {
                const itemPriority = item.priority || 'Medium';
                const priorityLabel = itemPriority === 'High' ? 'Fast' : 'Normal';
                const isLaterOrder = item.isLaterOrder;
                return (
                  <li key={index} className={`text-gray-300 ${isLaterOrder ? 'bg-yellow-900/20 px-2 py-1.5 rounded' : ''}`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-medium">
                        • {item.quantity}x {item.name} — {Number(item.finalPrice || item.price)} ৳
                      </span>
                      {isLaterOrder && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-600/30 text-yellow-400 font-medium">
                          Later Order
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${priorityLabel === 'Fast' ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-400'}`}>
                        {priorityLabel}
                      </span>
                    </div>
                    {item.extras && item.extras.length > 0 && (
                      <ul className="mt-1 ml-3 pl-2 border-l-2 border-cyan-500/40 space-y-0.5">
                        {item.extras.map((e, ei) => (
                          <li key={ei} className="text-xs text-gray-400 flex justify-between gap-2">
                            <span>{e.qty ? `${e.qty}× ` : ''}{e.name}</span>
                            {e.price != null && <span className="text-cyan-400/90 tabular-nums">+{Number(e.price) * (e.qty || 1)} ৳</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center pt-3 lg:pt-4 border-t border-gray-700 gap-3">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400">
              {Number(order.total)} ৳
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto">
              {order.status === 'pending' && (
                <>
                  <button
                    onClick={() => onPrint(order)}
                    className="flex-1 min-h-[44px] sm:min-h-0 px-3 lg:px-4 py-3 sm:py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg flex items-center justify-center gap-2 text-sm lg:text-base touch-manipulation"
                  >
                    <Printer className="w-4 h-4 shrink-0" />
                    <span>Print</span>
                  </button>
                  <button
                    onClick={() => onEdit(order)}
                    className="flex-1 min-h-[44px] sm:min-h-0 px-3 lg:px-4 py-3 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center justify-center gap-2 text-sm lg:text-base touch-manipulation"
                  >
                    <Edit2 className="w-4 h-4 shrink-0" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => onAccept(order.id)}
                    className="flex-1 min-h-[44px] sm:min-h-0 px-3 lg:px-4 py-3 sm:py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm lg:text-base touch-manipulation"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onCancel(order.id)}
                    className="flex-1 min-h-[44px] sm:min-h-0 px-3 lg:px-4 py-3 sm:py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm lg:text-base touch-manipulation"
                  >
                    Cancel
                  </button>
                </>
              )}
              {(order.status === 'accepted' || order.status === 'processing') && (
                <>
                  <button
                    onClick={() => onPrint(order)}
                    className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-3 lg:px-4 py-3 sm:py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg flex items-center justify-center gap-2 text-sm lg:text-base touch-manipulation"
                  >
                    <Printer className="w-4 h-4 shrink-0" />
                    <span>Print</span>
                  </button>
                  <button
                    onClick={() => onStatusChange(order.id, 'completed')}
                    className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-3 lg:px-4 py-3 sm:py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm lg:text-base touch-manipulation"
                  >
                    Completed
                  </button>
                </>
              )}
              {order.status === 'completed' && (
                <button
                  onClick={() => onDone(order.id)}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-3 lg:px-4 py-3 sm:py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm lg:text-base touch-manipulation"
                >
                  Done (Table Empty)
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
