'use client';

import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTodayDateString } from '@/lib/utils';
import OrderHistoryCard from '../orders/components/OrderHistoryCard';

export default function OrderHistoryPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/orders?date=${selectedDate}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) {
          const list = data.orders || [];
          setOrders(list.filter((o) => o.status !== 'cancelled'));
        } else {
          setOrders([]);
          setError(data.error || 'Failed to load orders');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setOrders([]);
          setError('Failed to load orders');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedDate]);

  const goToPrevDay = () => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    const next = d.toISOString().split('T')[0];
    const today = getTodayDateString();
    if (next <= today) setSelectedDate(next);
  };

  const isToday = selectedDate === getTodayDateString();
  const dateLabel = (() => {
    const d = new Date(selectedDate + 'T12:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  })();

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 lg:mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Order History</h1>
      </div>

      {/* Date selector */}
      <div className="mb-6 bg-gray-800 rounded-xl p-4 border border-gray-700">
        <label className="block text-sm font-medium text-gray-400 mb-2">View orders by date</label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={goToPrevDay}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-gray-700 hover:bg-gray-600 text-white touch-manipulation"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Calendar className="w-5 h-5 text-indigo-400 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={getTodayDateString()}
              className="flex-1 min-w-0 px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
            />
          </div>
          <button
            type="button"
            onClick={goToNextDay}
            disabled={isToday}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-gray-700 hover:bg-gray-600 text-white touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-500 text-sm mt-2">{dateLabel}</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-xl text-red-200 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-8 sm:p-12 text-center border border-gray-700">
          <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-base sm:text-lg">No orders for this date</p>
          <p className="text-gray-500 text-sm mt-2">Select another date to view order history.</p>
        </div>
      ) : (
        <>
          <div className="mb-4 p-4 bg-gray-800 rounded-xl border border-gray-700">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-gray-400 text-sm sm:text-base">
                {orders.length} order{orders.length !== 1 ? 's' : ''} on {dateLabel}
              </span>
              <span className="text-xl sm:text-2xl font-bold text-green-400">
                {orders.reduce((sum, o) => sum + Number(o.total || 0), 0).toLocaleString()} ৳ total
              </span>
            </div>
          </div>
          <div className="space-y-3 lg:space-y-4">
            {orders.map((order) => (
              <OrderHistoryCard key={order.id} order={order} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
