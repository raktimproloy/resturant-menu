import React from 'react';
import { Plus, Minus, Trash2, Save } from 'lucide-react';

export default function EditOrderForm({
  editFormData,
  onUpdateItemQuantity,
  onRemoveItem,
  onUpdatePrice,
  onCancel,
  onSave,
  onAddItemClick
}) {
  return (
    <div className="space-y-3 lg:space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
        <h4 className="text-base lg:text-lg font-semibold text-white">Edit Order Items</h4>
        <button
          onClick={onAddItemClick}
          className="w-full sm:w-auto px-3 lg:px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center justify-center gap-2 text-sm lg:text-base"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>
      <div className="space-y-2">
        {editFormData.items.map((item, index) => {
          const isLaterOrder = item.isLaterOrder;
          return (
            <div key={index} className={`bg-gray-700 p-3 rounded-lg ${isLaterOrder ? 'border border-yellow-700/50' : ''}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{item.name}</p>
                    {isLaterOrder && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-600/30 text-yellow-400 font-medium">
                        Later Order
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => onUpdateItemQuantity(index, -1)}
                      className="p-1 bg-gray-600 rounded hover:bg-gray-500"
                    >
                      <Minus className="w-4 h-4 text-white" />
                    </button>
                    <span className="text-white font-semibold w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateItemQuantity(index, 1)}
                      className="p-1 bg-gray-600 rounded hover:bg-gray-500"
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={item.finalPrice || item.price}
                    onChange={(e) => onUpdatePrice(index, e.target.value)}
                    className="w-20 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                  />
                  <button
                    onClick={() => onRemoveItem(index)}
                    className="p-1 bg-red-600 rounded hover:bg-red-500"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
              {item.extras && item.extras.length > 0 && (
                <div className="text-xs text-gray-400 mt-1">
                  Extras: {item.extras.map(e => `${e.qty}x ${e.name}`).join(', ')}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-3 lg:pt-4 border-t border-gray-700 gap-3">
        <div className="text-xl lg:text-2xl font-bold text-green-400">
          {Number(editFormData.total).toFixed(2)} BDT
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={onCancel}
            className="flex-1 sm:flex-none px-3 lg:px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm lg:text-base"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex-1 sm:flex-none px-3 lg:px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg flex items-center justify-center gap-2 text-sm lg:text-base"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
