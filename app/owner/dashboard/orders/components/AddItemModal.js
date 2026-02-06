import React from 'react';
import { X } from 'lucide-react';

export default function AddItemModal({ isOpen, onClose, menuItems, extraItems, onAddItem }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/95 flex items-center justify-center p-2 lg:p-4" onClick={onClose}>
      <div
        className="bg-gray-800 w-full max-w-2xl max-h-[95vh] lg:max-h-[90vh] overflow-y-auto rounded-xl lg:rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 lg:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl lg:text-2xl font-bold text-white">Add Item to Order</h2>
            <button
              onClick={onClose}
              className="p-2 bg-gray-700 rounded-full hover:bg-gray-600"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="space-y-4 lg:space-y-6">
            {/* Menu Items */}
            <div>
              <h3 className="text-base lg:text-lg font-semibold text-white mb-2 lg:mb-3">Menu Items</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3 max-h-64 overflow-y-auto">
                {menuItems.filter(item => item.status === 'Available').map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onAddItem(item, false)}
                    className="p-2 lg:p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition"
                  >
                    <div className="font-medium text-white text-sm lg:text-base">{item.name}</div>
                    <div className="text-xs lg:text-sm text-green-400 mt-1">
                      {Number(item.finalPrice || item.price).toFixed(2)} BDT
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Extra Items */}
            <div>
              <h3 className="text-base lg:text-lg font-semibold text-white mb-2 lg:mb-3">Extra Items</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3 max-h-64 overflow-y-auto">
                {extraItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onAddItem(item, true)}
                    className="p-2 lg:p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition"
                  >
                    <div className="font-medium text-white text-sm lg:text-base">{item.name}</div>
                    <div className="text-xs lg:text-sm text-green-400 mt-1">
                      {Number(item.price).toFixed(2)} BDT
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
