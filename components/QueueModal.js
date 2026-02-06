import { X, ListOrdered, Truck, Edit } from 'lucide-react';
import React, {useMemo} from 'react';

const QueueModal = ({ queue, statusStyles, priorityStyles, onClose, onFinishOrder, onEditOrder }) => {
    // Sort queue by priority (High: 3, Medium: 2, Low: 1) and then by time added (FIFO)
    const sortedQueue = useMemo(() => {
        const prioritiesOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        return [...queue].sort((a, b) => {
            const priorityDiff = prioritiesOrder[b.orderPriority] - prioritiesOrder[a.orderPriority];
            if (priorityDiff !== 0) return priorityDiff;
            return a.timeAdded - b.timeAdded; // FIFO for same priority
        });
    }, [queue]);

    return (
        <div className="fixed inset-0 z-50 bg-gray-900/95 flex items-end justify-center sm:items-center p-0" onClick={onClose}>
            <div
                className="bg-gray-800 w-full max-w-sm sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl transform transition-all duration-300 ease-in-out"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-5 sm:p-6">
                    <h2 className="text-3xl font-extrabold text-white mb-4 border-b border-gray-700 pb-2 flex items-center justify-between">
                        <span className='flex items-center'>
                            <ListOrdered className="w-7 h-7 mr-2 text-indigo-400" />
                            Active Orders Queue
                        </span>
                        <button onClick={onClose} className="p-2 bg-gray-700 rounded-full hover:bg-gray-600">
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </h2>

                    {sortedQueue.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Truck className="w-12 h-12 mx-auto mb-4" />
                            <p className="text-lg">The kitchen is currently quiet. No orders in queue.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {sortedQueue.map((order, index) => {
                                const orderStatus = statusStyles[order.status];
                                const priority = priorityStyles[order.orderPriority];
                                return (
                                    <div key={order.orderId} className={`p-4 rounded-xl shadow-lg border-l-4 ${orderStatus.bg} ${priority.text}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex flex-col">
                                                <span className="text-xl font-bold text-white">Order #{order.orderId.slice(-4)}</span>
                                            </div>
                                            {(() => {
                                                const StatusIcon = orderStatus?.icon;
                                                return (
                                                    <div className={`flex items-center font-extrabold text-sm px-3 py-1 rounded-full ${orderStatus.bg} ${orderStatus.text}`}>
                                                        {StatusIcon && <StatusIcon className="w-4 h-4 mr-1" />}
                                                        {orderStatus.label}
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <div className="mb-3">
                                            {(() => {
                                                const PriorityIcon = priority?.icon;
                                                return (
                                                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${priority.bg} ${priority.text}`}>
                                                        {PriorityIcon && <PriorityIcon className="w-4 h-4" />}
                                                        Priority: {order.orderPriority}
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <p className="text-sm text-gray-300 mb-3">
                                            {order.status === 'Pending' ? 'Waiting for preparation start.' : order.status === 'In Progress' ? 'Order is being prepared...' : 'Ready now!'}
                                        </p>

                                        <ul className="text-sm text-gray-400 border-t border-gray-700 pt-3 space-y-1">
                                            {order.items.map((item, itemIndex) => {
                                                const itemPriority = item.priority || 'Medium';
                                                const priorityLabel = itemPriority === 'High' ? 'Fast' : 'Normal';
                                                return (
                                                    <li key={itemIndex} className="flex items-center justify-between">
                                                        <span className="flex-1 truncate">
                                                            <span className="font-bold text-gray-200">{item.quantity}x</span> {item.name}
                                                            {item.extras && item.extras.length > 0 && ` (+${item.extras.length} extras)`}
                                                        </span>
                                                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${priorityLabel === 'Fast' ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-400'}`}>
                                                            {priorityLabel}
                                                        </span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                        
                                        <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between items-center">
                                            {order.status === 'Pending' && (
                                                <button
                                                    onClick={() => onEditOrder(order)}
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition text-sm font-bold border border-indigo-500/30"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    Edit Order
                                                </button>
                                            )}
                                            <div className="text-lg font-bold text-green-400 text-right ml-auto">
                                                Total: {Number(order.total).toFixed(2)} BDT
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QueueModal;