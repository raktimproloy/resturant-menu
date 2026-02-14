import { Package, X, Minus, Plus, Tag } from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import BaseModal from './BaseModal';

const DetailModal = ({ item, extraItems, priorityStyles, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [selectedMainItems, setSelectedMainItems] = useState([]); // Array to store multiple main items
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  // 6. Set priority
  const [selectedPriority, setSelectedPriority] = useState('Medium');
  const [isAddToCartActive, setIsAddToCartActive] = useState(true); 

  if (!item) return null;

  useEffect(() => {
    setActiveImageIndex(0);
    setIsAddToCartActive(true); // Reset when item changes
    setSelectedMainItems([]); // Reset selected main items
    setSelectedExtras([]); // Reset selected extras
    setQuantity(1); // Reset quantity
  }, [item]);

  const fallbackImage = `https://placehold.co/600x400/475569/f1f5f9?text=${item.name.split(' ')[0]}`;
  const activeImage = item.images?.[activeImageIndex] || fallbackImage;

  // Find related extra items (filter out missing ones gracefully)
  const relevantExtras = (item.extraItemIds || [])
    .map(id => extraItems.find(extra => extra.id === id))
    .filter(extra => extra !== undefined); // Remove undefined items (missing IDs)

  // Calculate prices with discount
  const originalPrice = item.price || 0;
  const hasDiscount = item.discount && (item.discount.type === 'percentage' || item.discount.type === 'price');
  const finalPrice = item.finalPrice !== undefined ? item.finalPrice : originalPrice;
  const discountAmount = hasDiscount ? (originalPrice - finalPrice) : 0;
  const discountPercent = hasDiscount && item.discount.type === 'percentage' 
    ? item.discount.value 
    : hasDiscount 
      ? Math.round((discountAmount / originalPrice) * 100) 
      : 0;

  const handleExtraToggle = (extra) => {
    setSelectedExtras(prev => {
      const newExtras = prev.some(e => e.id === extra.id)
        ? prev.filter(e => e.id !== extra.id)
        : [...prev, { ...extra, qty: 1 }];
      // Auto-activate add to cart when extra is added
      if (newExtras.length > 0 && !isAddToCartActive) {
        setIsAddToCartActive(true);
      }
      return newExtras;
    });
  };

  const handleExtraQuantity = (extra, delta) => {
    setSelectedExtras(prev => {
      const existing = prev.find(e => e.id === extra.id);
      if (!existing) return prev;
      
      const newQty = existing.qty + delta;
      
      if (newQty <= 0) {
        return prev.filter(e => e.id !== extra.id);
      }
      
      return prev.map(e => e.id === extra.id ? { ...e, qty: newQty } : e);
    });
  };

  const handleAddMainItem = () => {
    const mainItemEntry = {
      id: Date.now() + Math.random(),
      item: { ...item },
      quantity: quantity,
      priority: selectedPriority,
    };
    setSelectedMainItems(prev => [...prev, mainItemEntry]);
    setQuantity(1); // Reset quantity after adding
  };

  const handleRemoveMainItem = (id) => {
    setSelectedMainItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateMainItemQuantity = (id, delta) => {
    setSelectedMainItems(prev => prev.map(entry => {
      if (entry.id !== id) return entry;
      const newQty = Math.max(1, entry.quantity + delta);
      return { ...entry, quantity: newQty };
    }));
  };

  const handleRemoveExtra = (extraId) => {
    setSelectedExtras(prev => prev.filter(e => e.id !== extraId));
  };

  const calculateSubtotal = useMemo(() => {
    const mainItemsPrice = selectedMainItems.reduce((sum, entry) => {
      return sum + (finalPrice * entry.quantity);
    }, 0);
    const extrasPrice = selectedExtras.reduce((sum, extra) => sum + extra.price * extra.qty, 0);
    return mainItemsPrice + extrasPrice;
  }, [finalPrice, selectedMainItems, selectedExtras]);

  const calculateCurrentItemSubtotal = useMemo(() => {
    const basePrice = finalPrice * quantity;
    return basePrice;
  }, [finalPrice, quantity]);

  const handleAddToCart = () => {
    const extrasForMain = selectedExtras.map(extra => ({
      id: extra.id,
      name: extra.name,
      price: extra.price,
      qty: extra.qty,
    }));
    const extrasCost = selectedExtras.reduce((sum, extra) => sum + extra.price * extra.qty, 0);

    selectedMainItems.forEach((mainEntry, index) => {
      const isFirst = index === 0;
      const attachedExtras = isFirst ? extrasForMain : [];
      const mainTotal = finalPrice * mainEntry.quantity + (isFirst ? extrasCost : 0);
      const cartItem = {
        ...mainEntry.item,
        quantity: mainEntry.quantity,
        extras: attachedExtras,
        totalPrice: mainTotal,
        priority: mainEntry.priority,
        cartId: Date.now() + Math.random(),
      };
      onAddToCart(cartItem);
    });

    onClose();
  };
  
  const priorities = ['Low', 'Medium', 'High'];

  return (
    <BaseModal isOpen={!!item} onClose={onClose} maxWidth="lg" slideFromBottom>
      {/* Header and Main Image */}
      <div className="relative shrink-0">
          <img
            src={activeImage}
            alt={item.name}
            className="w-full h-48 sm:h-56 object-cover rounded-t-2xl"
            onError={(e) => {
                e.target.onerror = null;
                e.target.src = fallbackImage;
            }}
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-black/70 transition"
            aria-label="Close details"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Thumbnail strip: horizontal scroll, left to right */}
        {item.images?.length > 1 && (
          <div className="shrink-0 px-4 sm:px-6 pt-3 pb-1">
            <div className="flex gap-2 overflow-x-auto overflow-y-hidden scroll-smooth pb-1 -mx-1" style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
              {item.images.map((image, index) => (
                <button
                  key={image}
                  onClick={() => setActiveImageIndex(index)}
                  className={`shrink-0 relative rounded-lg overflow-hidden border-2 transition-all duration-200 ${index === activeImageIndex ? 'border-indigo-400 ring-2 ring-indigo-400/30 scale-[1.02]' : 'border-gray-600 opacity-80 hover:opacity-100 hover:border-gray-500'}`}
                  aria-label={`Show image ${index + 1}`}
                >
                  <img
                    src={image}
                    alt={`${item.name} view ${index + 1}`}
                    className="h-14 w-14 sm:h-16 sm:w-16 object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = fallbackImage;
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col">
          <div className="p-4 sm:p-6 pb-8 sm:pb-10">
          {/* Product title */}
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">{item.name}</h2>

          {/* Price & prep time card */}
          <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
            <div className="flex flex-col gap-0.5">
              {hasDiscount ? (
                <>
                  <span className="text-sm text-gray-400 line-through">{originalPrice} ৳</span>
                  <span className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg sm:text-xl font-bold text-green-400">{finalPrice} ৳</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/90 text-white text-xs font-medium rounded-full">
                      <Tag className="w-3 h-3" />
                      {discountPercent}% OFF
                    </span>
                  </span>
                </>
              ) : (
                <span className="text-lg sm:text-xl font-bold text-green-400">{originalPrice} ৳</span>
              )}
            </div>
            {!item.isExtra && item.stock !== undefined && item.stock !== null && (
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-300 bg-gray-700 px-3 py-1.5 rounded-lg">
                <Package className="w-4 h-4 text-indigo-400" />
                Stock: {item.stock}
              </span>
            )}
          </div>

          {/* Add main dish to order — clear section */}
          {!item.isExtra && selectedMainItems.length === 0 && (
            <section className="mb-6" aria-label="Add main item to order">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Add to order</h3>
              <p className="text-sm text-gray-500 mb-3">Choose quantity for this item</p>
              <div className="p-4 bg-gray-700/60 rounded-xl border border-gray-600/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center justify-between sm:justify-start gap-4">
                    <span className="text-sm font-medium text-gray-300">Quantity</span>
                    <div className="flex items-center gap-2 bg-gray-800 p-1.5 rounded-lg">
                      <button
                        onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                        className="p-1.5 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4 text-white" />
                      </button>
                      <span className="text-lg font-bold w-8 text-center text-white tabular-nums">{quantity}</span>
                      <button
                        onClick={() => setQuantity(prev => prev + 1)}
                        className="p-1.5 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="text-right">
                      <span className="text-xs text-gray-500 block">Subtotal</span>
                      <span className="text-lg font-bold text-green-400">{calculateCurrentItemSubtotal} ৳</span>
                    </div>
                    <button
                      onClick={handleAddMainItem}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 transition shrink-0"
                    >
                      <Plus className="w-5 h-5" />
                      Add to list
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* About this item: ingredients & allergens */}
          {!item.isExtra && (
            <section className="mb-6 space-y-4" aria-label="Product details">
              {item.mainItems && item.mainItems.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Ingredients</h3>
                  <ul className="flex flex-wrap gap-2">
                    {item.mainItems.map((ing, index) => (
                      <li key={index} className="px-3 py-1.5 bg-gray-700/80 text-sm text-gray-200 rounded-lg border border-gray-600/50">{ing}</li>
                    ))}
                  </ul>
                </div>
              )}
              {item.uses && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Allergens / Contains</h3>
                  <span className="inline-block px-3 py-1.5 bg-amber-500/20 text-amber-200 text-sm font-medium rounded-lg border border-amber-500/30">{item.uses}</span>
                </div>
              )}
            </section>
          )}

          {/* Optional extras */}
          {relevantExtras.length > 0 && (
            <section className="mb-6" aria-label="Optional extras">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Add extras (optional)</h3>
              <div className="space-y-2">
                {relevantExtras.map(extra => {
                  const isSelected = selectedExtras.find(e => e.id === extra.id);
                  const extraImage = extra.images?.[0] || `https://placehold.co/60x60/475569/f1f5f9?text=${extra.name.split(' ')[0]}`;
                  return (
                    <div key={extra.id} className="flex gap-3 sm:gap-4 bg-gray-700/60 p-3 rounded-xl border border-gray-600/40">
                      <img
                        src={extraImage}
                        alt={extra.name}
                        className="w-11 h-11 sm:w-12 sm:h-12 object-cover rounded-lg shrink-0"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://placehold.co/60x60/475569/f1f5f9?text=${extra.name.split(' ')[0]}`;
                        }}
                      />
                      <div className="min-w-0 flex-1 flex flex-col justify-center gap-0.5">
                        <span className="text-gray-100 font-medium wrap-break-word leading-snug">{extra.name}</span>
                        <span className="text-sm text-green-400">+{Number(extra.price)} ৳</span>
                      </div>
                      <div className="shrink-0 flex items-center gap-2 self-center">
                        {isSelected ? (
                          <>
                            <button
                              onClick={() => handleExtraQuantity(extra, -1)}
                              className="p-1.5 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition"
                              aria-label="Decrease"
                            >
                              <Minus className="w-4 h-4 text-white" />
                            </button>
                            <span className="text-base font-bold w-6 text-center text-white tabular-nums">{isSelected.qty}</span>
                            <button
                              onClick={() => handleExtraQuantity(extra, 1)}
                              className="p-1.5 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition"
                              aria-label="Increase"
                            >
                              <Plus className="w-4 h-4 text-white" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleExtraToggle(extra)}
                            className="px-4 py-2 bg-green-500 text-gray-900 font-semibold rounded-lg hover:bg-green-400 transition whitespace-nowrap"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Your order summary */}
          {isAddToCartActive && (selectedMainItems.length > 0 || selectedExtras.length > 0) && (
            <section className="mb-6" aria-label="Your order">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Your order</h3>

              {selectedMainItems.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-indigo-300 mb-2">Main items</h4>
                  <div className="space-y-2">
                    {selectedMainItems.map(mainEntry => (
                      <div key={mainEntry.id} className="flex flex-wrap items-center justify-between gap-2 bg-gray-700/60 p-3 rounded-xl border border-gray-600/40">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img
                            src={mainEntry.item.images?.[0] || fallbackImage}
                            alt={mainEntry.item.name}
                            className="w-11 h-11 sm:w-12 sm:h-12 object-cover rounded-lg shrink-0"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = fallbackImage;
                            }}
                          />
                          <div className="min-w-0">
                            <span className="text-gray-100 font-medium block truncate">{mainEntry.item.name}</span>
                            <span className="text-sm text-green-400">
                              {finalPrice} ৳ × {mainEntry.quantity} = {(finalPrice * mainEntry.quantity)} ৳
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleUpdateMainItemQuantity(mainEntry.id, -1)}
                            className="p-1.5 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition"
                            aria-label="Decrease"
                          >
                            <Minus className="w-4 h-4 text-white" />
                          </button>
                          <span className="text-base font-bold w-6 text-center text-white tabular-nums">{mainEntry.quantity}</span>
                          <button
                            onClick={() => handleUpdateMainItemQuantity(mainEntry.id, 1)}
                            className="p-1.5 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition"
                            aria-label="Increase"
                          >
                            <Plus className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={() => handleRemoveMainItem(mainEntry.id)}
                            className="p-1.5 bg-red-600/80 rounded-lg hover:bg-red-500 transition"
                            aria-label="Remove item"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedExtras.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-indigo-300 mb-2">Extras</h4>
                  <div className="space-y-2">
                    {selectedExtras.map(extra => {
                      const extraImage = extra.images?.[0] || `https://placehold.co/60x60/475569/f1f5f9?text=${extra.name.split(' ')[0]}`;
                      return (
                        <div key={extra.id} className="flex flex-wrap items-center justify-between gap-2 bg-gray-700/60 p-3 rounded-xl border border-gray-600/40">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <img
                              src={extraImage}
                              alt={extra.name}
                              className="w-11 h-11 sm:w-12 sm:h-12 object-cover rounded-lg shrink-0"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://placehold.co/60x60/475569/f1f5f9?text=${extra.name.split(' ')[0]}`;
                              }}
                            />
                            <div className="min-w-0">
                              <span className="text-gray-100 font-medium block truncate">{extra.name}</span>
                              <span className="text-sm text-green-400">
                                {Number(extra.price)} ৳ × {extra.qty} = {(extra.price * extra.qty)} ৳
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleExtraQuantity(extra, -1)}
                              className="p-1.5 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition"
                              aria-label="Decrease"
                            >
                              <Minus className="w-4 h-4 text-white" />
                            </button>
                            <span className="text-base font-bold w-6 text-center text-white tabular-nums">{extra.qty}</span>
                            <button
                              onClick={() => handleExtraQuantity(extra, 1)}
                              className="p-1.5 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition"
                              aria-label="Increase"
                            >
                              <Plus className="w-4 h-4 text-white" />
                            </button>
                            <button
                              onClick={() => handleRemoveExtra(extra.id)}
                              className="p-1.5 bg-red-600/80 rounded-lg hover:bg-red-500 transition"
                              aria-label="Remove extra"
                            >
                              <X className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          </div>
        </div>

        {/* Total & Add to cart — fixed footer, outside scroll */}
        {(selectedMainItems.length > 0 || selectedExtras.length > 0) && (
          <div className="shrink-0 border-t border-gray-700 bg-gray-800 px-4 sm:px-6 pt-4 pb-5 sm:pb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-base font-semibold text-gray-200">Total</span>
              <span className="text-xl sm:text-2xl font-bold text-green-400 tabular-nums">{calculateSubtotal} ৳</span>
            </div>
            <button
              onClick={() => {
                if (selectedMainItems.length > 0 || selectedExtras.length > 0) handleAddToCart();
                else setIsAddToCartActive(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-green-500 text-gray-900 font-bold rounded-xl shadow-lg hover:bg-green-400 active:scale-[0.99] transition"
            >
              Add all to cart · {calculateSubtotal} ৳
            </button>
          </div>
        )}
    </BaseModal>
  );
};

export default DetailModal;