import { NextResponse } from 'next/server';
import { readCategoriesData, writeCategoriesData } from '@/lib/jsonHandler';

/**
 * GET /api/categories - Get all categories
 * Ensures "Other" category always exists for extras that don't match other categories
 */
export async function GET() {
  try {
    const data = readCategoriesData();
    let categories = data.categories || [];
    
    // Ensure "Other" category exists
    const hasOtherCategory = categories.some(cat => 
      cat.label.toLowerCase() === 'other' || cat.id === 'other' || cat.label === 'Other'
    );
    
    if (!hasOtherCategory) {
      const maxId = categories.length > 0 
        ? Math.max(...categories.map(cat => cat.id || 0))
        : 0;
      categories.push({
        id: maxId + 1,
        label: 'Other'
      });
      
      // Save the updated categories
      data.categories = categories;
      writeCategoriesData(data);
    }
    
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories - Add a new category
 */
export async function POST(request) {
  try {
    const body = await request.json();

    const data = readCategoriesData();

    // Generate new ID
    const maxId = data.categories.length > 0
      ? Math.max(...data.categories.map(item => item.id || 0))
      : 0;
    const newId = maxId + 1;

    // Create new category
    const newCategory = {
      id: newId,
      label: body.label || 'New Category',
    };

    data.categories.push(newCategory);

    if (writeCategoriesData(data)) {
      return NextResponse.json({
        success: true,
        message: 'Category added successfully',
        category: newCategory
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to save category' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error adding category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add category: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/categories - Update a category
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const data = readCategoriesData();
    const categoryIndex = data.categories.findIndex(category => category.id === id);

    if (categoryIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Update the category
    data.categories[categoryIndex] = {
      ...data.categories[categoryIndex],
      ...updateData,
      id: id, // Ensure ID doesn't change
    };

    if (writeCategoriesData(data)) {
      return NextResponse.json({
        success: true,
        message: 'Category updated successfully',
        category: data.categories[categoryIndex]
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to update category' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update category: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories - Delete a category
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id'));

    if (!id || isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Valid category ID is required' },
        { status: 400 }
      );
    }

    const data = readCategoriesData();
    const categoryIndex = data.categories.findIndex(category => category.id === id);

    if (categoryIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    data.categories.splice(categoryIndex, 1);

    if (writeCategoriesData(data)) {
      return NextResponse.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to delete category' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
