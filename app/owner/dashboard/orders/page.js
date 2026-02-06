'use client';

import { useState, useEffect } from 'react';
import { getTodayDateString } from '@/lib/utils';
import OrderReceipt from './components/OrderReceipt';
import StatusFilter from './components/StatusFilter';
import TableStatus from './components/TableStatus';
import OrderNotification from './components/OrderNotification';
import OrderCard from './components/OrderCard';
import AddItemModal from './components/AddItemModal';
import OrderListEmptyState from './components/OrderListEmptyState';

export default function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [newOrderNotification, setNewOrderNotification] = useState(null);
  const [tables, setTables] = useState(Array.from({ length: 10 }, (_, i) => ({ number: i + 1, status: 'empty' })));
  const [statusFilter, setStatusFilter] = useState('pending'); // Default to pending
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [mutedOrders, setMutedOrders] = useState(new Set());
  const [menuItems, setMenuItems] = useState([]);
  const [extraItems, setExtraItems] = useState([]);
  
  const [printOrder, setPrintOrder] = useState(null);

  // Print Logic
  useEffect(() => {
    if (printOrder) {
      setTimeout(() => {
        window.print();
      }, 100);
    }
  }, [printOrder]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/websocket');
    
    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'new_order') {
          // Show popup notification
          setNewOrderNotification(message.data);
          
          // Play notification sound (if permission granted)
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Order!', {
              body: `Table ${message.data.tableNumber} - Order #${message.data.id.slice(-4)}`,
              icon: '/favicon.ico',
              tag: message.data.id,
            });
          }
          
          // Refresh orders
          fetchOrders();
        } else if (message.type === 'order_update') {
          // Refresh orders when updated
          fetchOrders();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return () => {
      eventSource.close();
    };
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    let interval;
    const shouldPlay = !!newOrderNotification && !mutedOrders.has(newOrderNotification.id);
    if (shouldPlay) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const playBeep = () => {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
        setTimeout(() => {
          ctx.close();
        }, 600);
      };
      playBeep();
      interval = setInterval(playBeep, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [newOrderNotification, mutedOrders]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders?date=' + getTodayDateString());
      const data = await response.json();
      if (data.success) {
        // Filter out cancelled orders for display
        const activeOrders = data.orders.filter(order => order.status !== 'cancelled');
        setOrders(activeOrders);
        
        // Update table statuses
        updateTableStatuses(activeOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTableStatuses = (activeOrders) => {
    const newTables = Array.from({ length: 10 }, (_, i) => {
      const tableNumber = i + 1;
      const order = activeOrders.find(o => o.tableNumber === tableNumber && ['pending', 'accepted', 'processing'].includes(o.status));
      return {
        number: tableNumber,
        status: order ? 'processing' : 'empty',
        orderId: order?.id,
      };
    });
    setTables(newTables);
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Poll every 5 seconds as backup
    return () => clearInterval(interval);
  }, []);

  // Fetch menu and extras for add item modal
  useEffect(() => {
    const fetchMenuAndExtras = async () => {
      try {
        const [menuRes, extrasRes] = await Promise.all([
          fetch('/api/menu'),
          fetch('/api/extras')
        ]);
        const menuData = await menuRes.json();
        const extrasData = await extrasRes.json();
        if (menuData.success) setMenuItems(menuData.menu || []);
        if (extrasData.success) setExtraItems(extrasData.extras || []);
      } catch (error) {
        console.error('Error fetching menu/extras:', error);
      }
    };
    fetchMenuAndExtras();
  }, []);

  const handleEdit = (order) => {
    setEditingOrder(order.id);
    setEditFormData({
      items: order.items.map(item => ({ ...item })),
      total: order.total,
      tableNumber: order.tableNumber,
    });
  };

  const handleSaveEdit = async () => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingOrder,
          items: editFormData.items,
          total: editFormData.total,
          tableNumber: editFormData.tableNumber,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Clear notification if it matches
        if (newOrderNotification && newOrderNotification.id === editingOrder) {
          setNewOrderNotification(null);
        }

        // Show print dialog
        setPrintOrder(data.order);

        // Broadcast update
        await fetch('/api/broadcast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'order_update',
            data: data.order,
          }),
        });

        setEditingOrder(null);
        setEditFormData(null);
        fetchOrders();
      } else {
        alert(data.error || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('An error occurred');
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      // Accept and directly set to processing
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: orderId,
          status: 'processing',
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Clear notification if it matches
        if (newOrderNotification && newOrderNotification.id === orderId) {
          setNewOrderNotification(null);
        }
        
        // Set print order to trigger print receipt
        setPrintOrder(data.order);

        // Broadcast update
        await fetch('/api/broadcast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'order_update',
            data: data.order,
          }),
        });

        fetchOrders();
      }
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: orderId,
          status: newStatus,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Clear notification if it matches
        if (newOrderNotification && newOrderNotification.id === orderId) {
          setNewOrderNotification(null);
        }

        // Broadcast update
        await fetch('/api/broadcast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'order_update',
            data: data.order,
          }),
        });

        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      const response = await fetch(`/api/orders?id=${orderId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        // Clear notification if it matches
        if (newOrderNotification && newOrderNotification.id === orderId) {
          setNewOrderNotification(null);
        }

        // Broadcast update
        await fetch('/api/broadcast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'order_update',
            data: { id: orderId, status: 'cancelled' },
          }),
        });

        fetchOrders();
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  const handleUpdateItemQuantity = (itemIndex, delta) => {
    setEditFormData(prev => {
      const newItems = [...prev.items];
      const newQuantity = Math.max(1, newItems[itemIndex].quantity + delta);
      newItems[itemIndex].quantity = newQuantity;
      
      // Recalculate total
      const newTotal = newItems.reduce((sum, item) => {
        const itemPrice = item.finalPrice || item.price;
        const extrasCost = (item.extras || []).reduce((s, e) => s + (e.price * e.qty), 0);
        return sum + (itemPrice * item.quantity) + extrasCost;
      }, 0);
      
      return {
        ...prev,
        items: newItems,
        total: newTotal,
      };
    });
  };

  const handleRemoveItem = (itemIndex) => {
    setEditFormData(prev => {
      const newItems = prev.items.filter((_, i) => i !== itemIndex);
      const newTotal = newItems.reduce((sum, item) => {
        const itemPrice = item.finalPrice || item.price;
        const extrasCost = (item.extras || []).reduce((s, e) => s + (e.price * e.qty), 0);
        return sum + (itemPrice * item.quantity) + extrasCost;
      }, 0);
      
      return {
        ...prev,
        items: newItems,
        total: newTotal,
      };
    });
  };

  const handleUpdatePrice = (itemIndex, newPrice) => {
    setEditFormData(prev => {
      const newItems = [...prev.items];
      newItems[itemIndex].price = parseFloat(newPrice) || 0;
      newItems[itemIndex].finalPrice = parseFloat(newPrice) || 0;
      
      const newTotal = newItems.reduce((sum, item) => {
        const itemPrice = item.finalPrice || item.price;
        const extrasCost = (item.extras || []).reduce((s, e) => s + (e.price * e.qty), 0);
        return sum + (itemPrice * item.quantity) + extrasCost;
      }, 0);
      
      return {
        ...prev,
        items: newItems,
        total: newTotal,
      };
    });
  };

  const handleAddItemToOrder = (item, isExtra = false) => {
    setEditFormData(prev => {
      const newItem = {
        id: item.id,
        name: item.name,
        quantity: 1,
        price: Number(item.price) || 0,
        finalPrice: Number(item.price) || 0,
        extras: [],
      };
      
      const newItems = [...prev.items, newItem];
      const newTotal = newItems.reduce((sum, item) => {
        const itemPrice = item.finalPrice || item.price;
        const extrasCost = (item.extras || []).reduce((s, e) => s + (e.price * e.qty), 0);
        return sum + (itemPrice * item.quantity) + extrasCost;
      }, 0);
      
      return {
        ...prev,
        items: newItems,
        total: newTotal,
      };
    });
    setShowAddItemModal(false);
  };

  const handleDone = async (orderId) => {
    try {
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
        // Broadcast update
        await fetch('/api/broadcast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'order_update',
            data: data.order,
          }),
        });

        fetchOrders();
      }
    } catch (error) {
      console.error('Error completing order:', error);
    }
  };

  const handleMuteOrder = (orderId) => {
    setMutedOrders(prev => {
      const newSet = new Set(prev);
      newSet.add(orderId);
      return newSet;
    });
    // If the notification matches the muted order, close it
    if (newOrderNotification && newOrderNotification.id === orderId) {
        setNewOrderNotification(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
      </div>
    );
  }

  // Filter orders based on selected status
  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'pending') {
      return order.status === 'pending';
    } else if (statusFilter === 'processing') {
      return order.status === 'accepted' || order.status === 'processing';
    } else if (statusFilter === 'completed') {
      return order.status === 'completed';
    }
    return true;
  });

  return (
    <div>
      {/* Hidden Print Receipt Component */}
      <OrderReceipt order={printOrder} />

      <div className="print:hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 lg:mb-6 gap-2">
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Orders Management</h1>
          <div className="text-gray-400 text-xs lg:text-sm">
            {filteredOrders.length} {statusFilter === 'pending' ? 'pending' : statusFilter === 'processing' ? 'processing' : 'completed'} orders
          </div>
        </div>

        {/* Status Filter Buttons */}
        <StatusFilter 
          currentFilter={statusFilter} 
          onFilterChange={setStatusFilter} 
        />

        {/* Table Status Overview */}
        <TableStatus tables={tables} />
      </div>

      {/* New Order Notification Popup */}
      <OrderNotification 
        notification={newOrderNotification} 
        onClose={() => setNewOrderNotification(null)}
        onMute={handleMuteOrder}
      />

      <div className="space-y-3 lg:space-y-4">
        {filteredOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            isEditing={editingOrder === order.id}
            editFormData={editFormData}
            onEdit={handleEdit}
            onCancelEdit={() => {
              setEditingOrder(null);
              setEditFormData(null);
            }}
            onSaveEdit={handleSaveEdit}
            onAddItemClick={() => setShowAddItemModal(true)}
            onUpdateItemQuantity={handleUpdateItemQuantity}
            onRemoveItem={handleRemoveItem}
            onUpdatePrice={handleUpdatePrice}
            onAccept={handleAcceptOrder}
            onCancel={handleCancelOrder}
            onStatusChange={handleStatusChange}
            onDone={handleDone}
          />
        ))}

        {filteredOrders.length === 0 && (
          <OrderListEmptyState statusFilter={statusFilter} />
        )}
      </div>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        menuItems={menuItems}
        extraItems={extraItems}
        onAddItem={handleAddItemToOrder}
      />
    </div>
  );
}
