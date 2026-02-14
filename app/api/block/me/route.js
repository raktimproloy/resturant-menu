import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { isBlocked, normalizeIP } from '@/lib/blockHandler';

/**
 * GET /api/block/me - Check if current request's IP is blocked
 * Used by the blocked page to poll and redirect when unblocked
 */
export async function GET() {
  try {
    const headersList = await headers();
    const forwarded = headersList.get('x-forwarded-for');
    const rawIp = forwarded ? forwarded.split(',')[0].trim() : headersList.get('x-real-ip') || null;
    const ip = normalizeIP(rawIp);

    if (!ip) {
      return NextResponse.json({ blocked: false });
    }

    const blocked = isBlocked(ip);
    const res = NextResponse.json({ blocked, ip });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res;
  } catch (err) {
    console.error('Block me check error:', err);
    return NextResponse.json({ blocked: false }, { status: 500 });
  }
}
