'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChefHat, Search, Utensils, Clock, DollarSign, X, ShoppingCart, Minus, Plus, ListOrdered, ChevronUp, ChevronDown, CheckCircle, ConciergeBell, CookingPot, Droplets } from 'lucide-react';

import Header from './Header';
import MenuCard from './MenuCard';
import DetailModal from './DetailModal';
import QueueModal from './QueueModal';
import UserEditOrderModal from './UserEditOrderModal';
import OrderConfirmationModal from './OrderConfirmationModal';
import CategorySelector from './CategorySelector';
import SearchBar from './SearchBar';
import NotificationPanel from './NotificationPanel';

const MENU_DATA_PATH = '/api/menu';
const EXTRAS_DATA_PATH = '/api/extras';
const CATEGORIES_DATA_PATH = '/api/categories';

const priorityStyles = {
    Low: { text: 'text-yellow-400', bg: 'bg-yellow-400/20', icon: ChevronDown },
    Medium: { text: 'text-indigo-400', bg: 'bg-indigo-400/20', icon: ListOrdered },
    High: { text: 'text-red-500', bg: 'bg-red-500/20', icon: ChevronUp },
};

const statusStyles = {
    'Pending': { icon: ConciergeBell, text: 'text-yellow-400', bg: 'bg-yellow-900', label: 'Pending' },
    'In Progress': { icon: CookingPot, text: 'text-indigo-400', bg: 'bg-indigo-900', label: 'In Progress' },
    'Ready for Pickup': { icon: CheckCircle, text: 'text-green-400', bg: 'bg-green-900', label: 'Ready' },
};

const RestaurantName = "FamDine";

/**
 * Main Application Component
 */
