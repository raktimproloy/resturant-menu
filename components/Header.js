import React from 'react'
import { ChefHat } from 'lucide-react';

const Header = ({ restaurantName }) => (
  <header className="py-4 border-b border-gray-700 mb-6">
    <div className="flex justify-between items-center px-4 sm:px-6">
      <h1 className="text-xl font-bold text-indigo-400 truncate max-w-[60%]">
        {restaurantName}
      </h1>
      <div className="flex items-center space-x-3">
        <span className="text-2xl font-extrabold text-white tracking-widest uppercase flex items-center">
          Menu
        </span>
        <ChefHat className="w-7 h-7 text-green-400" />
      </div>
    </div>
  </header>
);

export default Header;