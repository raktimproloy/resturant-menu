'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, ShoppingCart, Check, Package, Search } from 'lucide-react';
import ConfirmOrderModal from './ConfirmOrderModal';
import OrderReceipt from '../orders/components/OrderReceipt';

const fallbackImage = (name) =>
  `https://placehold.co/600x400/475569/f1f5f9?text=${(name || 'Item').split(' ')[0]}`;

export default function CreateOrderPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [extraItems, setExtraItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [printOrder, setPrintOrder] = useState(null);

  useEffect(() => {
    if (printOrder) {
      const timer = setTimeout(() => {
        window.print();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [printOrder]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuRes, extrasRes, categoriesRes] = await Promise.all([
          fetch('/api/menu'),
          fetch('/api/extras'),
          fetch('/api/categories'),
        ]);
        const menuData = await menuRes.json();
        const extrasData = await extrasRes.json();
        const categoriesData = await categoriesRes.json();
        if (menuData.success) setMenuItems(menuData.menu || []);
        if (extrasData.success) setExtraItems(extrasData.extras || []);
        if (categoriesData.success) setCategories(categoriesData.categories || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const extraItemsAsMenu = useMemo(
    () =>
      extraItems.map((e) => ({
        ...e,
        id: `extra-${e.id}`,
        name: e.name,
        price: Number(e.price) || 0,
        finalPrice: Number(e.price) || 0,
        isExtra: true,
        categoryIds: [],
      })),
    [extraItems]
  );

  const allItems = useMemo(() => {
    const extras = extraItemsAsMenu;
    const menu = menuItems.map((m) => ({
      ...m,
      finalPrice: m.finalPrice ?? m.price,
      isExtra: false,
    }));
    return [...menu, ...extras];
  }, [menuItems, extraItemsAsMenu]);

  const filteredItems = useMemo(() => {
    let items;
    if (selectedCategory === 'all') {
      items = allItems;
    } else {
      const cat = categories.find(
        (c) => c.label === selectedCategory || c.id?.toString() === selectedCategory
      );
      if (!cat) items = allItems;
      else if (selectedCategory === 'Other') items = extraItemsAsMenu;
      else
        items = allItems.filter(
          (i) => i.categoryIds?.includes(cat.id) || (i.isExtra && !i.categoryIds?.length)
        );
    }
    const q = (searchQuery || '').trim().toLowerCase();
    if (q) {
      items = items.filter((i) => (i.name || '').toLowerCase().includes(q));
    }
    return items;
  }, [allItems, selectedCategory, categories, extraItemsAsMenu, searchQuery]);

  const categoryOptions = useMemo(
    () => [{ key: 'all', label: 'All' }, ...categories.map((c) => ({ key: c.label, label: c.label }))],
    [categories]
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, i) => sum + (i.totalPrice ?? i.price * i.quantity), 0),
    [cart]
  );

  const handleAddOrder = (item) => {
    const price = item.finalPrice ?? item.price;
    setCart((prev) => {
      const existing = prev.find(
        (c) => c.id === item.id && (!c.extras?.length || c.extras.length === 0)
      );
      if (existing) {
        return prev.map((c) =>
          c.id === item.id && (!c.extras?.length || c.extras.length === 0)
            ? {
                ...c,
                quantity: c.quantity + 1,
                totalPrice: (c.quantity + 1) * price,
              }
            : c
        );
      }
      return [
        ...prev,
        {
          ...item,
          quantity: 1,
          extras: [],
          totalPrice: price,
          cartId: Date.now() + Math.random(),
        },
      ];
    });
  };

  const handleUpdateQuantity = (cartId, delta) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.cartId !== cartId) return c;
          const qty = Math.max(1, c.quantity + delta);
          const price = c.finalPrice ?? c.price;
          return { ...c, quantity: qty, totalPrice: qty * price };
        })
        .filter((c) => c.quantity > 0)
    );
  };

  const handleRemoveFromCart = (cartId) => {
    setCart((prev) => prev.filter((c) => c.cartId !== cartId));
  };

  const handleConfirmOrder = () => {
    if (cart.length === 0) return;
    setShowConfirmModal(true);
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const orderData = {
        tableNumber: tableNumber ? Number(tableNumber) : null,
        items: cart.map((c) => ({
          id: c.id,
          name: c.name,
          quantity: c.quantity,
          price: c.price,
          finalPrice: c.finalPrice ?? c.price,
          extras: c.extras || [],
          priority: 'Medium',
        })),
        total: cartTotal,
        priority: 'Medium',
        totalPrepTime: 15,
        status: 'processing',
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      const data = await res.json();

      if (data.success) {
        await fetch('/api/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'order_update', data: data.order }),
        });
        setSuccessMessage(`Order #${data.order.id.slice(-4)} created successfully`);
        setCart([]);
        setTableNumber('');
        setShowConfirmModal(false);
        setPrintOrder(data.order);
        setTimeout(() => setSuccessMessage(''), 3000);
        setTimeout(() => setPrintOrder(null), 1000);
      } else {
        alert(data.error || 'Failed to create order');
      }
    } catch (err) {
      console.error('Error creating order:', err);
      alert('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400" />
      </div>
    );
  }

  return (
    <div>
      <OrderReceipt order={printOrder} variant="processing" />
      <div className="print:hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 lg:mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Create Order</h1>
        {successMessage && (
          <div className="px-4 py-2 bg-green-900/40 border border-green-700 rounded-lg text-green-200 text-sm">
            {successMessage}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search items by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          aria-label="Search items"
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categoryOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSelectedCategory(opt.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === opt.key
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Items grid */}
      {searchQuery.trim() && (
        <p className="mb-3 text-sm text-gray-400">
          Search results for &quot;{searchQuery.trim()}&quot; ({filteredItems.filter((i) => i.status !== 'Not Available' && i.status !== 'Unavailable').length} items)
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-24">
        {filteredItems
          .filter((i) => i.status !== 'Not Available' && i.status !== 'Unavailable')
          .map((item) => {
            const price = item.finalPrice ?? item.price;
            const hasDiscount =
              item.discount &&
              (item.discount.type === 'percentage' || item.discount.type === 'price');
            return (
              <div
                key={item.id}
                className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors flex flex-col"
              >
                <div className="relative h-36 sm:h-40 overflow-hidden">
                  <img
                    src={item.images?.[0] || fallbackImage(item.name)}
                    alt={item.name}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = fallbackImage(item.name);
                    }}
                  />
                  {item.isExtra && (
                    <span className="absolute top-2 left-2 bg-amber-500/90 text-xs font-bold px-2 py-0.5 rounded-full text-white">
                      Add-on
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="absolute top-2 right-2 bg-red-500/90 text-xs font-bold px-2 py-0.5 rounded-full text-white">
                      OFF
                    </span>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="font-semibold text-white mb-1 line-clamp-2">{item.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                    {item.stock !== undefined && item.stock !== null && (
                      <span className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5" />
                        Stock: {item.stock}
                      </span>
                    )}
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-lg font-bold text-green-400">
                      {Number(price)} ৳
                    </span>
                    <button
                      onClick={() => handleAddOrder(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Order
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Fixed bottom cart bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 z-20">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-indigo-400" />
            <span className="text-white font-semibold">
              {cart.length} item{cart.length !== 1 ? 's' : ''} · {cartTotal.toLocaleString()}{' '}
            ৳
            </span>
          </div>
          <button
            onClick={handleConfirmOrder}
            disabled={cart.length === 0}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Confirm Order
          </button>
        </div>
      </div>

      <ConfirmOrderModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        cart={cart}
        tableNumber={tableNumber}
        setTableNumber={setTableNumber}
        cartTotal={cartTotal}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveFromCart={handleRemoveFromCart}
        onSubmit={handleSubmitOrder}
        submitting={submitting}
      />
      </div>
    </div>
  );
}
