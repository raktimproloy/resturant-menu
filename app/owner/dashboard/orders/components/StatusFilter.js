import React from 'react';

export default function StatusFilter({ currentFilter, onFilterChange, orderCounts }) {
  return (
    <div className="mb-4 lg:mb-6 flex flex-wrap gap-2 lg:gap-3">
      <button
        onClick={() => onFilterChange('pending')}
        className={`px-4 py-2 lg:px-6 lg:py-3 rounded-lg text-sm lg:text-base font-semibold transition-all ${
          currentFilter === 'pending'
            ? 'bg-yellow-600 text-white shadow-lg'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        Pending
      </button>
      <button
        onClick={() => onFilterChange('processing')}
        className={`px-4 py-2 lg:px-6 lg:py-3 rounded-lg text-sm lg:text-base font-semibold transition-all ${
          currentFilter === 'processing'
            ? 'bg-indigo-600 text-white shadow-lg'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        Processing
      </button>
      <button
        onClick={() => onFilterChange('completed')}
        className={`px-4 py-2 lg:px-6 lg:py-3 rounded-lg text-sm lg:text-base font-semibold transition-all ${
          currentFilter === 'completed'
            ? 'bg-green-600 text-white shadow-lg'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        Completed
      </button>
    </div>
  );
}
