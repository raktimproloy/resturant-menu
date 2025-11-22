import { X, ListOrdered, Truck } from 'lucide-react';
import React, {useMemo} from 'react';

const QueueModal = ({ queue, statusStyles, priorityStyles, onClose, onFinishOrder }) => {
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
                                                <span className={`text-sm font-semibold ${priority.text}`}>
                                                    <priority.icon className="w-4 h-4 inline mr-1" />
                                                    Priority: {order.orderPriority}
                                                </span>
                                            </div>
                                            <div className={`flex items-center font-extrabold text-sm px-3 py-1 rounded-full ${orderStatus.bg} ${orderStatus.text}`}>
                                                <orderStatus.icon className="w-4 h-4 mr-1" />
                                                {orderStatus.label}
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-300 mb-3">
                                            {order.status === 'In Progress' 
                                                ? `Est. Ready in ${order.timeRemaining} seconds...` 
                                                : order.status === 'Pending' ? 'Waiting for preparation start.' : 'Ready now!'}
                                        </p>

                                        <ul className="text-sm text-gray-400 border-t border-gray-700 pt-3 space-y-1">
                                            {order.items.map((item, itemIndex) => (
                                                <li key={itemIndex} className="truncate">
                                                    <span className="font-bold text-gray-200">{item.quantity}x</span> {item.name}
                                                    {item.extras.length > 0 && ` (+${item.extras.length} extras)`}
                                                </li>
                                            ))}
                                        </ul>
                                        
                                        {order.status === 'Ready for Pickup' && (
                                            <button
                                                onClick={() => onFinishOrder(order.orderId)}
                                                className="w-full mt-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition"
                                            >
                                                Mark as Picked Up (${order.total.toFixed(2)})
                                            </button>
                                        )}
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