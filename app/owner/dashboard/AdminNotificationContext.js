'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import OrderNotification from './orders/components/OrderNotification';
import WaiterCallNotification from './orders/components/WaiterCallNotification';

const AdminNotificationContext = createContext(null);

export function useAdminNotifications() {
  const ctx = useContext(AdminNotificationContext);
  return ctx;
}

export function AdminNotificationProvider({ children }) {
  const [newOrderNotification, setNewOrderNotification] = useState(null);
  const [waiterCallNotification, setWaiterCallNotification] = useState(null);
  const [mutedOrders, setMutedOrders] = useState(new Set());

  // Play new-order sound (single rising beep)
  const playNewOrderSound = useCallback(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
    setTimeout(() => ctx.close(), 600);
  }, []);

  // Play waiter-call sound (distinct: two-tone ding-ding)
  const playWaiterCallSound = useCallback(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const playTone = (freq, startTime, duration = 0.15) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    playTone(880, ctx.currentTime);
    playTone(1100, ctx.currentTime + 0.2);
    setTimeout(() => ctx.close(), 500);
  }, []);

  // WebSocket for real-time updates (global for all admin pages)
  useEffect(() => {
    const eventSource = new EventSource('/api/websocket');
    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'new_order') {
          setNewOrderNotification(message.data);
          playNewOrderSound();
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Order!', {
              body: `Table ${message.data.tableNumber} - Order #${message.data.id?.slice(-4) ?? ''}`,
              icon: '/favicon.ico',
              tag: message.data.id,
            });
          }
          window.dispatchEvent(new CustomEvent('owner-new-order'));
        } else if (message.type === 'order_update') {
          window.dispatchEvent(new CustomEvent('owner-order-update'));
        } else if (message.type === 'call_waiter') {
          setWaiterCallNotification({
            tableNumber: message.data?.tableNumber,
            id: `waiter-${Date.now()}`,
          });
          playWaiterCallSound();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    eventSource.onerror = () => {};
    return () => eventSource.close();
  }, [playNewOrderSound, playWaiterCallSound]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Repeat new-order beep while notification is open and not muted
  useEffect(() => {
    if (!newOrderNotification || mutedOrders.has(newOrderNotification.id)) return;
    const interval = setInterval(playNewOrderSound, 2000);
    return () => clearInterval(interval);
  }, [newOrderNotification, mutedOrders, playNewOrderSound]);

  // Repeat waiter-call sound while notification is open (until closed)
  useEffect(() => {
    if (!waiterCallNotification) return;
    playWaiterCallSound();
    const interval = setInterval(playWaiterCallSound, 2500);
    return () => clearInterval(interval);
  }, [waiterCallNotification, playWaiterCallSound]);

  const muteOrder = useCallback((orderId) => {
    setMutedOrders((prev) => {
      const next = new Set(prev);
      next.add(orderId);
      return next;
    });
    setNewOrderNotification((prev) => (prev?.id === orderId ? null : prev));
  }, []);

  const clearNewOrder = useCallback((orderId) => {
    if (orderId != null) {
      setNewOrderNotification((prev) => (prev?.id === orderId ? null : prev));
    } else {
      setNewOrderNotification(null);
    }
  }, []);

  const clearWaiterCall = useCallback(() => setWaiterCallNotification(null), []);

  const acceptWaiterCall = useCallback(async (notification) => {
    if (!notification?.tableNumber) return;
    try {
      await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'water_coming',
          data: { tableNumber: notification.tableNumber },
        }),
      });
      setWaiterCallNotification(null);
    } catch (e) {
      console.error('Failed to send water_coming:', e);
    }
  }, []);

  const value = {
    newOrderNotification,
    waiterCallNotification,
    mutedOrders,
    muteOrder,
    clearNewOrder,
    clearWaiterCall,
    acceptWaiterCall,
  };

  return (
    <AdminNotificationContext.Provider value={value}>
      {children}
      <OrderNotification
        notification={newOrderNotification}
        onClose={() => setNewOrderNotification(null)}
        onMute={muteOrder}
      />
      <WaiterCallNotification
        notification={waiterCallNotification}
        onAccept={acceptWaiterCall}
        onClose={clearWaiterCall}
      />
    </AdminNotificationContext.Provider>
  );
}
