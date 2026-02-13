import { Trash2, X } from 'lucide-react';
import React from 'react';
import BaseModal from './BaseModal';

// Fast/Normal service commented out for now
// const priorityChoices = ['Normal', 'Fast'];
// const toLabel = (priority) => (priority === 'High' ? 'Fast' : 'Normal');

const OrderConfirmationModal = ({
    cart,
    total,
    priorityStyles,
    menuItems = [],
    extraItems = [],
    onRemoveItem,
    onUpdateItemQuantity,
    onUpdateItemPriority,
    onAddExtraToCartItem,
    onUpdateExtraQuantity,
    onClose,
    onConfirm,
    tableNumber,
}) => {
    const isCartEmpty = cart.length === 0;

    const handlePriorityChange = (cartId, label) => {
        onUpdateItemPriority(cartId, label);
    };

    const getRelevantExtrasForItem = (item) => {
        if (item.isExtra) return [];
        const menuItem = menuItems.find(m => m.id === item.id);
        const ids = menuItem?.extraItemIds || [];
        return ids.map(id => extraItems.find(e => e.id === id)).filter(Boolean);
    };

    return (
        <BaseModal isOpen onClose={onClose} maxWidth="md" slideFromBottom>
            <div className="p-4 sm:p-6 flex flex-col min-h-0 max-h-[92vh] sm:max-h-[90vh]">
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <h2 className="text-lg sm:text-xl font-semibold text-white">Review your order</h2>
                    <button onClick={onClose} className="p-2 -m-2 text-gray-400 hover:text-white rounded-lg transition" aria-label="Close">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1 max-h-[50vh] sm:max-h-80">
                    {isCartEmpty ? (
                        <div className="text-center text-gray-400 py-12 border border-dashed border-gray-700 rounded-xl">
                            Cart is empty. Add dishes to continue.
                        </div>
                    ) : (
                        cart.map((item, index) => {
                            const itemTotal = item.totalPrice ?? (item.price * (item.quantity || 1));
                            // const label = toLabel(item.priority);
                            const hasExtras = item.extras?.length > 0;

                            return (
                                <div key={item.cartId || `${item.id}-${index}`} className="rounded-xl border border-gray-600/50 overflow-hidden bg-gray-700/50">
                                    {/* Main item row */}
                                    <div className="p-3 sm:p-4">
                                        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                                            <div className="min-w-0">
                                                <p className="text-white font-semibold text-sm sm:text-base">
                                                    <span className="tabular-nums">{item.quantity}×</span> {item.name}
                                                </p>
                                                {/* Fast/Normal service commented out
                                                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${label === 'Fast' ? 'bg-red-500/20 text-red-400' : 'bg-gray-600 text-gray-400'}`}>
                                                    {label}
                                                </span>
                                                */}
                                            </div>
                                            <span className="text-green-400 font-semibold text-sm sm:text-base shrink-0 tabular-nums">
                                                {itemTotal} ৳
                                            </span>
                                        </div>

                                        {/* Extras connected to this main item */}
                                        {(hasExtras || (getRelevantExtrasForItem(item).length > 0 && !item.isExtra)) && (
                                            <div className="mt-3 pt-3 border-t border-gray-600/50 space-y-3">
                                                {/* Add more extras (only for main items with relevant extras) */}
                                                {!item.isExtra && onAddExtraToCartItem && getRelevantExtrasForItem(item).length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Add more</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {getRelevantExtrasForItem(item).map(extra => {
                                                                const inCart = item.extras?.find(e => e.id === extra.id);
                                                                return (
                                                                    <div key={extra.id} className="flex items-center gap-1.5 bg-gray-800 rounded-lg px-2.5 py-1.5 border border-gray-600/50">
                                                                        <span className="text-gray-200 text-sm">{extra.name}</span>
                                                                        <span className="text-green-400 text-xs tabular-nums">+{Number(extra.price)} ৳</span>
                                                                        {inCart ? (
                                                                            <div className="flex items-center gap-0.5 ml-1">
                                                                                <button type="button" onClick={() => onUpdateExtraQuantity(item.cartId, extra.id, -1)} className="w-6 h-6 flex items-center justify-center rounded bg-gray-700 text-gray-300 hover:text-white text-xs">−</button>
                                                                                <span className="text-white text-xs w-4 text-center tabular-nums">{inCart.qty}</span>
                                                                                <button type="button" onClick={() => onUpdateExtraQuantity(item.cartId, extra.id, 1)} className="w-6 h-6 flex items-center justify-center rounded bg-indigo-600 text-white text-xs">+</button>
                                                                            </div>
                                                                        ) : (
                                                                            <button type="button" onClick={() => onAddExtraToCartItem(item.cartId, extra)} className="ml-1 px-2 py-1 rounded bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500">Add</button>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                                {hasExtras && (
                                                    <>
                                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Add-ons</p>
                                                        <ul className="space-y-1.5">
                                                            {item.extras.map(extra => (
                                                                <li key={extra.id || extra.name} className="flex items-center justify-between gap-2">
                                                                    <span className="text-gray-300 text-sm">
                                                                        <span className="tabular-nums font-medium text-gray-200">{extra.qty}×</span> {extra.name}
                                                                    </span>
                                                                    <div className="flex items-center gap-1.5">
                                                                        {onUpdateExtraQuantity && (
                                                                            <>
                                                                                <button type="button" onClick={() => onUpdateExtraQuantity(item.cartId, extra.id, -1)} className="w-6 h-6 flex items-center justify-center rounded border border-gray-600 text-gray-400 hover:text-white text-xs" aria-label="Less">−</button>
                                                                                <span className="text-white text-xs tabular-nums w-4 text-center">{extra.qty}</span>
                                                                                <button type="button" onClick={() => onUpdateExtraQuantity(item.cartId, extra.id, 1)} className="w-6 h-6 flex items-center justify-center rounded border border-gray-600 text-gray-400 hover:text-white text-xs" aria-label="More">+</button>
                                                                            </>
                                                                        )}
                                                                        <span className="text-green-400/90 tabular-nums text-sm w-16 text-right">+{(Number(extra.price) * extra.qty)} ৳</span>
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </>
                                                )}
                                                
                                            </div>
                                        )}

                                        {/* Priority & quantity controls */}
                                        <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                                            {/* Fast/Normal service commented out
                                            <div className="flex gap-1.5">
                                                {priorityChoices.map(choice => (
                                                    <button
                                                        key={choice}
                                                        onClick={() => handlePriorityChange(item.cartId, choice)}
                                                        className={`px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                                                            choice === label
                                                                ? 'border-indigo-400 text-indigo-200 bg-indigo-500/10'
                                                                : 'border-gray-600 text-gray-400 hover:border-gray-500'
                                                        }`}
                                                    >
                                                        {choice}
                                                    </button>
                                                ))}
                                            </div>
                                            */}
                                            <div className="flex items-center gap-2 ml-auto">
                                                <button
                                                    onClick={() => onUpdateItemQuantity(item.cartId, -1)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-600 text-gray-300 hover:text-white hover:bg-gray-600 transition"
                                                    aria-label={`Decrease quantity for ${item.name}`}
                                                >
                                                    –
                                                </button>
                                                <span className="text-white font-semibold w-6 text-center tabular-nums text-sm">{item.quantity}</span>
                                                <button
                                                    onClick={() => onUpdateItemQuantity(item.cartId, 1)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-600 text-gray-300 hover:text-white hover:bg-gray-600 transition"
                                                    aria-label={`Increase quantity for ${item.name}`}
                                                >
                                                    +
                                                </button>
                                                <button
                                                    onClick={() => onRemoveItem(item.cartId)}
                                                    className="ml-1 p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                                                    aria-label={`Remove ${item.name}`}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="flex items-center justify-between text-base sm:text-lg font-bold text-white mt-4 shrink-0 border-t border-gray-700 pt-4">
                    <span>Total</span>
                    <span className="text-green-400 tabular-nums">{total} ৳</span>
                </div>

                <div className="flex gap-3 mt-4 shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 sm:py-2.5 rounded-xl border border-gray-600 text-gray-200 hover:bg-gray-700 transition text-sm sm:text-base font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => !isCartEmpty && tableNumber && onConfirm()}
                        disabled={isCartEmpty || !tableNumber}
                        className={`flex-1 py-3 sm:py-2.5 rounded-xl font-semibold text-sm sm:text-base transition ${
                            isCartEmpty || !tableNumber
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-500'
                        }`}
                    >
                        Place Order
                    </button>
                </div>
            </div>
        </BaseModal>
    );
};

export default OrderConfirmationModal;