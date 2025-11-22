import fs from 'fs';
import path from 'path';
import { getTodayDateString } from './utils';

const MENU_FILE_PATH = path.join(process.cwd(), 'public', 'data', 'menu.json');
const EXTRAS_FILE_PATH = path.join(process.cwd(), 'public', 'data', 'extras.json');
const CATEGORIES_FILE_PATH = path.join(process.cwd(), 'public', 'data', 'categories.json');

/**
 * Read menu data from JSON file
 */
export function readMenuData() {
  try {
    const fileData = fs.readFileSync(MENU_FILE_PATH, 'utf8');
    return JSON.parse(fileData);
  } catch (error) {
    console.error('Error reading menu data:', error);
    return { menu: [] };
  }
}

/**
 * Write menu data to JSON file
 */
export function writeMenuData(data) {
  try {
    fs.writeFileSync(MENU_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing menu data:', error);
    return false;
  }
}

/**
 * Read extras data from JSON file
 */
export function readExtrasData() {
  try {
    const fileData = fs.readFileSync(EXTRAS_FILE_PATH, 'utf8');
    return JSON.parse(fileData);
  } catch (error) {
    console.error('Error reading extras data:', error);
    return { extras: [] };
  }
}

/**
 * Write extras data to JSON file
 */
export function writeExtrasData(data) {
  try {
    fs.writeFileSync(EXTRAS_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing extras data:', error);
    return false;
  }
}

/**
 * Read categories data from JSON file
 */
export function readCategoriesData() {
  try {
    const fileData = fs.readFileSync(CATEGORIES_FILE_PATH, 'utf8');
    return JSON.parse(fileData);
  } catch (error) {
    console.error('Error reading categories data:', error);
    return { categories: [] };
  }
}

/**
 * Write categories data to JSON file
 */
export function writeCategoriesData(data) {
  try {
    fs.writeFileSync(CATEGORIES_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing categories data:', error);
    return false;
  }
}

/**
 * Calculate final price with discount
 */
export function calculateFinalPrice(price, discount) {
  if (!discount) return price;
  
  if (discount.type === 'percentage') {
    return price - (price * discount.value / 100);
  } else if (discount.type === 'price') {
    return Math.max(0, price - discount.value);
  }
  
  return price;
}


/**
 * Get order file path for a specific date
 */
export function getOrderFilePath(date = null) {
  const dateStr = date || getTodayDateString();
  const orderDir = path.join(process.cwd(), 'public', 'order', dateStr);
  return path.join(orderDir, 'orders.json');
}

/**
 * Ensure order directory exists
 */
export function ensureOrderDirectory(date = null) {
  const dateStr = date || getTodayDateString();
  const orderDir = path.join(process.cwd(), 'public', 'order', dateStr);
  if (!fs.existsSync(orderDir)) {
    fs.mkdirSync(orderDir, { recursive: true });
  }
  return orderDir;
}

/**
 * Read orders data from JSON file for a specific date
 */
export function readOrdersData(date = null) {
  try {
    ensureOrderDirectory(date);
    const filePath = getOrderFilePath(date);
    if (!fs.existsSync(filePath)) {
      return { orders: [] };
    }
    const fileData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileData);
  } catch (error) {
    console.error('Error reading orders data:', error);
    return { orders: [] };
  }
}

/**
 * Write orders data to JSON file for a specific date
 */
export function writeOrdersData(data, date = null) {
  try {
    ensureOrderDirectory(date);
    const filePath = getOrderFilePath(date);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing orders data:', error);
    return false;
  }
}


