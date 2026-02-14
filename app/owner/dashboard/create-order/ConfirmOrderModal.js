'use client';

import { Plus, Minus, X, Check } from 'lucide-react';

export default function ConfirmOrderModal({
  isOpen,
  onClose,
  cart,
  tableNumber,
  setTableNumber,
  cartTotal,
  onUpdateQuantity,
  onRemoveFromCart,
  onSubmit,
  submitting,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">Order Details</h2>
          <button
            onClick={() => !submitting && onClose()}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Table Number</label>
            <input
              type="number"
              min="1"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Optional"
              className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="mb-4">
            <p className="text-sm font-medium text-gray-300 mb-2">Items</p>
            <ul className="space-y-2">
              {cart.map((item) => (
                <li
                  key={item.cartId}
                  className="flex items-center justify-between gap-2 py-2 border-b border-gray-700/50 last:border-0"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex items-center gap-1 bg-gray-700 rounded">
                      <button
                        onClick={() => onUpdateQuantity(item.cartId, -1)}
                        className="p-1.5 text-gray-400 hover:text-white"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-2 text-white font-medium min-w-[1.5rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.cartId, 1)}
                        className="p-1.5 text-gray-400 hover:text-white"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-white truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-green-400 font-semibold">
                      {(item.totalPrice ?? item.price * item.quantity).toLocaleString()} ৳
                    </span>
                    <button
                      onClick={() => onRemoveFromCart(item.cartId)}
                      className="p-1 text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-3 border-t border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-white">Total</span>
              <span className="text-xl font-bold text-green-400">{cartTotal.toLocaleString()} ৳</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-700 flex gap-3">
          <button
            onClick={() => !submitting && onClose()}
            className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting || cart.length === 0}
            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-medium flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Submit Order
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
