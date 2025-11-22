import { NextResponse } from 'next/server';
import { readExtrasData, writeExtrasData } from '@/lib/jsonHandler';

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
 */
export async function POST(request) {
  try {
    const body = await request.json();
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
      price: body.price || 0,
      categoryId: body.categoryId || 'other',
      categoryLabel: body.categoryLabel || 'Other',
    };
    
    data.extras.push(newItem);
    
    if (writeExtrasData(data)) {
      return NextResponse.json({ 
        success: true, 
        message: 'Extra item added successfully',
        item: newItem 
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to save extra item' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error adding extra item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add extra item' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/extras - Update an extra item
 */
export async function PUT(request) {
  try {
    const body = await request.json();
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
      return NextResponse.json(
        { success: false, error: 'Failed to update extra item' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating extra item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update extra item' },
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


