import { NextResponse } from 'next/server';
import { readExtrasData, writeExtrasData } from '@/lib/jsonHandler';
import { saveImage, deleteImage, deleteImages } from '@/lib/imageUpload';

/**
 * GET /api/extras - Get all extra items
 */
export async function GET() {
  try {
    const data = readExtrasData();
    return NextResponse.json({ success: true, extras: data.extras || [] });
  } catch (error) {
    console.error('Error fetching extras:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch extra items' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/extras - Add a new extra item
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
        id: formData.get('id') || '',
        name: formData.get('name') || 'Untitled Extra',
        price: parseFloat(formData.get('price')) || 0,
        categoryId: formData.get('categoryId') || 'other',
        categoryLabel: formData.get('categoryLabel') || 'Other',
      };

      // Handle image uploads
      const imageFiles = formData.getAll('images');
      if (imageFiles && imageFiles.length > 0) {
        // Save all uploaded images
        for (const file of imageFiles) {
          if (file && file instanceof File) {
            try {
              const imagePath = await saveImage(file, body.id, 'extra');
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

    const data = readExtrasData();
    
    // Check if ID already exists
    if (body.id && data.extras.some(item => item.id === body.id)) {
      return NextResponse.json(
        { success: false, error: 'Extra item with this ID already exists' },
        { status: 400 }
      );
    }
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Extra item ID is required' },
        { status: 400 }
      );
    }
    
    // Create new extra item
    const newItem = {
      id: body.id,
      name: body.name || 'Untitled Extra',
      price: Number(body.price) || 0,
      categoryId: body.categoryId || 'other',
      categoryLabel: body.categoryLabel || 'Other',
      images: uploadedImages,
    };
    
    data.extras.push(newItem);
    
    if (writeExtrasData(data)) {
      return NextResponse.json({ 
        success: true, 
        message: 'Extra item added successfully',
        item: newItem 
      });
    } else {
      // Clean up uploaded images if save failed
      deleteImages(uploadedImages);
      return NextResponse.json(
        { success: false, error: 'Failed to save extra item' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error adding extra item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add extra item: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/extras - Update an extra item
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
      const id = formData.get('id');
      
      if (!id) {
        return NextResponse.json(
          { success: false, error: 'Extra item ID is required' },
          { status: 400 }
        );
      }

      // Extract text fields
      body = {
        id: id,
        name: formData.get('name'),
        price: formData.get('price') ? parseFloat(formData.get('price')) : undefined,
        categoryId: formData.get('categoryId'),
        categoryLabel: formData.get('categoryLabel'),
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
              const imagePath = await saveImage(file, id, 'extra');
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
        { success: false, error: 'Extra item ID is required' },
        { status: 400 }
      );
    }
    
    const data = readExtrasData();
    const itemIndex = data.extras.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Extra item not found' },
        { status: 404 }
      );
    }

    // Store old images for cleanup
    const oldImages = data.extras[itemIndex].images || [];

    // Delete specified images
    if (imagesToDelete && Array.isArray(imagesToDelete) && imagesToDelete.length > 0) {
      imagesToDelete.forEach(imgPath => {
        deleteImage(imgPath);
      });
    }

    // Handle image updates
    if (updateData.images !== undefined) {
      updateData.images = uploadedImages;
    } else if (imagesToDelete && imagesToDelete.length > 0) {
      updateData.images = oldImages.filter(img => !imagesToDelete.includes(img));
    } else if (uploadedImages.length > 0) {
      updateData.images = [...oldImages, ...uploadedImages];
    }
    
    // Update the item
    data.extras[itemIndex] = {
      ...data.extras[itemIndex],
      ...updateData,
      id: id, // Ensure ID doesn't change
    };
    
    if (writeExtrasData(data)) {
      return NextResponse.json({ 
        success: true, 
        message: 'Extra item updated successfully',
        item: data.extras[itemIndex]
      });
    } else {
      // Clean up uploaded images if save failed
      deleteImages(uploadedImages);
      return NextResponse.json(
        { success: false, error: 'Failed to update extra item' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating extra item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update extra item: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/extras - Delete an extra item
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Extra item ID is required' },
        { status: 400 }
      );
    }
    
    const data = readExtrasData();
    const itemIndex = data.extras.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Extra item not found' },
        { status: 404 }
      );
    }

    // Delete associated images
    const item = data.extras[itemIndex];
    if (item.images && Array.isArray(item.images)) {
      deleteImages(item.images);
    }
    
    data.extras.splice(itemIndex, 1);
    
    if (writeExtrasData(data)) {
      return NextResponse.json({ 
        success: true, 
        message: 'Extra item deleted successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to delete extra item' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting extra item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete extra item' },
      { status: 500 }
    );
  }
}


