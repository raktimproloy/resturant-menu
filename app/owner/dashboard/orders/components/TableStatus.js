import React from 'react';

export default function TableStatus({ tables }) {
  return (
    <div className="mb-4 lg:mb-6 bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-700">
      <h2 className="text-base lg:text-lg font-semibold text-white mb-2 sm:mb-3">Table Status</h2>
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {tables.map((table) => (
          <div
            key={table.number}
            className={`p-2 sm:p-2.5 lg:p-3 rounded-lg text-center min-h-[52px] sm:min-h-0 flex flex-col justify-center ${
              table.status === 'processing'
                ? 'bg-indigo-900 text-indigo-200'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            <div className="font-bold text-xs sm:text-sm lg:text-base truncate">T{table.number}</div>
            <div className="text-[10px] sm:text-xs mt-0.5 opacity-90">
              {table.status === 'processing' ? 'Busy' : 'Empty'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
