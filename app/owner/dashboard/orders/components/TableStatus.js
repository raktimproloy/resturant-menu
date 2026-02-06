import React from 'react';

export default function TableStatus({ tables }) {
  return (
    <div className="mb-4 lg:mb-6 bg-gray-800 rounded-xl p-3 lg:p-4 border border-gray-700">
      <h2 className="text-base lg:text-lg font-semibold text-white mb-2 lg:mb-3">Table Status</h2>
      <div className="grid grid-cols-5 sm:grid-cols-5 gap-2">
        {tables.map((table) => (
          <div
            key={table.number}
            className={`p-2 lg:p-3 rounded-lg text-center ${
              table.status === 'processing'
                ? 'bg-indigo-900 text-indigo-200'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            <div className="font-bold text-sm lg:text-base">Table {table.number}</div>
            <div className="text-xs mt-1">
              {table.status === 'processing' ? 'Processing' : 'Empty'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
