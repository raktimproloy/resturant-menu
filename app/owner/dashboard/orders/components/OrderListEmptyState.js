import React from 'react';
import { ShoppingBag } from 'lucide-react';

export default function OrderListEmptyState({ statusFilter }) {
  return (
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
  );
}
