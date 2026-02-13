import React from 'react';
import { X } from 'lucide-react';

export default function AddItemModal({ isOpen, onClose, menuItems, extraItems, onAddItem }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/95 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-gray-800 w-full max-w-2xl max-h-[90dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-700 border-b-0 sm:border-b"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 lg:p-6 pb-[env(safe-area-inset-bottom)]">
          <div className="flex justify-between items-center mb-4 gap-2 sticky top-0 bg-gray-800 pt-1 pb-2 -mt-1 z-10">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">Add Item to Order</h2>
            <button
              onClick={onClose}
              className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center p-2 bg-gray-700 rounded-full hover:bg-gray-600 touch-manipulation"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="space-y-4 lg:space-y-6">
            <div>
              <h3 className="text-base lg:text-lg font-semibold text-white mb-2 lg:mb-3">Menu Items</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3 max-h-56 sm:max-h-64 overflow-y-auto">
                {menuItems.filter(item => item.status === 'Available').map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onAddItem(item, false)}
                    className="p-3 sm:p-2 lg:p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition min-h-[56px] sm:min-h-0 touch-manipulation"
                  >
                    <div className="font-medium text-white text-sm lg:text-base truncate">{item.name}</div>
                    <div className="text-xs lg:text-sm text-green-400 mt-1">
                      {Number(item.finalPrice || item.price)} ৳
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-base lg:text-lg font-semibold text-white mb-2 lg:mb-3">Extra Items</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3 max-h-56 sm:max-h-64 overflow-y-auto">
                {extraItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onAddItem(item, true)}
                    className="p-3 sm:p-2 lg:p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition min-h-[56px] sm:min-h-0 touch-manipulation"
                  >
                    <div className="font-medium text-white text-sm lg:text-base truncate">{item.name}</div>
                    <div className="text-xs lg:text-sm text-green-400 mt-1">
                      {Number(item.price)} ৳
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
