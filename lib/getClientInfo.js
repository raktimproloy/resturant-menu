/**
 * Extract client/device information from an incoming request.
 * Used for order tracking on local WiFi networks.
 *
 * Captures: IP, MAC (via ARP on same subnet), User-Agent, headers.
 * MAC resolution works when server and client are on the same local network.
 */

/**
 * Get client IP from request headers.
 * @param {Headers} headers - Request headers (from request.headers)
 * @returns {string|null} Client IP or null
 */
function getClientIP(headers) {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp;
  return null;
}

/** Normalize IPv6-mapped IPv4 (::ffff:192.168.1.1) to IPv4 for ARP lookup */
function normalizeIP(ip) {
  if (!ip) return ip;
  if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
  return ip;
}

/**
 * Resolve MAC address from IP using system ARP table.
 * Works on local networks when client and server are on same subnet.
 * @param {string} ip - Client IP address
 * @returns {Promise<string|null>} MAC address or null
 */
async function resolveMACFromIP(ip) {
  const normalized = normalizeIP(ip);
  if (!normalized || normalized === '127.0.0.1' || normalized === '::1') {
    return null;
  }
  try {
    const arp = (await import('@network-utils/arp-lookup')).default;
    const mac = await arp.toMAC(normalized);
    return mac && typeof mac === 'string' ? mac : null;
  } catch {
    return null;
  }
}

/**
 * Parse User-Agent for display-friendly browser/OS info.
 * @param {string} ua - User-Agent string
 * @returns {{ browser: string, os: string, deviceType: string }}
 */
function parseUserAgent(ua) {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', deviceType: 'Unknown' };
  let browser = 'Unknown';
  let os = 'Unknown';
  let deviceType = 'Desktop';

  // Browser
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/') && !ua.includes('Chromium')) browser = 'Chrome';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera';

  // OS
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = ua.includes('iPad') ? 'iPadOS' : 'iOS';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';

  // Device type
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    deviceType = 'Mobile';
  }

  return { browser, os, deviceType };
}

/**
 * Extract full client info from a request.
 * @param {Request} request - Next.js/Web API Request
 * @param {Object} [clientPayload] - Optional device info sent from client (timezone, screen, etc.)
 * @returns {Promise<Object>} Client/device info object
 */
export async function getClientInfo(request, clientPayload = {}) {
  const headers = request.headers;
  const ip = getClientIP(headers);
  const userAgent = headers.get('user-agent') || '';
  const { browser, os, deviceType } = parseUserAgent(userAgent);

  const mac = ip ? await resolveMACFromIP(ip) : null;
  const normalizedIp = ip ? normalizeIP(ip) : null;

  return {
    ip: normalizedIp || ip || 'Unknown',
    mac: mac || null,
    userAgent,
    browser,
    os,
    deviceType,
    language: headers.get('accept-language')?.split(',')[0]?.trim() || null,
    referer: headers.get('referer') || null,
    accept: headers.get('accept')?.split(',')[0]?.trim() || null,
    capturedAt: new Date().toISOString(),
    // Client-sent data (from browser)
    ...clientPayload,
  };
}
