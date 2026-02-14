'use client';

import React, { useState, useEffect } from 'react';
import { Ban, Unlock, Clock, Plus } from 'lucide-react';

function formatCountdown(blockedUntil) {
  const now = Date.now();
  const until = new Date(blockedUntil).getTime();
  const diff = Math.max(0, until - now);
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function BlockedPage() {
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now);

  const fetchBlocked = async () => {
    try {
      const res = await fetch('/api/block');
      const data = await res.json();
      if (data.success && Array.isArray(data.blocked)) {
        setBlocked(data.blocked);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocked();
    const interval = setInterval(fetchBlocked, 60000); // Refetch every minute to remove expired
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const handleUnblock = async (ip) => {
    try {
      const res = await fetch(`/api/block?ip=${encodeURIComponent(ip)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setBlocked((prev) => prev.filter((b) => b.ip !== ip));
      } else {
        alert(data.error || 'Failed to unblock');
      }
    } catch (err) {
      alert('Failed to unblock');
    }
  };

  const handleExtend = async (ip, minutes = 10) => {
    try {
      const res = await fetch('/api/block', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, minutes }),
      });
      const data = await res.json();
      if (data.success) {
        fetchBlocked();
      } else {
        alert(data.error || 'Failed to extend');
      }
    } catch (err) {
      alert('Failed to extend');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 lg:mb-6 gap-2">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Blocked IPs</h1>
        <p className="text-gray-400 text-sm">
          {blocked.length} {blocked.length === 1 ? 'IP' : 'IPs'} currently blocked
        </p>
      </div>

      {blocked.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center">
          <Ban className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No IPs are currently blocked</p>
          <p className="text-gray-500 text-sm mt-1">Block users from the Orders page when viewing device info</p>
        </div>
      ) : (
        <div className="space-y-3">
          {blocked.map(({ ip, blockedUntil }) => {
            const remaining = formatCountdown(blockedUntil);
            const isExpired = new Date(blockedUntil) <= new Date();
            if (isExpired) return null;

            return (
              <div
                key={ip}
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Ban className="w-5 h-5 text-red-400 shrink-0" />
                    <span className="font-mono text-white font-medium">{ip}</span>
                  </div>
                  <div className="flex items-center gap-2 text-cyan-400 text-sm font-mono tabular-nums">
                    <Clock className="w-4 h-4" />
                    <span>{remaining} remaining</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleExtend(ip, 5)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    +5 min
                  </button>
                  <button
                    onClick={() => handleExtend(ip, 10)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    +10 min
                  </button>
                  <button
                    onClick={() => handleUnblock(ip)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium"
                  >
                    <Unlock className="w-4 h-4" />
                    Unblock
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
