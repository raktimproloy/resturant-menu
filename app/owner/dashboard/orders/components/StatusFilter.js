import React from 'react';

export default function StatusFilter({ currentFilter, onFilterChange, orderCounts }) {
  return (
    <div className="mb-4 lg:mb-6 flex flex-wrap gap-2 sm:gap-3">
      <button
        onClick={() => onFilterChange('pending')}
        className={`flex-1 sm:flex-none min-h-[44px] px-4 py-3 sm:py-2 lg:px-6 lg:py-3 rounded-lg text-sm lg:text-base font-semibold transition-all touch-manipulation ${
          currentFilter === 'pending'
            ? 'bg-yellow-600 text-white shadow-lg'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-500'
        }`}
      >
        Pending
      </button>
      <button
        onClick={() => onFilterChange('processing')}
        className={`flex-1 sm:flex-none min-h-[44px] px-4 py-3 sm:py-2 lg:px-6 lg:py-3 rounded-lg text-sm lg:text-base font-semibold transition-all touch-manipulation ${
          currentFilter === 'processing'
            ? 'bg-indigo-600 text-white shadow-lg'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-500'
        }`}
      >
        Processing
      </button>
      <button
        onClick={() => onFilterChange('completed')}
        className={`flex-1 sm:flex-none min-h-[44px] px-4 py-3 sm:py-2 lg:px-6 lg:py-3 rounded-lg text-sm lg:text-base font-semibold transition-all touch-manipulation ${
          currentFilter === 'completed'
            ? 'bg-green-600 text-white shadow-lg'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-500'
        }`}
      >
        Completed
      </button>
    </div>
  );
}
