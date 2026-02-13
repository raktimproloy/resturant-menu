import React from 'react';
import { Clock, CheckCircle, ConciergeBell, CookingPot, ListOrdered, ChevronUp, ChevronDown } from 'lucide-react';

export const priorityStyles = {
  Low: { text: 'text-yellow-400', bg: 'bg-yellow-400/20', icon: ChevronDown },
  Medium: { text: 'text-indigo-400', bg: 'bg-indigo-400/20', icon: ListOrdered },
  High: { text: 'text-red-500', bg: 'bg-red-500/20', icon: ChevronUp },
};

export const getStatusIcon = (status) => {
  switch (status) {
    case 'pending':
      return <ConciergeBell className="w-5 h-5 text-yellow-400" />;
    case 'accepted':
    case 'processing':
      return <CookingPot className="w-5 h-5 text-indigo-400" />;
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    default:
      return <Clock className="w-5 h-5 text-gray-400" />;
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-900 text-yellow-200';
    case 'accepted':
    case 'processing':
      return 'bg-indigo-900 text-indigo-200';
    case 'completed':
      return 'bg-green-900 text-green-200';
    default:
      return 'bg-gray-700 text-gray-300';
  }
};

export const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000 / 60);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff} min ago`;
  return date.toLocaleTimeString();
};

/** Elapsed time as M:SS for queue/processing timer */
export const formatElapsedTimer = (seconds) => {
  const sec = Math.max(0, Math.floor(seconds));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/** Format seconds as "X min Y sec" for stored queue/processing time */
export const formatDuration = (seconds) => {
  if (seconds == null || seconds < 0) return '—';
  const sec = Math.floor(Number(seconds));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s} sec`;
  if (s === 0) return `${m} min`;
  return `${m} min ${s} sec`;
};
