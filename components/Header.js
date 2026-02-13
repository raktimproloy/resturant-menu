'use client';

import React from 'react';
import { ChefHat, Bell } from 'lucide-react';

const Header = ({ title = 'Fam', onNotificationClick, notificationCount = 0 }) => (
  <header className="sticky top-0 z-10 py-4 border-b border-gray-700 mb-6 bg-gray-900">
    <div className="flex justify-between items-center px-4 sm:px-6">
      <h1 className="text-xl font-bold text-indigo-400 truncate max-w-[50%]">
        {title}
      </h1>
      <div className="flex items-center gap-3">
        {onNotificationClick && (
          <button
            type="button"
            onClick={onNotificationClick}
            className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700/80 transition"
            aria-label="Notifications"
          >
            <Bell className="w-6 h-6" />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>
        )}
        {/* <span className="text-2xl font-extrabold text-white tracking-widest uppercase flex items-center gap-2">
          Menu
          <ChefHat className="w-7 h-7 text-green-400" />
        </span> */}
      </div>
    </div>
  </header>
);

export default Header;
