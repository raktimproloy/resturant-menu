import React from 'react';
import { Bell, Edit2 } from 'lucide-react';
import EditOrderForm from './EditOrderForm';
import { priorityStyles, getStatusIcon, getStatusColor, formatTime } from './utils';

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
  onDone
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 lg:p-6 border border-gray-700 hover:border-gray-600 transition">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start mb-3 lg:mb-4 gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-lg lg:text-xl font-bold text-white">Order #{order.id.slice(-4)}</h3>
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
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
          {getStatusIcon(order.status)}
          <span className="text-xs lg:text-sm font-medium capitalize">{order.status}</span>
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
            <ul className="space-y-1">
              {order.items.map((item, index) => {
                const itemPriority = item.priority || 'Medium';
                const priorityLabel = itemPriority === 'High' ? 'Fast' : 'Normal';
                const isLaterOrder = item.isLaterOrder;
                return (
                  <li key={index} className={`text-gray-300 flex items-center justify-between ${isLaterOrder ? 'bg-yellow-900/20 px-2 py-1 rounded' : ''}`}>
                    <span className="flex items-center gap-2">
                      <span>
                        • {item.quantity}x {item.name} - {Number(item.finalPrice || item.price).toFixed(2)} BDT
                        {item.extras && item.extras.length > 0 && (
                          <span className="text-gray-500 text-xs ml-2">
                            (+{item.extras.length} extras)
                          </span>
                        )}
                      </span>
                      {isLaterOrder && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-600/30 text-yellow-400 font-medium">
                          Later Order
                        </span>
                      )}
                    </span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${priorityLabel === 'Fast' ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-400'}`}>
                      {priorityLabel}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-3 lg:pt-4 border-t border-gray-700 gap-3">
            <div className="text-xl lg:text-2xl font-bold text-green-400">
              {Number(order.total).toFixed(2)} BDT
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {order.status === 'pending' && (
                <>
                  <button
                    onClick={() => onEdit(order)}
                    className="flex-1 sm:flex-none px-3 lg:px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center justify-center gap-2 text-sm lg:text-base"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => onAccept(order.id)}
                    className="flex-1 sm:flex-none px-3 lg:px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm lg:text-base"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onCancel(order.id)}
                    className="flex-1 sm:flex-none px-3 lg:px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm lg:text-base"
                  >
                    Cancel
                  </button>
                </>
              )}
              {order.status === 'processing' && (
                <button
                  onClick={() => onStatusChange(order.id, 'completed')}
                  className="w-full sm:w-auto px-3 lg:px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm lg:text-base"
                >
                  Completed
                </button>
              )}
              {order.status === 'completed' && (
                <button
                  onClick={() => onDone(order.id)}
                  className="w-full sm:w-auto px-3 lg:px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm lg:text-base"
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
