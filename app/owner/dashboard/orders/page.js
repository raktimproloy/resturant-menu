'use client';

import { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle, Hourglass, Truck, ShoppingBag, X, Edit2, Trash2, Save, Plus, Minus, Bell, ChevronUp, ChevronDown, ListOrdered } from 'lucide-react';
import { getTodayDateString } from '@/lib/utils';

export default function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [newOrderNotification, setNewOrderNotification] = useState(null);
  const [tables, setTables] = useState(Array.from({ length: 10 }, (_, i) => ({ number: i + 1, status: 'empty' })));
  const [statusFilter, setStatusFilter] = useState('pending'); // Default to pending
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [extraItems, setExtraItems] = useState([]);
  
  const priorityStyles = {
    Low: { text: 'text-yellow-400', bg: 'bg-yellow-400/20', icon: ChevronDown },
    Medium: { text: 'text-indigo-400', bg: 'bg-indigo-400/20', icon: ListOrdered },
    High: { text: 'text-red-500', bg: 'bg-red-500/20', icon: ChevronUp },
  };

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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Hourglass className="w-5 h-5 text-yellow-400" />;
      case 'accepted':
      case 'processing':
        return <Truck className="w-5 h-5 text-indigo-400" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-900 text-yellow-200';
      case 'accepted':
      case 'processing':
        return 'bg-indigo-900 text-indigo-200';
      case 'completed':
        return 'bg-green-900 text-green-200';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    return date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
      </div>
    );
  }

  const currentOrder = editingOrder ? orders.find(o => o.id === editingOrder) : null;

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Orders Management</h1>
        <div className="text-gray-400 text-sm">
          {filteredOrders.length} {statusFilter === 'pending' ? 'pending' : statusFilter === 'processing' ? 'processing' : 'completed'} orders
        </div>
      </div>

      {/* Status Filter Buttons */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            statusFilter === 'pending'
              ? 'bg-yellow-600 text-white shadow-lg'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setStatusFilter('processing')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            statusFilter === 'processing'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Processing
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            statusFilter === 'completed'
              ? 'bg-green-600 text-white shadow-lg'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Table Status Overview */}
      <div className="mb-6 bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-3">Table Status</h2>
        <div className="grid grid-cols-5 gap-2">
          {tables.map((table) => (
            <div
              key={table.number}
              className={`p-3 rounded-lg text-center ${
                table.status === 'processing'
                  ? 'bg-indigo-900 text-indigo-200'
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              <div className="font-bold">Table {table.number}</div>
              <div className="text-xs mt-1">
                {table.status === 'processing' ? 'Processing' : 'Empty'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Order Notification Popup */}
      {newOrderNotification && (
        <div className="fixed top-4 right-4 z-50 bg-indigo-600 text-white p-4 rounded-xl shadow-2xl max-w-sm animate-slide-in">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Bell className="w-6 h-6 mt-1" />
              <div>
                <h3 className="font-bold text-lg">New Order!</h3>
                <p className="text-sm mt-1">
                  Table {newOrderNotification.tableNumber} - Order #{newOrderNotification.id.slice(-4)}
                  {newOrderNotification.priority && (
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${priorityStyles[newOrderNotification.priority]?.bg || 'bg-gray-700'} ${priorityStyles[newOrderNotification.priority]?.text || 'text-gray-300'}`}>
                      {newOrderNotification.priority}
                    </span>
                  )}
                </p>
                <p className="text-xs mt-1 opacity-90">
                  Total: {Number(newOrderNotification.total).toFixed(2)} BDT
                </p>
              </div>
            </div>
            <button
              onClick={() => setNewOrderNotification(null)}
              className="text-white hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-white">Order #{order.id.slice(-4)}</h3>
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
                <p className="text-gray-400">Table: {order.tableNumber}</p>
                <p className="text-gray-500 text-sm mt-1">
                  {formatTime(order.createdAt)}
                </p>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                <span className="text-sm font-medium capitalize">{order.status}</span>
              </div>
            </div>

            {editingOrder === order.id ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-lg font-semibold text-white">Edit Order Items</h4>
                  <button
                    onClick={() => setShowAddItemModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {editFormData.items.map((item, index) => (
                    <div key={index} className="bg-gray-700 p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="text-white font-medium">{item.name}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => handleUpdateItemQuantity(index, -1)}
                              className="p-1 bg-gray-600 rounded hover:bg-gray-500"
                            >
                              <Minus className="w-4 h-4 text-white" />
                            </button>
                            <span className="text-white font-semibold w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateItemQuantity(index, 1)}
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
                            onChange={(e) => handleUpdatePrice(index, e.target.value)}
                            className="w-20 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                          />
                          <button
                            onClick={() => handleRemoveItem(index)}
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
                  ))}
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                  <div className="text-2xl font-bold text-green-400">
                    {Number(editFormData.total).toFixed(2)} BDT
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingOrder(null);
                        setEditFormData(null);
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">Items:</p>
                  <ul className="space-y-1">
                    {order.items.map((item, index) => {
                      const itemPriority = item.priority || 'Medium';
                      const priorityLabel = itemPriority === 'High' ? 'Fast' : 'Normal';
                      return (
                        <li key={index} className="text-gray-300 flex items-center justify-between">
                          <span>
                            • {item.quantity}x {item.name} - {Number(item.finalPrice || item.price).toFixed(2)} BDT
                            {item.extras && item.extras.length > 0 && (
                              <span className="text-gray-500 text-xs ml-2">
                                (+{item.extras.length} extras)
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

                <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                  <div className="text-2xl font-bold text-green-400">
                    {Number(order.total).toFixed(2)} BDT
                  </div>
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleEdit(order)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleAcceptOrder(order.id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {order.status === 'processing' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'completed')}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg"
                      >
                        Completed
                      </button>
                    )}
                    {order.status === 'completed' && (
                      <button
                        onClick={() => handleDone(order.id)}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg"
                      >
                        Done (Table Empty)
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
            <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {statusFilter === 'pending' 
                ? 'No pending orders' 
                : statusFilter === 'processing' 
                ? 'No orders in processing' 
                : 'No completed orders'}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {statusFilter === 'pending' 
                ? 'New orders will appear here' 
                : statusFilter === 'processing' 
                ? 'Orders being prepared will appear here' 
                : 'Completed orders will appear here'}
            </p>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/95 flex items-center justify-center p-4" onClick={() => setShowAddItemModal(false)}>
          <div
            className="bg-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Add Item to Order</h2>
                <button
                  onClick={() => setShowAddItemModal(false)}
                  className="p-2 bg-gray-700 rounded-full hover:bg-gray-600"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Menu Items */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Menu Items</h3>
                  <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                    {menuItems.filter(item => item.status === 'Available').map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleAddItemToOrder(item, false)}
                        className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition"
                      >
                        <div className="font-medium text-white">{item.name}</div>
                        <div className="text-sm text-green-400 mt-1">
                          {Number(item.finalPrice || item.price).toFixed(2)} BDT
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Extra Items */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Extra Items</h3>
                  <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                    {extraItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleAddItemToOrder(item, true)}
                        className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition"
                      >
                        <div className="font-medium text-white">{item.name}</div>
                        <div className="text-sm text-green-400 mt-1">
                          {Number(item.price).toFixed(2)} BDT
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
