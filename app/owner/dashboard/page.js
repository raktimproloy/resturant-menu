'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Utensils, PlusCircle, ShoppingBag, ArrowRight } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    menuItems: 0,
    extraItems: 0,
    orders: 0,
  });

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/owner');
      return;
    }

    // Fetch stats
    const fetchStats = async () => {
      try {
        const [menuRes, extrasRes] = await Promise.all([
          fetch('/api/menu'),
          fetch('/api/extras'),
        ]);

        const menuData = await menuRes.json();
        const extrasData = await extrasRes.json();

        setStats({
          menuItems: menuData.menu?.length || 0,
          extraItems: extrasData.extras?.length || 0,
          orders: 0, // Will be implemented later
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [router]);

  const cards = [
    {
      title: 'Menu Items',
      count: stats.menuItems,
      icon: Utensils,
      href: '/owner/dashboard/menu',
      color: 'bg-indigo-600',
    },
    {
      title: 'Extra Items',
      count: stats.extraItems,
      icon: PlusCircle,
      href: '/owner/dashboard/extras',
      color: 'bg-green-600',
    },
    {
      title: 'Orders',
      count: stats.orders,
      icon: ShoppingBag,
      href: '/owner/dashboard/orders',
      color: 'bg-purple-600',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl lg:text-3xl font-bold text-white mb-4 lg:mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="bg-gray-800 rounded-xl p-4 lg:p-6 hover:bg-gray-750 transition-colors border border-gray-700 hover:border-gray-600"
            >
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <div className={`${card.color} p-2 lg:p-3 rounded-lg`}>
                  <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold text-white mb-2">{card.title}</h3>
              <p className="text-2xl lg:text-3xl font-bold text-indigo-400">{card.count}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}


