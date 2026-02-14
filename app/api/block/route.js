import { NextResponse } from 'next/server';
import { blockIP, isBlocked, normalizeIP, unblockIP, extendBlock, getBlockedList } from '@/lib/blockHandler';
import { readOrdersData, writeOrdersData } from '@/lib/jsonHandler';
import { getTodayDateString } from '@/lib/utils';
import { broadcastMessage } from '@/lib/broadcast';

/** Cancel all active orders (pending/processing) from the given IP */
function cancelOrdersByIP(ip) {
  const date = getTodayDateString();
  const data = readOrdersData(date);
  let changed = false;
  const normalized = normalizeIP(ip);

  for (let i = 0; i < data.orders.length; i++) {
    const order = data.orders[i];
    const orderIp = order.deviceInfo?.ip ? normalizeIP(order.deviceInfo.ip) : null;
    if (orderIp === normalized && ['pending', 'accepted', 'processing'].includes(order.status)) {
      data.orders[i] = {
        ...order,
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
        cancelledByBlock: true,
      };
      changed = true;
      broadcastMessage('order_update', data.orders[i]);
    }
  }
  if (changed) writeOrdersData(data, date);
}

/**
 * GET /api/block - List all blocked IPs (no query) or check single IP (?ip=...)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get('ip');

    if (!ip) {
      const list = getBlockedList();
      return NextResponse.json({ success: true, blocked: list });
    }

    const normalized = normalizeIP(ip);
    const blocked = isBlocked(normalized);
    const res = NextResponse.json({ blocked, ip: normalized });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res;
  } catch (err) {
    console.error('Block check error:', err);
    return NextResponse.json({ blocked: false }, { status: 500 });
  }
}

/**
 * POST /api/block - Block an IP for 10 minutes
 * Body: { ip: "192.168.1.105" }
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const ip = body.ip;
    if (!ip || typeof ip !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing ip' }, { status: 400 });
    }
    const ok = blockIP(ip);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Cannot block this IP' }, { status: 400 });
    }
    cancelOrdersByIP(ip);
    return NextResponse.json({ success: true, message: 'IP blocked for 10 minutes' });
  } catch (err) {
    console.error('Block error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/block?ip=... - Unblock an IP
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get('ip');
    if (!ip) {
      return NextResponse.json({ success: false, error: 'Missing ip' }, { status: 400 });
    }
    const ok = unblockIP(ip);
    return NextResponse.json({ success: ok, message: ok ? 'IP unblocked' : 'IP not in block list' });
  } catch (err) {
    console.error('Unblock error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/block - Extend block time
 * Body: { ip: "192.168.1.105", minutes: 10 }
 */
export async function PATCH(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const ip = body.ip;
    const minutes = typeof body.minutes === 'number' ? body.minutes : 10;
    if (!ip || typeof ip !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing ip' }, { status: 400 });
    }
    const ok = extendBlock(ip, minutes);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'IP not in block list' }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: `Block extended by ${minutes} minutes` });
  } catch (err) {
    console.error('Extend block error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
