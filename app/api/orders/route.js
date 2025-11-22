import { NextResponse } from 'next/server';
import { readOrdersData, writeOrdersData } from '@/lib/jsonHandler';
import { getTodayDateString } from '@/lib/utils';
import { broadcastMessage } from '@/lib/broadcast';

/**
 * GET /api/orders - Get all orders for today or specific date
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || getTodayDateString();
    
    const data = readOrdersData(date);
    return NextResponse.json({ success: true, orders: data.orders || [], date });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders - Create a new order
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const date = body.date || getTodayDateString();
    
    const data = readOrdersData(date);
    
    // Generate order ID
    const timestamp = Date.now();
    const orderId = `ORD-${timestamp}`;
    
    // Create new order
    const newOrder = {
      id: orderId,
      tableNumber: body.tableNumber || null,
      items: body.items || [],
      total: body.total || 0,
      status: 'pending', // pending, accepted, processing, completed, cancelled
      priority: body.priority || 'Medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customerInfo: body.customerInfo || {},
      notes: body.notes || '',
    };
    
    data.orders.push(newOrder);
    
    if (writeOrdersData(data, date)) {
      // Broadcast new order
      broadcastMessage('new_order', newOrder);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Order created successfully',
        order: newOrder 
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to save order' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/orders - Update an order
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, date, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    const orderDate = date || getTodayDateString();
    const data = readOrdersData(orderDate);
    const orderIndex = data.orders.findIndex(order => order.id === id);
    
    if (orderIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Update the order
    data.orders[orderIndex] = {
      ...data.orders[orderIndex],
      ...updateData,
      id: id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    };
    
    if (writeOrdersData(data, orderDate)) {
      // Broadcast order update
      broadcastMessage('order_update', data.orders[orderIndex]);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Order updated successfully',
        order: data.orders[orderIndex]
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to update order' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/orders - Delete an order (cancel)
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const date = searchParams.get('date') || getTodayDateString();
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    const data = readOrdersData(date);
    const orderIndex = data.orders.findIndex(order => order.id === id);
    
    if (orderIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Mark as cancelled instead of deleting
    data.orders[orderIndex] = {
      ...data.orders[orderIndex],
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    };
    
    if (writeOrdersData(data, date)) {
      // Broadcast order cancellation
      broadcastMessage('order_update', data.orders[orderIndex]);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Order cancelled successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to cancel order' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}

