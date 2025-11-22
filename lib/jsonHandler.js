import fs from 'fs';
import path from 'path';

const MENU_FILE_PATH = path.join(process.cwd(), 'public', 'data', 'menu.json');
const EXTRAS_FILE_PATH = path.join(process.cwd(), 'public', 'data', 'extras.json');

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


