import { X, ListOrdered, Package, Edit, Clock } from 'lucide-react';
import React, { useMemo, useState, useEffect } from 'react';
import BaseModal from './BaseModal';

function formatElapsed(seconds) {
    const sec = Math.max(0, Math.floor(seconds));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

const QueueModal = ({ queue, statusStyles, priorityStyles, onClose, onFinishOrder, onEditOrder }) => {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const sortedQueue = useMemo(() => {
        const prioritiesOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        return [...queue].sort((a, b) => {
            const priorityDiff = prioritiesOrder[b.orderPriority] - prioritiesOrder[a.orderPriority];
            if (priorityDiff !== 0) return priorityDiff;
            return a.timeAdded - b.timeAdded;
        });
    }, [queue]);

    // Time in queue = since timeAdded; time in progress = since acceptedAt (stored when status changed)
    const getElapsedSec = (order) => {
        const base = order.status === 'In Progress' && order.acceptedAt ? order.acceptedAt : order.timeAdded;
        return (now - base) / 1000;
    };

    return (
        <BaseModal isOpen onClose={onClose} maxWidth="xl" slideFromBottom>
            <div className="flex flex-col min-h-0 max-h-[92vh] sm:max-h-[90vh]">
                {/* Header */}
                <div className="shrink-0 px-4 sm:px-6 py-4 border-b border-gray-700/80">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                                <ListOrdered className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-lg sm:text-xl font-bold text-white truncate">Order queue</h2>
                                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                                    {sortedQueue.length === 0 ? 'No orders' : `${sortedQueue.length} order${sortedQueue.length === 1 ? '' : 's'} in queue`}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 rounded-xl bg-gray-700/80 text-gray-400 hover:text-white hover:bg-gray-700 transition shrink-0"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
                    {sortedQueue.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gray-700/80 flex items-center justify-center mb-4">
                                <Package className="w-8 h-8 text-gray-500" />
                            </div>
                            <p className="text-gray-400 font-medium text-lg">No orders in queue</p>
                            <p className="text-gray-500 text-sm mt-1 max-w-xs">When you place an order, it will appear here.</p>
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {sortedQueue.map((order) => {
                                const orderStatus = statusStyles[order.status];
                                // Fast/Normal service commented out: const priority = priorityStyles[order.orderPriority];
                                const StatusIcon = orderStatus?.icon;
                                // const PriorityIcon = priority?.icon;
                                const shortId = order.orderId?.slice(-6) || '—';

                                return (
                                    <li key={order.orderId}>
                                        <article className="rounded-2xl border border-gray-700/80 bg-gray-800/60 overflow-hidden shadow-lg">
                                            {/* Card header */}
                                            <div className="px-4 sm:px-5 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-700/50">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="text-white font-bold text-base sm:text-lg tabular-nums">#{shortId}</span>
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${orderStatus.bg} ${orderStatus.text}`}>
                                                        {StatusIcon && <StatusIcon className="w-3.5 h-3.5" />}
                                                        {orderStatus.label}
                                                    </span>
                                                    {/* Fast/Normal service commented out
                                                    <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${priority.bg} ${priority.text}`}>
                                                        {PriorityIcon && <PriorityIcon className="w-3 h-3" />}
                                                        {order.orderPriority}
                                                    </span>
                                                    */}
                                                </div>
                                                {order.status === 'Pending' && onEditOrder && (
                                                    <button
                                                        onClick={() => onEditOrder(order)}
                                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 text-sm font-medium border border-indigo-500/30 transition"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                        Edit
                                                    </button>
                                                )}
                                            </div>

                                            {/* Status message + elapsed time in queue/processing (real-time, no reset on load) */}
                                            <div className="px-4 sm:px-5 py-2 bg-gray-800/40 border-b border-gray-700/40 flex items-center justify-between gap-2 flex-wrap">
                                                <p className="text-sm text-gray-400">
                                                    {order.status === 'Pending' && 'Waiting for kitchen to start.'}
                                                    {order.status === 'In Progress' && 'Being prepared.'}
                                                    {order.status === 'Ready for Pickup' && 'Ready for pickup.'}
                                                </p>
                                                <div className="flex items-center gap-1.5 text-cyan-400 text-sm font-medium tabular-nums">
                                                    <Clock className="w-4 h-4" />
                                                    {order.status === 'Pending' && (
                                                        <span>{formatElapsed(getElapsedSec(order))} in queue</span>
                                                    )}
                                                    {order.status === 'In Progress' && (
                                                        <span>{formatElapsed(getElapsedSec(order))} in progress</span>
                                                    )}
                                                    {order.status === 'Ready for Pickup' && (
                                                        <span>Ready</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Items list with extras detail */}
                                            <div className="px-4 sm:px-5 py-3 sm:py-4">
                                                <ul className="space-y-3">
                                                    {order.items?.map((item, idx) => (
                                                        <li key={idx} className="text-sm">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <span className="text-gray-200">
                                                                    <span className="font-semibold text-gray-100 tabular-nums mr-1">{item.quantity}×</span>
                                                                    {item.name}
                                                                </span>
                                                            </div>
                                                            {item.extras?.length > 0 && (
                                                                <ul className="mt-1.5 pl-4 border-l-2 border-cyan-500/40 space-y-0.5">
                                                                    {item.extras.map((e, ei) => (
                                                                        <li key={ei} className="text-xs text-gray-400 flex justify-between gap-2">
                                                                            <span>{e.qty ? `${e.qty}× ` : ''}{e.name}</span>
                                                                            {e.price != null && <span className="text-cyan-400/90 tabular-nums shrink-0">+{Number(e.price) * (e.qty || 1)} ৳</span>}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Footer: total */}
                                            <div className="px-4 sm:px-5 py-3 sm:py-4 bg-gray-800/60 border-t border-gray-700/50 flex items-center justify-between">
                                                <span className="text-sm text-gray-400">Total</span>
                                                <span className="text-lg font-bold text-green-400 tabular-nums">{Number(order.total)} ৳</span>
                                            </div>
                                        </article>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </BaseModal>
    );
};

export default QueueModal;
