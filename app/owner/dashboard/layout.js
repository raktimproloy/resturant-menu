'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Utensils, PlusCircle, ShoppingBag, History, LogOut, Menu as MenuIcon, LayoutDashboard, Users, ShoppingCart, Ban } from 'lucide-react';
import { AdminNotificationProvider } from './AdminNotificationContext';

export default function OwnerLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminData, setAdminData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Check if owner is logged in
    const token = localStorage.getItem('adminToken');
    const admin = localStorage.getItem('adminData');

    if (!token || !admin) {
      router.push('/owner');
      return;
    }

    const adminObj = JSON.parse(admin);
    if (adminObj.role !== 'owner') {
      router.push('/owner');
      return;
    }

    setAdminData(adminObj);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    router.push('/owner');
  };

  const navItems = [
    { href: '/owner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/owner/dashboard/users', label: 'Users', icon: Users },
    { href: '/owner/dashboard/categories', label: 'Categories', icon: Utensils },
    { href: '/owner/dashboard/extras', label: 'Extras', icon: PlusCircle },
    { href: '/owner/dashboard/menu', label: 'Menu', icon: Utensils },
    { href: '/owner/dashboard/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/owner/dashboard/create-order', label: 'Create Order', icon: ShoppingCart },
    { href: '/owner/dashboard/order-history', label: 'Order History', icon: History },
    { href: '/owner/dashboard/blocked', label: 'Blocked IPs', icon: Ban },
  ];

  if (!adminData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
      </div>
    );
  }

  return (
    <div className="h-dvh min-h-dvh bg-gray-900 flex flex-col lg:flex-row overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          sidebarOpen ? 'w-64' : 'w-0 lg:w-64'
        } fixed lg:static inset-y-0 left-0 bg-gray-800 border-r border-gray-700 transition-all duration-300 overflow-hidden z-50 lg:shrink-0`}
      >
        <div className="p-4 lg:p-6 h-full overflow-y-auto overscroll-contain pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <h2 className="text-lg lg:text-xl font-bold text-white truncate">Owner Panel</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2.5 -mr-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-white touch-manipulation"
              aria-label="Close menu"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] touch-manipulation ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white active:bg-gray-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 lg:mt-8 pt-6 border-t border-gray-700">
            <div className="px-4 py-2 mb-4">
              <p className="text-sm text-gray-400">Logged in as</p>
              <p className="text-white font-semibold text-sm lg:text-base">{adminData.username}</p>
              <p className="text-gray-500 text-xs">Owner</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors min-h-[44px] touch-manipulation"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 lg:ml-0">
        {/* Mobile Header */}
        <header className="lg:hidden shrink-0 bg-gray-800 border-b border-gray-700 px-4 py-3 sticky top-0 z-30 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 text-gray-400 hover:text-white active:text-white touch-manipulation"
            aria-label="Open menu"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
        </header>

        {/* Page Content - scrollable */}
        <main className="flex-1 min-h-0 p-3 sm:p-4 lg:p-6 overflow-y-auto overflow-x-hidden overscroll-contain pb-[env(safe-area-inset-bottom)]">
          <AdminNotificationProvider role="owner">
            {children}
          </AdminNotificationProvider>
        </main>
      </div>
    </div>
  );
}
