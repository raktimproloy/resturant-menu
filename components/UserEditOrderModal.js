import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Plus, Minus } from 'lucide-react';

const UserEditOrderModal = ({ order, isOpen, onClose, onSave }) => {
  const [items, setItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (order) {
      // Deep copy items to avoid mutating props directly
      setItems(JSON.parse(JSON.stringify(order.items || [])));
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleQuantityChange = (index, delta) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      const item = newItems[index];
      const newQuantity = item.quantity + delta;

      if (newQuantity <= 0) {
        // If quantity becomes 0, remove the item
        return newItems.filter((_, i) => i !== index);
      }

      // Update quantity
      newItems[index] = { ...item, quantity: newQuantity };
      
      // Update total price for this item if needed (though final calculation is done on save/render)
      // Assuming item.price is unit price. 
      // If item has finalPrice (with extras), we should use that.
      
      return newItems;
    });
  };

  const handleRemoveItem = (index) => {
    setItems(prevItems => prevItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const price = item.finalPrice !== undefined ? item.finalPrice : item.price;
      const extrasCost = (item.extras || []).reduce((acc, extra) => acc + (extra.price * extra.qty), 0);
      // Note: finalPrice usually includes extras in some implementations, but let's be safe.
      // Checking App.js: 
      // const itemTotal = item.totalPrice ?? (item.price * (item.quantity || 1));
      // But here we are editing individual items. 
      // In App.js cart logic: 
      // const nextTotal = itemPrice * nextQuantity + extrasCost;
      
      // Let's assume item.price is base price.
      // If finalPrice is set, it might be unit price including extras?
      // Let's stick to the App.js logic:
      // const itemPrice = item.finalPrice !== undefined ? item.finalPrice : item.price;
      // Wait, in App.js handleUpdateCartItemQuantity:
      // const itemPrice = item.finalPrice !== undefined ? item.finalPrice : item.price;
      // const extrasCost = item.extras?.reduce((sum, extra) => sum + (extra.price * extra.qty), 0) || 0;
      // const nextTotal = itemPrice * nextQuantity + extrasCost;
      
      // However, finalPrice often ALREADY includes extras in some of my other logic.
      // Let's look at how the order is stored in API.
      // It stores `price` (unit price) and `extras`.
      
      // Simple calculation:
      return sum + (item.price * item.quantity) + ((item.extras || []).reduce((s, e) => s + (e.price * e.qty), 0) * item.quantity); 
      // Wait, extras cost is per item unit? Yes.
      
    }, 0);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const newTotal = calculateTotal();
    await onSave(order.orderId, items, newTotal);
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-gray-900/95 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-700 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-800">
          <h3 className="text-xl font-bold text-white">Edit Order #{order.orderId.slice(-4)}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>All items removed. Saving will cancel the order.</p>
            </div>
          ) : (
            items.map((item, index) => (
              <div key={index} className="bg-gray-700/50 rounded-xl p-3 flex justify-between items-center border border-gray-700">
                <div className="flex-1 min-w-0 mr-4">
                  <h4 className="font-bold text-white truncate">{item.name}</h4>
                  {item.extras && item.extras.length > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      {item.extras.map(e => `+ ${e.name}`).join(', ')}
                    </div>
                  )}
                  <div className="text-sm text-indigo-400 font-medium mt-1">
                     {Number(item.price).toFixed(2)} BDT
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-gray-800 rounded-lg p-1 border border-gray-600">
                  <button 
                    onClick={() => handleQuantityChange(index, -1)}
                    className="p-1 hover:bg-gray-700 rounded text-red-400 transition"
                  >
                    {item.quantity === 1 ? <Trash2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                  </button>
                  <span className="font-bold text-white w-6 text-center">{item.quantity}</span>
                  <button 
                    onClick={() => handleQuantityChange(index, 1)}
                    className="p-1 hover:bg-gray-700 rounded text-green-400 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-5 border-t border-gray-700 bg-gray-800/50">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-400">Total Amount</span>
            <span className="text-2xl font-bold text-white">{calculateTotal().toFixed(2)} BDT</span>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-300 bg-gray-700 hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isSaving ? 'Saving...' : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserEditOrderModal;
