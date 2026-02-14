'use client';

import React, { useState } from 'react';
import { Monitor, ChevronDown, ChevronUp, Copy, Check, Ban } from 'lucide-react';

/**
 * Formats MAC address for display (e.g., aa:bb:cc:dd:ee:ff)
 */
function formatMAC(mac) {
  if (!mac) return null;
  return mac.replace(/-/g, ':').toLowerCase();
}

/**
 * Normalize IP for display (::ffff:127.0.0.1 -> 127.0.0.1)
 */
function normalizeIP(ip) {
  if (!ip) return ip;
  if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
  return ip;
}

/**
 * ClientInfoPanel - Clickable device identifier with expandable details.
 * Shows MAC or IP, and on click reveals full device/network info.
 */
export default function ClientInfoPanel({ deviceInfo, onBlock }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(null);
  const [blocking, setBlocking] = useState(false);
  const [blocked, setBlocked] = useState(false);

  if (!deviceInfo) return null;

  const mac = deviceInfo.mac ? formatMAC(deviceInfo.mac) : null;
  const ip = normalizeIP(deviceInfo.ip) || null;
  const displayLabel = mac || ip || 'Unknown device';

  const handleCopy = async (e, label, value) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  const handleBlock = async (e) => {
    e.stopPropagation();
    if (!ip || ip === '127.0.0.1' || ip === '::1') return;
    if (!confirm(`Block ${ip} from accessing the website for 10 minutes?`)) return;
    setBlocking(true);
    try {
      const res = await fetch('/api/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip }),
      });
      const data = await res.json();
      if (data.success) {
        setBlocked(true);
      } else {
        alert(data.error || 'Failed to block');
      }
    } catch (err) {
      alert('Failed to block');
    } finally {
      setBlocking(false);
    }
  };

  const infoRows = [
    { label: 'IP Address', value: ip, key: 'ip' },
    { label: 'MAC Address', value: mac, key: 'mac' },
    { label: 'Browser', value: deviceInfo.browser, key: 'browser' },
    { label: 'Operating System', value: deviceInfo.os, key: 'os' },
    { label: 'Device Type', value: deviceInfo.deviceType, key: 'deviceType' },
    { label: 'Language', value: deviceInfo.language, key: 'language' },
    { label: 'Timezone', value: deviceInfo.timezone, key: 'timezone' },
    { label: 'Screen', value: deviceInfo.screenWidth && deviceInfo.screenHeight ? `${deviceInfo.screenWidth}×${deviceInfo.screenHeight}` : null, key: 'screen' },
    { label: 'Platform', value: deviceInfo.platform, key: 'platform' },
    { label: 'Captured At', value: deviceInfo.capturedAt ? new Date(deviceInfo.capturedAt).toLocaleString() : null, key: 'capturedAt' },
  ].filter((r) => r.value);

  // Use normalized IP for display in info rows
  const displayInfoRows = infoRows.map((r) =>
    r.key === 'ip' ? { ...r, value: ip } : r
  );

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-700/60 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 transition-colors text-left w-full group"
      >
        <Monitor className="w-4 h-4 text-cyan-400 shrink-0" />
        <span className="text-xs font-mono text-cyan-300 truncate flex-1">
          {displayLabel}
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="mt-2 p-3 rounded-lg bg-gray-900/80 border border-gray-700 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Device & Network Info
          </p>
          {displayInfoRows.map(({ label, value, key }) => (
            <div
              key={key}
              className="flex items-center justify-between gap-2 group/row"
            >
              <span className="text-xs text-gray-500">{label}</span>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs text-gray-300 font-mono truncate max-w-[180px] sm:max-w-[240px]">
                  {value}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleCopy(e, key, value)}
                  className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-cyan-400 transition-colors shrink-0"
                  title="Copy"
                >
                  {copied === key ? (
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
          {deviceInfo.userAgent && (
            <div className="pt-2 mt-2 border-t border-gray-700">
              <p className="text-xs text-gray-500 mb-1">User-Agent</p>
              <p className="text-xs text-gray-400 font-mono break-all">
                {deviceInfo.userAgent}
              </p>
            </div>
          )}
          {onBlock && ip && ip !== '127.0.0.1' && ip !== '::1' && (
            <div className="pt-3 mt-3 border-t border-gray-700">
              <button
                type="button"
                onClick={handleBlock}
                disabled={blocking || blocked}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-900/40 hover:bg-red-900/60 border border-red-700/50 text-red-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Ban className="w-4 h-4" />
                {blocked ? 'Blocked (10 min)' : blocking ? 'Blocking...' : 'Block for 10 min'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
