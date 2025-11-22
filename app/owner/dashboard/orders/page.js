'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, Hourglass, Truck, ShoppingBag } from 'lucide-react';

export default function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For now, we'll show a placeholder
    // In the future, this will fetch orders from an API
    setLoading(false);
  }, []);

  // Placeholder orders data
  const placeholderOrders = [
    {
      id: 'ORD-001',
      table: 'Table 1',
      items: ['Burger x2', 'Fries x1'],
      total: 1200,
      status: 'Pending',
      time: '2 min ago',
    },
    {
      id: 'ORD-002',
      table: 'Table 3',
      items: ['Pizza x1', 'Water x2'],
      total: 800,
      status: 'In Progress',
      time: '5 min ago',
    },
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <Hourglass className="w-5 h-5 text-yellow-400" />;
      case 'In Progress':
        return <Truck className="w-5 h-5 text-indigo-400" />;
      case 'Ready':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-900 text-yellow-200';
      case 'In Progress':
        return 'bg-indigo-900 text-indigo-200';
      case 'Ready':
        return 'bg-green-900 text-green-200';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Orders Management</h1>
        <div className="text-gray-400 text-sm">
          {orders.length || placeholderOrders.length} active orders
        </div>
      </div>

      <div className="space-y-4">
        {placeholderOrders.map((order) => (
          <div
            key={order.id}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{order.id}</h3>
                <p className="text-gray-400">Table: {order.table}</p>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                <span className="text-sm font-medium">{order.status}</span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Items:</p>
              <ul className="space-y-1">
                {order.items.map((item, index) => (
                  <li key={index} className="text-gray-300">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-700">
              <div className="text-gray-400 text-sm">
                <Clock className="w-4 h-4 inline mr-1" />
                {order.time}
              </div>
              <div className="text-2xl font-bold text-green-400">
                {order.total} BDT
              </div>
            </div>
          </div>
        ))}

        {placeholderOrders.length === 0 && (
          <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
            <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No orders yet</p>
            <p className="text-gray-500 text-sm mt-2">Orders will appear here when customers place them</p>
          </div>
        )}
      </div>
    </div>
  );
}

