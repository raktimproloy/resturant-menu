/**
 * Get today's date string in YYYY-MM-DD format
 */
export function getTodayDateString() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

