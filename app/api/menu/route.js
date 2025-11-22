import { NextResponse } from 'next/server';
import { readMenuData, writeMenuData, calculateFinalPrice } from '@/lib/jsonHandler';
import { saveImage, deleteImage, deleteImages } from '@/lib/imageUpload';

/**
 * GET /api/menu - Get all menu items
 */
export async function GET() {
  try {
    const data = readMenuData();
    return NextResponse.json({ success: true, menu: data.menu || [] });
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/menu - Add a new menu item
 * Supports both JSON and FormData (for image uploads)
 */
export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let body, uploadedImages = [];

    // Check if it's FormData (file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      
      // Extract text fields
      body = {
        name: formData.get('name') || 'Untitled Item',
        categoryId: formData.get('categoryId') || 'other',
        categoryLabel: formData.get('categoryLabel') || 'Other',
        time: parseInt(formData.get('time')) || 15,
        price: parseFloat(formData.get('price')) || 0,
        status: formData.get('status') || 'Available',
        tag: formData.get('tag') || null,
        uses: formData.get('uses') || '',
        mainItems: formData.get('mainItems') ? JSON.parse(formData.get('mainItems')) : [],
        extraItemIds: formData.get('extraItemIds') ? JSON.parse(formData.get('extraItemIds')) : [],
        discount: formData.get('discount') ? JSON.parse(formData.get('discount')) : null,
        discountType: formData.get('discountType') || null,
        discountValue: formData.get('discountValue') ? parseFloat(formData.get('discountValue')) : null,
      };

      // Handle image uploads
      const imageFiles = formData.getAll('images');
      if (imageFiles && imageFiles.length > 0) {
        // Generate ID first to use in filename
        const data = readMenuData();
        const maxId = data.menu.length > 0 
          ? Math.max(...data.menu.map(item => item.id || 0))
          : 0;
        const newId = maxId + 1;

        // Save all uploaded images
        for (const file of imageFiles) {
          if (file && file instanceof File) {
            try {
              const imagePath = await saveImage(file, newId);
              uploadedImages.push(imagePath);
            } catch (error) {
              console.error('Error saving image:', error);
              // Continue with other images even if one fails
            }
          }
        }
      }

      // Add any existing image URLs from formData
      const existingImages = formData.get('existingImages');
      if (existingImages) {
        const parsed = JSON.parse(existingImages);
        if (Array.isArray(parsed)) {
          uploadedImages = [...uploadedImages, ...parsed];
        }
      }
    } else {
      // Regular JSON request
      body = await request.json();
      uploadedImages = body.images || [];
    }

    const data = readMenuData();
    
    // Generate new ID
    const maxId = data.menu.length > 0 
      ? Math.max(...data.menu.map(item => item.id || 0))
      : 0;
    const newId = maxId + 1;
    
    // Calculate final price with discount
    const finalPrice = calculateFinalPrice(body.price || 0, body.discount);
    
    // Create new menu item
    const newItem = {
      id: newId,
      name: body.name || 'Untitled Item',
      categoryId: body.categoryId || 'other',
      categoryLabel: body.categoryLabel || 'Other',
      time: body.time || 15,
      price: body.price || 0,
      finalPrice: finalPrice,
      status: body.status || 'Available',
      tag: body.tag || null,
      mainItems: body.mainItems || [],
      uses: body.uses || '',
      extraItemIds: body.extraItemIds || [],
      images: uploadedImages,
      discount: body.discount || null,
    };
    
    data.menu.push(newItem);
    
    if (writeMenuData(data)) {
      return NextResponse.json({ 
        success: true, 
        message: 'Menu item added successfully',
        item: newItem 
      });
    } else {
      // Clean up uploaded images if save failed
      deleteImages(uploadedImages);
      return NextResponse.json(
        { success: false, error: 'Failed to save menu item' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error adding menu item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add menu item: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/menu - Update a menu item
 * Supports both JSON and FormData (for image uploads)
 */
export async function PUT(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let body, uploadedImages = [];
    let imagesToDelete = [];

    // Check if it's FormData (file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const id = parseInt(formData.get('id'));
      
      if (!id) {
        return NextResponse.json(
          { success: false, error: 'Menu item ID is required' },
          { status: 400 }
        );
      }

      // Extract text fields
      body = {
        id: id,
        name: formData.get('name'),
        categoryId: formData.get('categoryId'),
        categoryLabel: formData.get('categoryLabel'),
        time: formData.get('time') ? parseInt(formData.get('time')) : undefined,
        price: formData.get('price') ? parseFloat(formData.get('price')) : undefined,
        status: formData.get('status'),
        tag: formData.get('tag'),
        uses: formData.get('uses'),
        mainItems: formData.get('mainItems') ? JSON.parse(formData.get('mainItems')) : undefined,
        extraItemIds: formData.get('extraItemIds') ? JSON.parse(formData.get('extraItemIds')) : undefined,
        discount: formData.get('discount') ? JSON.parse(formData.get('discount')) : undefined,
      };

      // Get existing images to keep
      const existingImages = formData.get('existingImages');
      if (existingImages) {
        const parsed = JSON.parse(existingImages);
        if (Array.isArray(parsed)) {
          uploadedImages = [...parsed];
        }
      }

      // Handle new image uploads
      const imageFiles = formData.getAll('images');
      if (imageFiles && imageFiles.length > 0) {
        for (const file of imageFiles) {
          if (file && file instanceof File) {
            try {
              const imagePath = await saveImage(file, id);
              uploadedImages.push(imagePath);
            } catch (error) {
              console.error('Error saving image:', error);
            }
          }
        }
      }

      // Get images to delete
      const deleteImagesParam = formData.get('deleteImages');
      if (deleteImagesParam) {
        imagesToDelete = JSON.parse(deleteImagesParam);
      }
    } else {
      // Regular JSON request
      body = await request.json();
      const { id, ...updateData } = body;
      body.id = id;
      Object.assign(body, updateData);
      
      // Handle images in JSON
      if (updateData.images !== undefined) {
        uploadedImages = updateData.images;
      }
      if (updateData.deleteImages) {
        imagesToDelete = updateData.deleteImages;
      }
    }
    
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Menu item ID is required' },
        { status: 400 }
      );
    }
    
    const data = readMenuData();
    const itemIndex = data.menu.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Menu item not found' },
        { status: 404 }
      );
    }

    // Store old images for cleanup
    const oldImages = data.menu[itemIndex].images || [];

    // Delete specified images
    if (imagesToDelete && Array.isArray(imagesToDelete) && imagesToDelete.length > 0) {
      imagesToDelete.forEach(imgPath => {
        deleteImage(imgPath);
      });
    }

    // Handle image updates
    // If images are provided in updateData (FormData or JSON), use them
    // Otherwise, keep existing images but remove deleted ones
    if (updateData.images !== undefined) {
      // Images are being explicitly updated
      updateData.images = uploadedImages;
    } else if (imagesToDelete && imagesToDelete.length > 0) {
      // Only deleting images, keep the rest
      updateData.images = oldImages.filter(img => !imagesToDelete.includes(img));
    } else if (uploadedImages.length > 0) {
      // Only adding new images, keep existing ones
      updateData.images = [...oldImages, ...uploadedImages];
    }
    // If none of the above, images stay as they are (not in updateData)
    
    // Calculate final price with discount
    const price = updateData.price !== undefined ? updateData.price : data.menu[itemIndex].price;
    const discount = updateData.discount !== undefined ? updateData.discount : data.menu[itemIndex].discount;
    const finalPrice = calculateFinalPrice(price, discount);
    
    // Update the item
    data.menu[itemIndex] = {
      ...data.menu[itemIndex],
      ...updateData,
      id: id, // Ensure ID doesn't change
      finalPrice: finalPrice,
    };
    
    if (writeMenuData(data)) {
      return NextResponse.json({ 
        success: true, 
        message: 'Menu item updated successfully',
        item: data.menu[itemIndex]
      });
    } else {
      // Clean up uploaded images if save failed
      deleteImages(uploadedImages);
      return NextResponse.json(
        { success: false, error: 'Failed to update menu item' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating menu item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update menu item: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/menu - Delete a menu item
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id'));
    
    if (!id || isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Valid menu item ID is required' },
        { status: 400 }
      );
    }
    
    const data = readMenuData();
    const itemIndex = data.menu.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Menu item not found' },
        { status: 404 }
      );
    }

    // Delete associated images
    const item = data.menu[itemIndex];
    if (item.images && Array.isArray(item.images)) {
      deleteImages(item.images);
    }
    
    data.menu.splice(itemIndex, 1);
    
    if (writeMenuData(data)) {
      return NextResponse.json({ 
        success: true, 
        message: 'Menu item deleted successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to delete menu item' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete menu item' },
      { status: 500 }
    );
  }
}