const App = ({ tableNumber: propTableNumber }) => {
  const [tableNumber, setTableNumber] = useState(propTableNumber || null);
  const [menuItems, setMenuItems] = useState([]);
  const [extraItems, setExtraItems] = useState([]);
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New State for Modals and Cart
  const [cart, setCart] = useState([]);
  const [queue, setQueue] = useState([]); // 4. Add queue state
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false); // 3. Queue modal state
  const [isUserEditModalOpen, setIsUserEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isOrderSuccessModalOpen, setIsOrderSuccessModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [notifications, setNotifications] = useState([]); // Stored notifications (waiter, order status, etc.)
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

  const [orderStatus, setOrderStatus] = useState({}); // Track order status updates

  const addNotification = useCallback((type, body) => {
    setNotifications(prev => [...prev, { id: `n-${Date.now()}-${Math.random().toString(36).slice(2)}`, type, body, time: new Date().toISOString() }]);
  }, []);

  // Update table number if prop changes
  useEffect(() => {
    if (propTableNumber) {
      setTableNumber(propTableNumber);
    }
  }, [propTableNumber]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Fetch user's orders from API
  const fetchUserOrders = useCallback(async () => {
    if (!tableNumber) return;
    
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      if (data.success) {
        // Filter orders for this table and exclude cancelled and completed (desk emptied)
        const userOrders = data.orders
          .filter(order => order.tableNumber === tableNumber && order.status !== 'cancelled' && order.status !== 'completed')
          .map(order => {
            const prepMins = order.totalPrepTime ?? 15;
            return {
              orderId: order.id,
              items: order.items || [],
              total: order.total || 0,
              orderPriority: order.priority || 'Medium',
              status: order.status === 'pending' ? 'Pending' : 
                     order.status === 'accepted' || order.status === 'processing' ? 'In Progress' : 
                     order.status === 'completed' ? 'Ready for Pickup' : 'Pending',
              timeAdded: new Date(order.createdAt).getTime(),
              acceptedAt: order.acceptedAt ? new Date(order.acceptedAt).getTime() : null, // when status changed to in progress (stored on server)
              estimatedTotalTimeSec: prepMins * 60,
              tableNumber: order.tableNumber,
            };
          });
        
        setQueue(userOrders);
      }
    } catch (error) {
      console.error('Error fetching user orders:', error);
    }
  }, [tableNumber]);

  // Fetch orders on mount and when table number changes
  useEffect(() => {
    if (tableNumber) {
      fetchUserOrders();
      // Poll every 5 seconds as backup
      const interval = setInterval(fetchUserOrders, 5000);
      return () => clearInterval(interval);
    }
  }, [tableNumber, fetchUserOrders]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!tableNumber) return;
    
    const eventSource = new EventSource('/api/websocket');
    
    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'order_update') {
          const order = message.data;
          
          // Only update if it's for this table
          if (order.tableNumber === tableNumber) {
            setOrderStatus(prev => ({
              ...prev,
              [order.id]: order.status,
            }));
            
            // Update queue
            setQueue(prevQueue => {
              const existingIndex = prevQueue.findIndex(q => q.orderId === order.id);
              
              // Remove cancelled or completed orders (desk emptied); clear notifications when order completed
              if (order.status === 'cancelled' || order.status === 'completed') {
                if (order.status === 'completed') setNotifications([]);
                return prevQueue.filter(q => q.orderId !== order.id);
              }
              
              const statusMap = {
                pending: 'Pending',
                accepted: 'In Progress',
                processing: 'In Progress',
                completed: 'Ready for Pickup',
              };
              
              const prepMins = order.totalPrepTime ?? 15;
              const acceptedAt = order.acceptedAt ? new Date(order.acceptedAt).getTime() : null;
              if (existingIndex >= 0) {
                return prevQueue.map((q, idx) => 
                  idx === existingIndex
                    ? { ...q, status: statusMap[order.status] || q.status, estimatedTotalTimeSec: prepMins * 60, acceptedAt: acceptedAt ?? q.acceptedAt }
                    : q
                );
              } else {
                return [...prevQueue, {
                  orderId: order.id,
                  items: order.items || [],
                  total: order.total || 0,
                  orderPriority: order.priority || 'Medium',
                  status: statusMap[order.status] || 'Pending',
                  timeAdded: new Date(order.createdAt).getTime(),
                  acceptedAt,
                  estimatedTotalTimeSec: prepMins * 60,
                  tableNumber: order.tableNumber,
                }];
              }
            });
            
            // Show notification
            if ('Notification' in window && Notification.permission === 'granted') {
              const statusMessages = {
                accepted: 'Order Accepted!',
                processing: 'Order Being Prepared',
                completed: 'Order Ready for Pickup!',
                cancelled: 'Order Cancelled',
              };
              
              new Notification(statusMessages[order.status] || 'Order Updated', {
                body: `Order #${order.id.slice(-4)} - ${order.status}`,
                icon: '/favicon.ico',
              });
            }
            
            setToastMessage(`Order #${order.id.slice(-4)}: ${order.status}`);
            (() => {
              const formatElapsed = (sec) => { const s = Math.max(0, Math.floor(sec)); const m = Math.floor(s / 60); return `${m}:${(s % 60).toString().padStart(2, '0')}`; };
              const now = Date.now();
              const created = new Date(order.createdAt).getTime();
              const accepted = order.acceptedAt ? new Date(order.acceptedAt).getTime() : null;
              let timeLabel = '';
              if (order.status === 'pending') timeLabel = `${formatElapsed((now - created) / 1000)} in queue`;
              else if (order.status === 'accepted' || order.status === 'processing') timeLabel = `${formatElapsed((now - (accepted || created)) / 1000)} in progress`;
              else timeLabel = order.status;
              const statusLabel = order.status === 'pending' ? 'Pending' : order.status === 'accepted' || order.status === 'processing' ? 'In Progress' : order.status;
              addNotification('order_update', `Order #${order.id.slice(-4)}: ${statusLabel} — ${timeLabel}`);
            })();
          }
        } else if (message.type === 'new_order') {
          // Refresh orders when new order is created
          if (message.data.tableNumber === tableNumber) {
            fetchUserOrders();
          }
        } else if (message.type === 'water_coming' && message.data?.tableNumber === tableNumber) {
          setToastMessage('Water is on the way!');
          addNotification('water_coming', 'Water is on the way.');
        } else if (message.type === 'heartbeat') {
          // Keep connection alive
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Reconnect after 3 seconds
      setTimeout(() => {
        eventSource.close();
      }, 3000);
    };
    
    return () => {
      eventSource.close();
    };
  }, [tableNumber, fetchUserOrders, addNotification]);

  useEffect(() => {
    const loadMenuData = async () => {
      setIsMenuLoading(true);
      setDataError(null);
      try {
        const [menuResponse, extrasResponse, categoriesResponse] = await Promise.all([
          fetch(MENU_DATA_PATH),
          fetch(EXTRAS_DATA_PATH),
          fetch(CATEGORIES_DATA_PATH),
        ]);

        if (!menuResponse.ok || !extrasResponse.ok || !categoriesResponse.ok) {
          throw new Error('Failed to fetch menu data');
        }

        const menuJson = await menuResponse.json();
        const extrasJson = await extrasResponse.json();
        const categoriesJson = await categoriesResponse.json();

        setMenuItems(menuJson.menu ?? []);
        setExtraItems(extrasJson.extras ?? []);
        
        // Ensure "Other" category exists for extras that don't match any category
        const categoriesList = categoriesJson.categories ?? [];
        const hasOtherCategory = categoriesList.some(cat => 
          cat.label.toLowerCase() === 'other' || cat.id === 'other' || cat.label === 'Other'
        );
        
        // If "Other" category doesn't exist, add it
        if (!hasOtherCategory) {
          const maxId = categoriesList.length > 0 
            ? Math.max(...categoriesList.map(cat => cat.id || 0))
            : 0;
          categoriesList.push({
            id: maxId + 1,
            label: 'Other'
          });
        }
        
        setCategories(categoriesList);
      } catch (error) {
        console.error('Unable to load menu data', error);
        setDataError('Unable to load the menu right now. Please try again soon.');
      } finally {
        setIsMenuLoading(false);
      }
    };

    loadMenuData();
  }, []);

  const menuCategories = useMemo(() => {
    return [{ key: 'all', label: 'All' }, ...categories.map(cat => ({ key: cat.label, label: cat.label }))];
  }, [categories]);

  useEffect(() => {
    if (selectedCategory === 'all') return;
    const exists = menuCategories.some(cat => cat.key === selectedCategory);
    if (!exists) {
      setSelectedCategory('all');
    }
  }, [menuCategories, selectedCategory]);

  const extraItemsAsMenuShape = useMemo(() => extraItems.map(extra => ({
    id: `extra-${extra.id}`,
    name: extra.name,
    price: Number(extra.price) || 0,
    finalPrice: Number(extra.price) || 0,
    status: extra.status || 'Available',
    images: extra.images || [],
    time: 0,
    categoryIds: [],
    tag: null,
    mainItems: [],
    uses: '',
    extraItemIds: [],
    discount: null,
    isExtra: true,
  })), [extraItems]);

  const filteredMenu = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    const hasSearch = q.length > 0;

    // When searching: search across ALL menu items and ALL extras, show combined results
    if (hasSearch) {
      const matchingMenu = menuItems.filter(item =>
        item.name.toLowerCase().includes(q)
      );
      const matchingExtras = extraItemsAsMenuShape.filter(item =>
        item.name.toLowerCase().includes(q)
      );
      const combined = [...matchingMenu, ...matchingExtras];
      return combined.sort((a, b) => (b.status === 'Available' ? 1 : 0) - (a.status === 'Available' ? 1 : 0));
    }

    // No search: category-based filter
    let items = [];
    if (selectedCategory === 'Other') {
      items = [...extraItemsAsMenuShape];
    } else if (selectedCategory === 'all') {
      items = [...menuItems];
    } else {
      const selectedCat = categories.find(cat => cat.label === selectedCategory);
      if (selectedCat) {
        items = menuItems.filter(item => item.categoryIds && item.categoryIds.includes(selectedCat.id));
      }
    }
    return items.sort((a, b) => (b.status === 'Available' ? 1 : 0) - (a.status === 'Available' ? 1 : 0));
  }, [menuItems, selectedCategory, searchQuery, categories, extraItemsAsMenuShape]);

  // Cart logic
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const itemTotal = item.totalPrice ?? (item.price * (item.quantity || 1));
      return sum + itemTotal;
    }, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // --- Cart and Queue Handlers ---

  const handleShowDetails = useCallback((item) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setSelectedItem(null);
    setIsDetailModalOpen(false);
  }, []);

  const handleAddToCart = useCallback((item) => {
    const finalPrice = item.finalPrice !== undefined ? item.finalPrice : item.price;
    
    setCart(prevCart => {
      // Find existing item with same id, priority, isExtra flag, and no extras
      const existingIndex = prevCart.findIndex(cartItem => 
        cartItem.id === item.id && 
        cartItem.priority === item.priority && 
        Boolean(cartItem.isExtra) === Boolean(item.isExtra) && // Both should have same isExtra value (true or false/undefined)
        cartItem.extras.length === 0 &&
        item.extras.length === 0
      );

      if (existingIndex !== -1) {
        // Item already exists, merge quantities
        const existing = prevCart[existingIndex];
        const newQuantity = existing.quantity + item.quantity;
        const newTotal = finalPrice * newQuantity;
        const updatedCart = prevCart.map((cartItem, index) =>
          index === existingIndex
            ? { ...cartItem, quantity: newQuantity, totalPrice: newTotal }
            : cartItem
        );
        setToastMessage(`Added ${item.quantity}x ${item.name} to order! (Total: ${newQuantity}x)`);
        return updatedCart;
      } else {
        // New item
        setToastMessage(`Added ${item.quantity}x ${item.name} with ${item.priority} priority!`);
        return [...prevCart, item];
      }
    });
  }, []);

  const handleDirectAddToCart = useCallback((item) => {
    const finalPrice = item.finalPrice !== undefined ? item.finalPrice : item.price;

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(cartItem => cartItem.id === item.id && cartItem.extras.length === 0);

      if (existingIndex !== -1) {
        // Item already exists, increase quantity
        const existing = prevCart[existingIndex];
        const newQuantity = existing.quantity + 1;
        const newTotal = finalPrice * newQuantity;
        const updatedCart = prevCart.map((cartItem, index) =>
          index === existingIndex
            ? { ...cartItem, quantity: newQuantity, totalPrice: newTotal }
            : cartItem
        );
        setToastMessage(`Added 1x ${item.name} to order! (Total: ${newQuantity}x)`);
        return updatedCart;
      } else {
        // New item
        const newCartItem = {
          ...item,
          quantity: 1,
          extras: [],
          totalPrice: finalPrice,
          priority: 'Medium',
          cartId: Date.now() + Math.random(),
        };
        setToastMessage(`Added 1x ${item.name} to order!`);
        return [...prevCart, newCartItem];
      }
    });
  }, []);

  const handleRemoveCartItem = useCallback((cartId) => {
    setCart(prevCart => prevCart.filter(item => item.cartId !== cartId));
  }, []);

  const handleUpdateCartItemQuantity = useCallback((cartId, delta) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.cartId !== cartId) return item;
      const nextQuantity = Math.max(1, item.quantity + delta);
      if (nextQuantity === item.quantity) return item;
      const itemPrice = item.finalPrice !== undefined ? item.finalPrice : item.price;
      const extrasCost = item.extras?.reduce((sum, extra) => sum + (extra.price * extra.qty), 0) || 0;
      const nextTotal = itemPrice * nextQuantity + extrasCost;
      return { ...item, quantity: nextQuantity, totalPrice: nextTotal };
    }));
  }, []);

  const handleUpdateCartItemPriority = useCallback((cartId, label) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.cartId !== cartId) return item;
      const nextPriority = label === 'Fast' ? 'High' : 'Medium';
      return { ...item, priority: nextPriority };
    }));
  }, []);

  const handleAddExtraToCartItem = useCallback((cartId, extra) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.cartId !== cartId || item.isExtra) return item;
      const existing = item.extras?.find(e => e.id === extra.id) || null;
      const newExtras = existing
        ? item.extras.map(e => e.id === extra.id ? { ...e, qty: e.qty + 1 } : e)
        : [...(item.extras || []), { id: extra.id, name: extra.name, price: extra.price, qty: 1 }];
      const itemPrice = item.finalPrice !== undefined ? item.finalPrice : item.price;
      const extrasCost = newExtras.reduce((sum, e) => sum + e.price * e.qty, 0);
      return { ...item, extras: newExtras, totalPrice: itemPrice * item.quantity + extrasCost };
    }));
  }, []);

  const handleUpdateExtraQuantity = useCallback((cartId, extraId, delta) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.cartId !== cartId || !item.extras?.length) return item;
      const extra = item.extras.find(e => e.id === extraId);
      if (!extra) return item;
      const newQty = extra.qty + delta;
      const newExtras = newQty <= 0
        ? item.extras.filter(e => e.id !== extraId)
        : item.extras.map(e => e.id === extraId ? { ...e, qty: newQty } : e);
      const itemPrice = item.finalPrice !== undefined ? item.finalPrice : item.price;
      const extrasCost = newExtras.reduce((sum, e) => sum + e.price * e.qty, 0);
      return { ...item, extras: newExtras, totalPrice: itemPrice * item.quantity + extrasCost };
    }));
  }, []);

  // 4. Refactored handlePlaceOrder to create order via API
  const handlePlaceOrder = useCallback(async () => {
    if (!tableNumber) {
      alert('Table number is required. Please access the menu with ?table=X in the URL.');
      return;
    }

    try {
      setIsOrderModalOpen(false);
      
      // Calculate total preparation time based on items (simplified)
      const totalPrepTime = cart.reduce((sum, item) => sum + ((item.time || 0) * item.quantity), 0);

      const priorityRank = { Low: 1, Medium: 2, High: 3 };
      const highestPriority = cart.reduce((current, item) => {
        const value = priorityRank[item.priority || 'Medium'] || 2;
        return value > current ? value : current;
      }, 2);
      const highestPriorityLabel = Object.keys(priorityRank).find(key => priorityRank[key] === highestPriority) || 'Medium';

      // Collect device info for order tracking (merged with server-side IP/MAC)
      const deviceInfo = typeof navigator !== 'undefined' ? {
        timezone: Intl?.DateTimeFormat?.()?.resolvedOptions?.()?.timeZone || null,
        screenWidth: window?.screen?.width || null,
        screenHeight: window?.screen?.height || null,
        platform: navigator?.platform || null,
        language: navigator?.language || null,
        cookieEnabled: navigator?.cookieEnabled ?? null,
      } : {};

      // Create order via API
      const orderData = {
        tableNumber: tableNumber,
        deviceInfo,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          finalPrice: item.finalPrice || item.price,
          extras: item.extras || [],
          priority: item.priority || 'Medium',
        })),
        total: cartTotal,
        priority: highestPriorityLabel,
        totalPrepTime: totalPrepTime || 15, // minutes for queue countdown (persisted, no reset on reload)
        customerInfo: {},
        notes: '',
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();
      
      if (result.success) {
        // new_order is broadcast by orders API (owner only)

        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Order Placed!', {
            body: `Order #${result.order.id.slice(-4)} placed for Table ${tableNumber}`,
            icon: '/favicon.ico',
          });
        }

        // Refresh orders to get the new order from API
        await fetchUserOrders();
        
        setCart([]); // Clear cart after placing order
        setToastMessage(`Order #${result.order.id.slice(-4)} placed! Added to queue.`);
        addNotification('order_placed', `Order #${result.order.id.slice(-4)} placed. Added to queue.`);
        setIsOrderSuccessModalOpen(true);
      } else {
        alert(result.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('An error occurred while placing your order');
    }
  }, [cart, cartTotal, tableNumber, fetchUserOrders, addNotification]);

  const handleFinishOrder = useCallback(async (orderId) => {
    try {
      // Mark order as done (completed) via API
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: orderId,
          status: 'completed',
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Remove from queue (will be updated via WebSocket)
        setQueue(prevQueue => prevQueue.filter(order => order.orderId !== orderId));
        setToastMessage(`Order #${orderId.slice(-4)} picked up!`);
      }
    } catch (error) {
      console.error('Error finishing order:', error);
    }
  }, []);

  const handleEditOrder = useCallback((order) => {
    setEditingOrder(order);
    setIsUserEditModalOpen(true);
    // Optionally close QueueModal or keep it open behind? 
    // It's better to close it or keep it. Since both are modals, z-index matters.
    // Let's close QueueModal to avoid stacking issues unless we handle z-index well.
    // But user might want to go back.
    // For simplicity, let's keep QueueModal open if it was open, or close it.
    // If we use high z-index for EditModal, it's fine.
    // QueueModal has z-50. UserEditOrderModal has z-[60]. So it will be on top.
  }, []);

  const handleSaveEditedOrder = useCallback(async (orderId, newItems, newTotal) => {
    try {
      if (newItems.length === 0) {
        // If all items removed, cancel the order
        if (confirm('All items removed. Do you want to cancel this order?')) {
          const response = await fetch(`/api/orders?id=${orderId}`, {
            method: 'DELETE',
          });
          const data = await response.json();
          if (data.success) {
             setToastMessage(`Order #${orderId.slice(-4)} cancelled.`);
             setIsUserEditModalOpen(false);
             setEditingOrder(null);
             // Queue update will happen via WebSocket or fetchUserOrders
             fetchUserOrders();
          }
        }
        return;
      }

      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: orderId,
          items: newItems,
          total: newTotal,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setToastMessage(`Order #${orderId.slice(-4)} updated!`);
        setIsUserEditModalOpen(false);
        setEditingOrder(null);
        
        fetchUserOrders();
      } else {
        alert(data.error || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('An error occurred while updating the order');
    }
  }, [fetchUserOrders]);

  const handleCallWater = useCallback(async () => {
    if (!tableNumber) return;
    try {
      await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'call_waiter',
          data: { tableNumber },
          targetRoles: ['owner', 'waiter'],
        }),
      });
      setToastMessage('Calling for water...');
      addNotification('call_waiter', 'You called for water.');
    } catch (e) {
      setToastMessage('Request failed. Try again.');
    }
  }, [tableNumber, addNotification]);

  // --- Helper Effects ---

  // Manage Toast messages
  useEffect(() => {
    if (toastMessage) {
        const timer = setTimeout(() => setToastMessage(null), 3000);
        return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Close order success modal after a few seconds
  useEffect(() => {
    if (isOrderSuccessModalOpen) {
        const timer = setTimeout(() => setIsOrderSuccessModalOpen(false), 3000);
        return () => clearTimeout(timer);
    }
  }, [isOrderSuccessModalOpen]);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans antialiased pb-30">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20"> {/* pb-20 for fixed bottom navigation */}
        
        {/* 1 & 2: Header — "Fam" + notification icon */}
        <Header
          title="Fam"
          onNotificationClick={() => setNotificationPanelOpen(true)}
          notificationCount={notifications.length}
        />

        {/* 3: Search Bar */}
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        {/* 4: Category Selector */}
        <div className="mb-6">
          <CategorySelector
            menuCategories={menuCategories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        </div>

        {/* 5: Menu Card Display */}
        {dataError ? (
          <div className="text-center py-12 bg-red-900/40 border border-red-700 rounded-xl text-red-200">
            <Utensils className="w-10 h-10 mx-auto mb-3 text-red-300" />
            <p className="text-lg font-semibold">Menu unavailable</p>
            <p className="text-sm">{dataError}</p>
          </div>
        ) : isMenuLoading ? (
          <div className="text-center py-16 bg-gray-800 rounded-xl text-gray-400 animate-pulse">
            <ChefHat className="w-12 h-12 mx-auto mb-4 text-gray-500" />
            <p className="text-lg font-medium">Preparing your menu...</p>
            <p className="text-sm text-gray-500">Please wait a moment.</p>
          </div>
        ) : filteredMenu.length > 0 ? (
          <>
            {searchQuery.trim() && (
              <div className="mb-4 text-center sm:text-left">
                <p className="text-sm text-gray-400">
                  Search results for <span className="text-indigo-300 font-medium">&quot;{searchQuery.trim()}&quot;</span>
                  {' '}({filteredMenu.length} {filteredMenu.length === 1 ? 'item' : 'items'})
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 w-full min-w-0">
              {filteredMenu.map((item) => (
                <div key={item.id} className="min-w-0 w-full">
                  <MenuCard 
                    item={item} 
                    onShowDetails={handleShowDetails}
                    onAddToCartDirectly={handleDirectAddToCart}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-gray-800 rounded-xl text-gray-400">
            <Utensils className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-lg font-medium">
              {searchQuery.trim() ? 'No items match your search.' : 'No dishes found.'}
            </p>
            <p className="text-sm">
              {searchQuery.trim() ? 'Try a different search term.' : 'Try adjusting your category or search term.'}
            </p>
          </div>
        )}
      </div>

      {/* Call Waiter — fixed bottom FAB */}
      {tableNumber && (
        <button
          type="button"
          onClick={handleCallWater}
          className="fixed bottom-30 right-4 sm:right-6 z-20 flex items-center gap-2 px-4 py-3 rounded-full bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-white font-medium text-sm shadow-lg shadow-cyan-900/30 hover:shadow-xl hover:shadow-cyan-900/40 transition-all duration-200 hover:scale-105 active:scale-95 border border-cyan-400/30"
          aria-label="Call waiter"
        >
          <ConciergeBell className="w-5 h-5 shrink-0" />
          <span>Call Waiter</span>
        </button>
      )}

      {/* 3. Fixed Bottom Navigation (with Queue button) */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-4xl mx-auto bg-gray-800 border-t border-gray-700 shadow-2xl p-3 z-10 rounded-t-2xl">
        <div className="flex justify-around items-center">
          <button className="text-indigo-400 flex flex-col items-center text-xs p-1">
            <Utensils className="w-6 h-6" />
            <span className="mt-1">Menu</span>
          </button>
          
          <button 
            className="text-gray-400 hover:text-green-400 flex flex-col items-center text-xs p-1 relative disabled:opacity-50"
            onClick={() => cartItemCount > 0 && setIsOrderModalOpen(true)}
            disabled={cartItemCount === 0}
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="mt-1">Order</span>
            {cartItemCount > 0 && (
              <span className="absolute top-0 right-0 -mt-1 -mr-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>

          {/* 3. Queue Button */}
          <button 
            className="text-gray-400 hover:text-red-400 flex flex-col items-center text-xs p-1 relative disabled:opacity-50"
            onClick={() => setIsQueueModalOpen(true)}
          >
            <ListOrdered className="w-6 h-6" />
            <span className="mt-1">Queue</span>
            {queue.length > 0 && (
              <span className="absolute top-0 right-0 -mt-1 -mr-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {queue.length}
              </span>
            )}
          </button>
        </div>
      </footer>

      {/* 2. Item Detail Modal */}
      {isDetailModalOpen && (
        <DetailModal
          item={selectedItem}
          extraItems={extraItems}
          priorityStyles={priorityStyles}
          onClose={handleCloseDetailModal}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* 4. Order Confirmation Modal */}
      {isOrderModalOpen && (
        <OrderConfirmationModal
            cart={cart}
            total={cartTotal}
            priorityStyles={priorityStyles}
            menuItems={menuItems}
            extraItems={extraItems}
            onRemoveItem={handleRemoveCartItem}
            onUpdateItemQuantity={handleUpdateCartItemQuantity}
            onUpdateItemPriority={handleUpdateCartItemPriority}
            onAddExtraToCartItem={handleAddExtraToCartItem}
            onUpdateExtraQuantity={handleUpdateExtraQuantity}
            onClose={() => setIsOrderModalOpen(false)}
            onConfirm={handlePlaceOrder}
            tableNumber={tableNumber}
        />
      )}
      
      {/* 5. Queue Modal */}
      {isQueueModalOpen && (
          <QueueModal
            queue={queue}
            statusStyles={statusStyles}
            priorityStyles={priorityStyles}
            onClose={() => setIsQueueModalOpen(false)}
            onFinishOrder={handleFinishOrder}
            onEditOrder={handleEditOrder}
          />
        )}

      {/* Notification panel (waiter, order status, etc.) */}
      <NotificationPanel
        notifications={notifications}
        isOpen={notificationPanelOpen}
        onClose={() => setNotificationPanelOpen(false)}
      />

      {/* User Edit Order Modal */}
        <UserEditOrderModal 
          order={editingOrder}
          menuItems={menuItems}
          extraItems={extraItems}
          isOpen={isUserEditModalOpen}
          onClose={() => {
            setIsUserEditModalOpen(false);
            setEditingOrder(null);
          }}
          onSave={handleSaveEditedOrder}
        />

        {/* Toast — top, professional */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md transition-all duration-300">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800/95 backdrop-blur-sm border border-gray-600/80 text-white shadow-xl shadow-black/40">
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center ring-2 ring-green-500/30">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-sm font-medium text-gray-100 flex-1 min-w-0">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Order Success Toast — top, professional */}
      {isOrderSuccessModalOpen && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md transition-all duration-300">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800/95 backdrop-blur-sm border border-indigo-500/50 text-white shadow-xl shadow-black/40">
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center ring-2 ring-indigo-500/30">
              <CheckCircle className="w-5 h-5 text-indigo-400" />
            </div>
            <p className="text-sm font-medium text-gray-100">Order placed successfully. Processing now.</p>
          </div>
        </div>
      )}

      {/* Global Style for Scrollbar hide (helps mobile aesthetic) */}
      <style>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  );
};

export default App;
