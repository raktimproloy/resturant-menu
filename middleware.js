import { NextResponse } from 'next/server';

function normalizeIP(ip) {
  if (!ip) return ip;
  if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
  return ip;
}

/**
 * Injects client IP into request headers and enforces block list.
 * Blocked IPs are redirected to /blocked for 10 minutes.
 */
export async function middleware(request) {
  const pathname = request.nextUrl.pathname;

  const forwarded = request.headers.get('x-forwarded-for');
  const rawIp = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || null;
  const ip = normalizeIP(rawIp);

  // Always inject normalized IP for API routes (including /api/block/me)
  const requestHeaders = new Headers(request.headers);
  if (ip) requestHeaders.set('x-real-ip', ip);

  // Allow blocked page and block API through (no block check)
  if (pathname === '/blocked' || pathname.startsWith('/api/block')) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Check block list (skip if no IP, e.g. localhost without proxy)
  if (ip && ip !== '127.0.0.1' && ip !== '::1') {
    try {
      const base = request.nextUrl.origin;
      const res = await fetch(`${base}/api/block?ip=${encodeURIComponent(ip)}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data = await res.json();
      if (data.blocked) {
        const rewrite = NextResponse.rewrite(new URL('/blocked', request.url));
        rewrite.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        return rewrite;
      }
    } catch {
      // Allow through if check fails
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files and _next
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
