import { Trash2, X } from 'lucide-react';
import React from 'react';

const priorityChoices = ['Normal', 'Fast'];

const toLabel = (priority) => (priority === 'High' ? 'Fast' : 'Normal');

const OrderConfirmationModal = ({
    cart,
    total,
    priorityStyles,
    onRemoveItem,
    onUpdateItemQuantity,
    onUpdateItemPriority,
    onClose,
    onConfirm,
}) => {
    const isCartEmpty = cart.length === 0;

    const handlePriorityChange = (cartId, label) => {
        onUpdateItemPriority(cartId, label);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4" onClick={onClose}>
            <div
                className="bg-gray-900 w-full max-w-md rounded-2xl p-5 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">Review your order</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {isCartEmpty ? (
                        <div className="text-center text-gray-400 py-12 border border-dashed border-gray-700 rounded-xl">
                            Cart is empty. Add dishes to continue.
                        </div>
                    ) : (
                        cart.map((item, index) => {
                            const itemTotal = item.totalPrice ?? (item.price * (item.quantity || 1));
                            const label = toLabel(item.priority);
                            const priorityStyle = priorityStyles[item.priority || 'Medium'];

                            return (
                                <div key={item.cartId || `${item.id}-${index}`} className="bg-gray-800 rounded-xl p-4 space-y-2">
                                    <div className="flex items-start justify-between">
                                        <p className="text-white font-semibold">
                                            {item.quantity} x {item.name}{' '}
                                            {/* <span className={`text-xs uppercase ml-1 ${priorityStyle.text}`}>
                                                ({label})
                                            </span> */}
                                        </p>
                                        <span className="text-green-400 font-semibold">
                                            {itemTotal.toFixed(2)} BDT
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-2 text-sm">
                                            {priorityChoices.map(choice => (
                                                <button
                                                    key={choice}
                                                    onClick={() => handlePriorityChange(item.cartId, choice)}
                                                    className={`px-3 py-1 rounded-full border text-xs ${
                                                        choice === label
                                                            ? 'border-indigo-400 text-indigo-200'
                                                            : 'border-gray-700 text-gray-400'
                                                    }`}
                                                >
                                                    {choice}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <button
                                                onClick={() => onUpdateItemQuantity(item.cartId, -1)}
                                                className="px-3 py-1 rounded-full border border-gray-700 text-gray-300 hover:text-white"
                                                aria-label={`Decrease quantity for ${item.name}`}
                                            >
                                                –
                                            </button>
                                            <span className="text-white font-semibold">{item.quantity}</span>
                                            <button
                                                onClick={() => onUpdateItemQuantity(item.cartId, 1)}
                                                className="px-3 py-1 rounded-full border border-gray-700 text-gray-300 hover:text-white"
                                                aria-label={`Increase quantity for ${item.name}`}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    {item.extras?.length > 0 && (
                                        <ul className="text-xs text-gray-400 space-y-1">
                                            {item.extras.map(extra => (
                                                <li key={extra.id || extra.name}>
                                                    {extra.qty}x {extra.name} (+{(extra.price * extra.qty).toFixed(2)} BDT)
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    <button
                                        onClick={() => onRemoveItem(item.cartId)}
                                        className="text-xs text-red-300 hover:text-red-200 inline-flex items-center gap-1"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Remove
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="flex items-center justify-between text-lg font-bold text-white mt-4">
                    <span>Total</span>
                    <span className="text-green-400">{total.toFixed(2)} BDT</span>
                </div>

                <div className="flex gap-3 mt-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 rounded-xl border border-gray-700 text-gray-200 hover:bg-gray-800"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => !isCartEmpty && onConfirm()}
                        disabled={isCartEmpty}
                        className={`flex-1 py-2 rounded-xl font-semibold ${
                            isCartEmpty
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-500'
                        }`}
                    >
                        Place Order
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmationModal;