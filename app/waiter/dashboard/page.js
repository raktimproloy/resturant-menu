'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, ShoppingBag, History, ArrowRight } from 'lucide-react';

export default function WaiterDashboard() {
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await fetch('/api/orders?date=' + today);
        const data = await res.json();
        if (data.success) {
          const active = (data.orders || []).filter(
            (o) => o.status !== 'cancelled' && o.status !== 'completed'
          );
          setOrderCount(active.length);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
      }
    };
    fetchOrders();
  }, []);

  const cards = [
    {
      title: 'Orders',
      count: orderCount,
      icon: ShoppingBag,
      href: '/waiter/dashboard/orders',
      color: 'bg-cyan-600',
    },
    {
      title: 'Order History',
      count: null,
      icon: History,
      href: '/waiter/dashboard/order-history',
      color: 'bg-indigo-600',
    },
  ];

  return (
    <div>
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4 lg:mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="bg-gray-800 rounded-xl p-4 lg:p-6 hover:bg-gray-750 transition-colors border border-gray-700 hover:border-gray-600 active:bg-gray-750 min-h-[120px] sm:min-h-0 flex flex-col justify-center touch-manipulation"
            >
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <div className={`${card.color} p-2.5 lg:p-3 rounded-lg shrink-0`}>
                  <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 shrink-0" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-2">
                {card.title}
              </h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-cyan-400">
                {card.count != null ? card.count : 'View'}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
