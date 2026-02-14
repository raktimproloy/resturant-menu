import fs from 'fs';
import path from 'path';

const BLOCKED_FILE_PATH = path.join(process.cwd(), 'public', 'data', 'blocked.json');
const BLOCK_DURATION_MINUTES = 10;

function ensureDataDir() {
  const dir = path.dirname(BLOCKED_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Read blocked IPs: { "ip": "blockedUntil ISO string", ... }
 */
export function readBlockedList() {
  try {
    ensureDataDir();
    if (!fs.existsSync(BLOCKED_FILE_PATH)) {
      return {};
    }
    const data = fs.readFileSync(BLOCKED_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

/**
 * Write blocked list
 */
function writeBlockedList(data) {
  try {
    ensureDataDir();
    fs.writeFileSync(BLOCKED_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing blocked list:', err);
    return false;
  }
}

/**
 * Normalize IP (strip ::ffff: prefix)
 */
export function normalizeIP(ip) {
  if (!ip) return ip;
  if (typeof ip !== 'string') return ip;
  if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
  return ip;
}

/**
 * Block an IP for BLOCK_DURATION_MINUTES (10 min)
 * @param {string} ip - IP to block
 * @returns {boolean} success
 */
export function blockIP(ip) {
  const normalized = normalizeIP(ip);
  if (!normalized) return false;
  if (normalized === '127.0.0.1' || normalized === '::1') return false; // Never block localhost

  const blockedUntil = new Date(Date.now() + BLOCK_DURATION_MINUTES * 60 * 1000).toISOString();
  const list = readBlockedList();
  list[normalized] = blockedUntil;
  return writeBlockedList(list);
}

/**
 * Check if IP is currently blocked
 * @param {string} ip - IP to check
 * @returns {boolean}
 */
export function isBlocked(ip) {
  const normalized = normalizeIP(ip);
  if (!normalized) return false;
  if (normalized === '127.0.0.1' || normalized === '::1') return false;

  const list = readBlockedList();
  const blockedUntil = list[normalized];
  if (!blockedUntil) return false;

  if (new Date(blockedUntil) <= new Date()) {
    // Expired - remove
    delete list[normalized];
    writeBlockedList(list);
    return false;
  }
  return true;
}

/**
 * Unblock an IP
 * @param {string} ip - IP to unblock
 * @returns {boolean}
 */
export function unblockIP(ip) {
  const normalized = normalizeIP(ip);
  if (!normalized) return false;

  const list = readBlockedList();
  delete list[normalized];
  return writeBlockedList(list);
}

/**
 * Extend block time by minutes
 * @param {string} ip - IP to extend
 * @param {number} minutes - Minutes to add
 * @returns {boolean}
 */
export function extendBlock(ip, minutes = BLOCK_DURATION_MINUTES) {
  const normalized = normalizeIP(ip);
  if (!normalized) return false;

  const list = readBlockedList();
  const currentUntil = list[normalized];
  if (!currentUntil) return false;

  const base = new Date(currentUntil) > new Date() ? new Date(currentUntil) : new Date();
  const newUntil = new Date(base.getTime() + minutes * 60 * 1000).toISOString();
  list[normalized] = newUntil;
  return writeBlockedList(list);
}

/**
 * Get list of currently blocked IPs with their expiry times
 * @returns {Array<{ ip: string, blockedUntil: string }>}
 */
export function getBlockedList() {
  const list = readBlockedList();
  const now = new Date();
  const entries = Object.entries(list)
    .filter(([, until]) => new Date(until) > now)
    .map(([ip, blockedUntil]) => ({ ip, blockedUntil }));
  return entries;
}
