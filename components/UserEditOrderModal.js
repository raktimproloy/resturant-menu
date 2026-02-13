import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Plus, Minus } from 'lucide-react';

const UserEditOrderModal = ({ order, menuItems = [], extraItems = [], isOpen, onClose, onSave }) => {
  const [items, setItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (order) {
      setItems(JSON.parse(JSON.stringify(order.items || [])));
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const getRelevantExtrasForItem = (item) => {
    const menuItem = menuItems.find(m => m.id === item.id);
    const ids = menuItem?.extraItemIds || [];
    return ids.map(id => extraItems.find(e => e.id === id)).filter(Boolean);
  };

  const handleQuantityChange = (index, delta) => {
    setItems(prev => {
      const next = [...prev];
      const item = next[index];
      const newQty = item.quantity + delta;
      if (newQty <= 0) return next.filter((_, i) => i !== index);
      next[index] = { ...item, quantity: newQty };
      return next;
    });
  };

  const handleRemoveItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddExtra = (itemIndex, extra) => {
    setItems(prev => {
      const next = prev.map((it, i) => {
        if (i !== itemIndex) return it;
        const extras = it.extras || [];
        const existing = extras.find(e => e.id === extra.id);
        const newExtras = existing
          ? extras.map(e => e.id === extra.id ? { ...e, qty: (e.qty || 1) + 1 } : e)
          : [...extras, { id: extra.id, name: extra.name, price: extra.price, qty: 1 }];
        return { ...it, extras: newExtras };
      });
      return next;
    });
  };

  const handleExtraQty = (itemIndex, extraId, delta) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== itemIndex || !it.extras?.length) return it;
      const extra = it.extras.find(e => e.id === extraId);
      if (!extra) return it;
      const newQty = (extra.qty || 1) + delta;
      const newExtras = newQty <= 0
        ? it.extras.filter(e => e.id !== extraId)
        : it.extras.map(e => e.id === extraId ? { ...e, qty: newQty } : e);
      return { ...it, extras: newExtras };
    }));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const base = (item.price || 0) * item.quantity;
      const extrasCost = (item.extras || []).reduce((s, e) => s + (e.price || 0) * (e.qty || 1), 0);
      return sum + base + extrasCost;
    }, 0);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(order.orderId, items, calculateTotal());
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-gray-900/95 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-gray-800 w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-white">Edit Order #{order.orderId?.slice(-4)}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>All items removed. Saving will cancel the order.</p>
            </div>
          ) : (
            items.map((item, index) => {
              const relevantExtras = getRelevantExtrasForItem(item);
              const currentExtraIds = (item.extras || []).map(e => e.id);
              return (
                <section key={index} className="rounded-xl border border-gray-600 bg-gray-700/40 overflow-hidden">
                  {/* Main item row */}
                  <div className="p-4 flex justify-between items-center gap-3 border-b border-gray-600/60">
                    <div className="min-w-0">
                      <h4 className="font-bold text-white truncate">{item.name}</h4>
                      <p className="text-sm text-indigo-400 font-medium mt-0.5">{Number(item.price)} ৳ each</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleQuantityChange(index, -1)}
                        className="p-2 hover:bg-gray-600 rounded-lg text-red-400 transition"
                      >
                        {item.quantity === 1 ? <Trash2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                      </button>
                      <span className="font-bold text-white w-8 text-center tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(index, 1)}
                        className="p-2 hover:bg-gray-600 rounded-lg text-green-400 transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Current add-ons */}
                  {item.extras && item.extras.length > 0 && (
                    <div className="px-4 py-3 border-b border-gray-600/60 bg-gray-800/40">
                      <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">Add-ons</p>
                      <ul className="space-y-2">
                        {item.extras.map((e, ei) => (
                          <li key={ei} className="flex items-center justify-between gap-2 text-sm">
                            <span className="text-gray-300">{e.qty ? `${e.qty}× ` : ''}{e.name}</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleExtraQty(index, e.id, -1)}
                                className="w-6 h-6 flex items-center justify-center rounded border border-gray-600 text-gray-400 hover:text-white text-xs"
                              >
                                −
                              </button>
                              <span className="w-5 text-center text-white tabular-nums text-xs">{e.qty || 1}</span>
                              <button
                                type="button"
                                onClick={() => handleExtraQty(index, e.id, 1)}
                                className="w-6 h-6 flex items-center justify-center rounded bg-gray-600 text-gray-300 hover:text-white text-xs"
                              >
                                +
                              </button>
                              <span className="text-cyan-400 tabular-nums text-xs w-12 text-right">+{Number(e.price) * (e.qty || 1)} ৳</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Add more add-ons */}
                  {relevantExtras.length > 0 && (
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Add more</p>
                      <div className="flex flex-wrap gap-2">
                        {relevantExtras.map(extra => {
                          const inItem = (item.extras || []).find(e => e.id === extra.id);
                          return (
                            <div key={extra.id} className="flex items-center gap-2 bg-gray-800 rounded-lg px-2.5 py-1.5 border border-gray-600/50">
                              <span className="text-gray-200 text-sm">{extra.name}</span>
                              <span className="text-cyan-400 text-xs tabular-nums">+{Number(extra.price).toFixed(0)} ৳</span>
                              {inItem ? (
                                <div className="flex items-center gap-0.5">
                                  <button type="button" onClick={() => handleExtraQty(index, extra.id, -1)} className="w-6 h-6 flex items-center justify-center rounded bg-gray-700 text-gray-300 hover:text-white text-xs">−</button>
                                  <span className="text-white text-xs w-4 text-center tabular-nums">{inItem.qty || 1}</span>
                                  <button type="button" onClick={() => handleAddExtra(index, extra)} className="w-6 h-6 flex items-center justify-center rounded bg-indigo-600 text-white text-xs">+</button>
                                </div>
                              ) : (
                                <button type="button" onClick={() => handleAddExtra(index, extra)} className="px-2 py-1 rounded bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500">Add</button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-gray-700 bg-gray-800/50 shrink-0">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-400">Total</span>
            <span className="text-xl font-bold text-white tabular-nums">{calculateTotal().toFixed(0)} ৳</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-gray-300 bg-gray-700 hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isSaving ? 'Saving...' : <><Save className="w-5 h-5" /> Save</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserEditOrderModal;
