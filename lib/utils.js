/**
 * Get today's date string in YYYY-MM-DD format
 */
export function getTodayDateString() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Check if any of the item's categories are disabled.
 * @param {Object} item - Menu item with categoryIds[] or extra with categoryId/categoryLabel
 * @param {Array} categories - Categories with {id, label, enabled}
 * @returns {boolean} - True if item should be unavailable due to disabled category
 */
export function hasDisabledCategory(item, categories) {
  const disabled = (categories || []).filter((c) => c.enabled === false);
  if (disabled.length === 0) return false;

  const matches = (catRef) => {
    const s = String(catRef || '').toLowerCase();
    return disabled.some(
      (d) =>
        d.id == catRef ||
        String(d.id) === s ||
        (d.label && String(d.label).toLowerCase() === s)
    );
  };

  if (item.categoryIds && Array.isArray(item.categoryIds)) {
    return item.categoryIds.some(matches);
  }
  if (item.categoryId != null) return matches(item.categoryId);
  if (item.categoryLabel) return matches(item.categoryLabel);
  return false;
}

