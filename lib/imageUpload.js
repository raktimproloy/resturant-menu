import fs from 'fs';
import path from 'path';

const IMAGES_DIR = path.join(process.cwd(), 'public', 'images');

// Ensure images directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

/**
 * Save uploaded image file
 * @param {File} file - The uploaded file
 * @param {string|number} itemId - Menu item ID or extra item ID for naming
 * @param {string} type - Type of item: 'menu' or 'extra' (default: 'menu')
 * @returns {Promise<string>} - The public URL path of the saved image
 */
export async function saveImage(file, itemId, type = 'menu') {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const prefix = type === 'extra' ? 'extra' : 'menu';
    const filename = `${prefix}-${itemId}-${timestamp}-${randomStr}.${fileExtension}`;
    const filepath = path.join(IMAGES_DIR, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    fs.writeFileSync(filepath, buffer);

    // Return public URL path
    return `/images/${filename}`;
  } catch (error) {
    console.error('Error saving image:', error);
    throw new Error('Failed to save image');
  }
}

/**
 * Delete image file
 * @param {string} imagePath - The image path (e.g., /images/filename.jpg)
 */
export function deleteImage(imagePath) {
  try {
    if (!imagePath || !imagePath.startsWith('/images/')) {
      return; // Invalid path or external URL
    }

    const filename = path.basename(imagePath);
    const filepath = path.join(IMAGES_DIR, filename);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
  }
}

/**
 * Delete multiple images
 * @param {string[]} imagePaths - Array of image paths
 */
export function deleteImages(imagePaths) {
  if (!Array.isArray(imagePaths)) return;
  
  imagePaths.forEach(path => {
    if (path && typeof path === 'string') {
      deleteImage(path);
    }
  });
}


