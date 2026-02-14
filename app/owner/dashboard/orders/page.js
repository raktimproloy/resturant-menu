'use client';

import { useState, useEffect, useRef } from 'react';
import { getTodayDateString } from '@/lib/utils';
import { useAdminNotifications } from '../AdminNotificationContext';
import OrderReceipt from './components/OrderReceipt';
import StatusFilter from './components/StatusFilter';
import TableStatus from './components/TableStatus';
import OrderCard from './components/OrderCard';
import AddItemModal from './components/AddItemModal';
import OrderListEmptyState from './components/OrderListEmptyState';

export default function OrdersManagement() {
  const { clearNewOrder } = useAdminNotifications();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [tables, setTables] = useState(Array.from({ length: 10 }, (_, i) => ({ number: i + 1, status: 'empty' })));
  const [statusFilter, setStatusFilter] = useState('pending'); // Default to pending
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [extraItems, setExtraItems] = useState([]);
  
  const [printOrder, setPrintOrder] = useState(null);
  const [printVariant, setPrintVariant] = useState('processing'); // 'processing' | 'complete'

  // Print Logic
  useEffect(() => {
    if (printOrder) {
      setTimeout(() => {
        window.print();
      }, 100);
    }
  }, [printOrder]);

  const fetchOrdersRef = useRef(() => {});

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

  fetchOrdersRef.current = fetchOrders;

  // Listen for global order updates (from AdminNotificationContext WebSocket)
  useEffect(() => {
    const onUpdate = () => fetchOrdersRef.current?.();
    window.addEventListener('owner-order-update', onUpdate);
    window.addEventListener('owner-new-order', onUpdate);
    return () => {
      window.removeEventListener('owner-order-update', onUpdate);
      window.removeEventListener('owner-new-order', onUpdate);
    };
  }, []);

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
        clearNewOrder(editingOrder);
        // Show print dialog (processing receipt)
        setPrintVariant('processing');
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
        clearNewOrder(orderId);
        // Set print order to trigger print receipt (kitchen/processing)
        setPrintVariant('processing');
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
        clearNewOrder(orderId);
        // When marking complete, trigger customer copy print (same style as processing)
        if (newStatus === 'completed') {
          setPrintVariant('complete');
          setPrintOrder(data.order);
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
        clearNewOrder(orderId);

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

  const handlePrintOrder = (order) => {
    setPrintVariant('processing');
    setPrintOrder(order);
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

  const completedTotalAmount = statusFilter === 'completed'
    ? filteredOrders.reduce((sum, o) => sum + Number(o.total || 0), 0)
    : 0;

  return (
    <div>
      {/* Hidden Print Receipt Component */}
      <OrderReceipt order={printOrder} variant={printVariant} />

      <div className="print:hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 lg:mb-6 gap-2">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Orders Management</h1>
          <div className="text-gray-400 text-xs sm:text-sm">
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

        {/* Completed section: total amount */}
        {statusFilter === 'completed' && filteredOrders.length > 0 && (
          <div className="mb-4 p-4 bg-gray-800 rounded-xl border border-gray-700">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-gray-400 text-sm sm:text-base">Total completed amount</span>
              <span className="text-xl sm:text-2xl font-bold text-green-400">{completedTotalAmount.toLocaleString()} ৳</span>
            </div>
            <p className="text-gray-500 text-xs mt-1">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} completed</p>
          </div>
        )}
      </div>

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
            onPrint={handlePrintOrder}
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
