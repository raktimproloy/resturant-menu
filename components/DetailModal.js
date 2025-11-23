import { Clock, X, Minus, Plus, Tag } from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';

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
    // Add all selected main items to cart
    selectedMainItems.forEach(mainEntry => {
      const cartItem = {
        ...mainEntry.item,
        quantity: mainEntry.quantity,
        extras: [], // Main items don't have extras attached
        totalPrice: finalPrice * mainEntry.quantity,
        priority: mainEntry.priority,
        cartId: Date.now() + Math.random(),
      };
      onAddToCart(cartItem);
    });

    // Add all selected extras as separate cart items
    selectedExtras.forEach(extra => {
      const cartItem = {
        ...extra,
        quantity: extra.qty,
        extras: [],
        totalPrice: extra.price * extra.qty,
        priority: selectedPriority,
        cartId: Date.now() + Math.random(),
        isExtra: true, // Explicitly mark as extra item
      };
      onAddToCart(cartItem);
    });

    onClose();
  };
  
  const priorities = ['Low', 'Medium', 'High'];

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/95 flex items-end justify-center sm:items-center p-0" onClick={onClose}>
      <div
        className="bg-gray-800 w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl transform transition-all duration-300 ease-in-out"
        onClick={(e) => e.stopPropagation()} // Prevent click from closing modal
      >
        {/* Header and Image */}
        <div className="relative">
          <img
            src={activeImage}
            alt={item.name}
            className="w-full h-56 object-cover rounded-t-3xl sm:rounded-t-2xl"
            onError={(e) => {
                e.target.onerror = null;
                e.target.src = fallbackImage;
            }}
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-gray-900/70 text-white rounded-full hover:bg-gray-700 transition"
            aria-label="Close details"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {item.images?.length > 1 && (
          <div className="flex gap-3 px-5 sm:px-6 pt-4 overflow-x-auto scrollbar-hide">
            {item.images.map((image, index) => (
              <button
                key={image}
                onClick={() => setActiveImageIndex(index)}
                className={`relative rounded-xl overflow-hidden border-2 transition ${index === activeImageIndex ? 'border-indigo-400' : 'border-transparent opacity-70 hover:opacity-100'}`}
                aria-label={`Show image ${index + 1}`}
              >
                <img
                  src={image}
                  alt={`${item.name} view ${index + 1}`}
                  className="h-16 w-16 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = fallbackImage;
                  }}
                />
              </button>
            ))}
          </div>
        )}

        <div className="p-5 sm:p-6">
          <h2 className="text-3xl font-extrabold text-white mb-2">{item.name}</h2>
          
          {/* Main Details */}
          <div className="flex justify-between items-center text-lg mb-4 border-b border-gray-700 pb-4">
            <div className="flex flex-col">
              {hasDiscount ? (
                <>
                  <span className="text-sm text-gray-400 line-through flex items-center">
                    {originalPrice.toFixed(2)} BDT
                  </span>
                  <span className="flex items-center text-green-400 font-bold">
                    {finalPrice.toFixed(2)} BDT
                    {hasDiscount && (
                      <span className="ml-2 px-2 py-0.5 bg-red-500/80 text-white text-xs rounded-full flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {discountPercent}% OFF
                      </span>
                    )}
                  </span>
                </>
              ) : (
                <span className="flex items-center text-green-400 font-bold">
                  {originalPrice.toFixed(2)} BDT
                </span>
              )}
            </div>
            {!item.isExtra && (
              <span className="flex items-center text-indigo-300">
                <Clock className="w-5 h-5 mr-1" />{item.time} min
              </span>
            )}
          </div>
{selectedMainItems.length === 0 && (
                <div className="mb-6 p-4 bg-gray-700 rounded-xl">
                  <h3 className="text-lg font-semibold text-indigo-300 mb-3">Add {item.name}</h3>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3 bg-gray-800 p-2 rounded-xl">
                      <button
                        onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                        className="p-1 bg-indigo-600 rounded-full hover:bg-indigo-500 transition"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-5 h-5 text-white" />
                      </button>
                      <span className="text-xl font-bold w-6 text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity(prev => prev + 1)}
                        className="p-1 bg-indigo-600 rounded-full hover:bg-indigo-500 transition"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm text-gray-400">Price</div>
                        <div className="text-lg font-bold text-green-400">{calculateCurrentItemSubtotal.toFixed(2)} BDT</div>
                      </div>
                      <button
                        onClick={handleAddMainItem}
                        className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 transition"
                      >
                        <Plus className="w-5 h-5 mr-1" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
          {/* Include Items & Uses - Only show for non-extra items */}
          {!item.isExtra && (
            <div className="space-y-4 mb-6">
              {item.mainItems && item.mainItems.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-indigo-300 mb-2">Main Ingredients</h3>
                  <ul className="flex flex-wrap gap-2">
                    {item.mainItems.map((ing, index) => (
                      <li key={index} className="px-3 py-1 bg-gray-700 text-sm text-gray-50 rounded-full">{ing}</li>
                    ))}
                  </ul>
                </div>
              )}
              {item.uses && (
                <div>
                  <h3 className="text-lg font-semibold text-indigo-300 mb-2">Contains</h3>
                  <span className="px-3 py-1 bg-green-600 text-sm font-bold text-white rounded-full">{item.uses}</span>
                </div>
              )}
            </div>
          )}

          {/* Related/Extra Items */}
          {relevantExtras.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-indigo-300 mb-3">Add Something Extra?</h3>
              <div className="space-y-3">
                {relevantExtras.map(extra => {
                  const isSelected = selectedExtras.find(e => e.id === extra.id);
                  const extraImage = extra.images?.[0] || `https://placehold.co/60x60/475569/f1f5f9?text=${extra.name.split(' ')[0]}`;
                  return (
                    <div key={extra.id} className="flex justify-between items-center bg-gray-700 p-3 rounded-xl">
                      <div className='flex items-center gap-3'>
                        <img
                          src={extraImage}
                          alt={extra.name}
                          className="w-12 h-12 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://placehold.co/60x60/475569/f1f5f9?text=${extra.name.split(' ')[0]}`;
                          }}
                        />
                        <div className='flex flex-col'>
                            <span className="text-gray-50 font-medium">{extra.name}</span>
                            <span className="text-sm text-green-300">+ {Number(extra.price).toFixed(2)} BDT</span>
                        </div>
                      </div>
                      {isSelected ? (
                         <div className="flex items-center space-x-2">
                              <button
                                  onClick={() => handleExtraQuantity(extra, -1)}
                                  className="p-1 bg-indigo-600 rounded-full hover:bg-indigo-500 transition"
                              >
                                  <Minus className="w-4 h-4 text-white" />
                              </button>
                              <span className="text-lg font-bold w-4 text-center">{isSelected.qty}</span>
                              <button
                                  onClick={() => handleExtraQuantity(extra, 1)}
                                  className="p-1 bg-indigo-600 rounded-full hover:bg-indigo-500 transition"
                              >
                                  <Plus className="w-4 h-4 text-white" />
                              </button>
                          </div>
                      ) : (
                          <button
                              onClick={() => handleExtraToggle(extra)}
                              className="px-4 py-1.5 bg-green-500 text-gray-900 font-semibold rounded-full hover:bg-green-400 transition"
                          >
                              Add
                          </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected Items List - Only show when isAddToCartActive is true */}
          {isAddToCartActive && (
            <>
              {/* Selected Main Items */}
              {selectedMainItems.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-indigo-300 mb-3">Selected Items</h3>
                  <div className="space-y-3">
                    {selectedMainItems.map(mainEntry => (
                      <div key={mainEntry.id} className="flex justify-between items-center bg-gray-700 p-3 rounded-xl">
                        <div className="flex items-center gap-3 flex-1">
                          <img
                            src={mainEntry.item.images?.[0] || fallbackImage}
                            alt={mainEntry.item.name}
                            className="w-12 h-12 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = fallbackImage;
                            }}
                          />
                          <div className="flex flex-col flex-1">
                            <span className="text-gray-50 font-medium">{mainEntry.item.name}</span>
                            <span className="text-sm text-green-300">
                              {finalPrice.toFixed(2)} BDT × {mainEntry.quantity} = {(finalPrice * mainEntry.quantity).toFixed(2)} BDT
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUpdateMainItemQuantity(mainEntry.id, -1)}
                            className="p-1 bg-indigo-600 rounded-full hover:bg-indigo-500 transition"
                          >
                            <Minus className="w-4 h-4 text-white" />
                          </button>
                          <span className="text-lg font-bold w-4 text-center">{mainEntry.quantity}</span>
                          <button
                            onClick={() => handleUpdateMainItemQuantity(mainEntry.id, 1)}
                            className="p-1 bg-indigo-600 rounded-full hover:bg-indigo-500 transition"
                          >
                            <Plus className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={() => handleRemoveMainItem(mainEntry.id)}
                            className="ml-2 p-1 bg-red-600 rounded-full hover:bg-red-500 transition"
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

              {/* Selected Extras */}
              {selectedExtras.length > 0 && (
                <div className="mb-6">
                  {/* {selectedMainItems.length > 0 && (
                    <h3 className="text-lg font-semibold text-indigo-300 mb-3">Selected Extras</h3>
                  )} */}
                  <div className="space-y-3">
                    {selectedExtras.map(extra => {
                      const extraImage = extra.images?.[0] || `https://placehold.co/60x60/475569/f1f5f9?text=${extra.name.split(' ')[0]}`;
                      return (
                        <div key={extra.id} className="flex justify-between items-center bg-gray-700 p-3 rounded-xl">
                          <div className="flex items-center gap-3 flex-1">
                            <img
                              src={extraImage}
                              alt={extra.name}
                              className="w-12 h-12 object-cover rounded-lg"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://placehold.co/60x60/475569/f1f5f9?text=${extra.name.split(' ')[0]}`;
                              }}
                            />
                            <div className="flex flex-col flex-1">
                              <span className="text-gray-50 font-medium">{extra.name}</span>
                              <span className="text-sm text-green-300">
                                {Number(extra.price).toFixed(2)} BDT × {extra.qty} = {(extra.price * extra.qty).toFixed(2)} BDT
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleExtraQuantity(extra, -1)}
                              className="p-1 bg-indigo-600 rounded-full hover:bg-indigo-500 transition"
                            >
                              <Minus className="w-4 h-4 text-white" />
                            </button>
                            <span className="text-lg font-bold w-4 text-center">{extra.qty}</span>
                            <button
                              onClick={() => handleExtraQuantity(extra, 1)}
                              className="p-1 bg-indigo-600 rounded-full hover:bg-indigo-500 transition"
                            >
                              <Plus className="w-4 h-4 text-white" />
                            </button>
                            <button
                              onClick={() => handleRemoveExtra(extra.id)}
                              className="ml-2 p-1 bg-red-600 rounded-full hover:bg-red-500 transition"
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
            </>
          )}
          {
            selectedMainItems.length > 0 || selectedExtras.length > 0
            ? (
            <div className="mb-4 p-4 bg-gray-700 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-bold text-white">Total:</span>
                <span className="text-2xl font-bold text-green-400">{calculateSubtotal.toFixed(2)} BDT</span>
              </div>
              <button
                onClick={() => {
                  if (selectedMainItems.length > 0 || selectedExtras.length > 0) {
                    handleAddToCart();
                  } else {
                    setIsAddToCartActive(true);
                  }
                }}
                className="w-full flex items-center justify-center px-6 py-3 bg-green-500 text-gray-900 font-extrabold rounded-xl shadow-lg hover:bg-green-400 transition-transform duration-100 transform active:scale-[0.98]"
              >
                Add All to Cart ({calculateSubtotal.toFixed(2)} BDT)
              </button>
            </div>

            )
            : null
          }
        </div>
      </div>
    </div>
  );
};

export default DetailModal;