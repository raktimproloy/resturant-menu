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
    
    // Check if there's an existing pending order for the same table
    if (body.tableNumber) {
      const existingPendingOrder = data.orders.find(
        order => order.tableNumber === body.tableNumber && order.status === 'pending'
      );
      
      if (existingPendingOrder) {
        // Merge new items into existing pending order
        const existingOrderIndex = data.orders.findIndex(order => order.id === existingPendingOrder.id);
        
        // Mark new items as later order items
        const newItems = (body.items || []).map(item => ({
          ...item,
          isLaterOrder: true,
          addedAt: new Date().toISOString(),
        }));
        
        // Combine items
        data.orders[existingOrderIndex].items = [
          ...data.orders[existingOrderIndex].items,
          ...newItems
        ];
        
        // Update total
        data.orders[existingOrderIndex].total = 
          (data.orders[existingOrderIndex].total || 0) + (body.total || 0);
        
        // Update priority to highest
        const priorityRank = { Low: 1, Medium: 2, High: 3 };
        const existingPriority = priorityRank[data.orders[existingOrderIndex].priority || 'Medium'] || 2;
        const newPriority = priorityRank[body.priority || 'Medium'] || 2;
        if (newPriority > existingPriority) {
          data.orders[existingOrderIndex].priority = body.priority || 'Medium';
        }
        
        // Update timestamp
        data.orders[existingOrderIndex].updatedAt = new Date().toISOString();
        data.orders[existingOrderIndex].hasLaterOrderItems = true;
        
        if (writeOrdersData(data, date)) {
          // Broadcast order update
          broadcastMessage('order_update', data.orders[existingOrderIndex]);
          
          return NextResponse.json({ 
            success: true, 
            message: 'Order merged with existing pending order',
            order: data.orders[existingOrderIndex],
            merged: true
          });
        } else {
          return NextResponse.json(
            { success: false, error: 'Failed to merge order' },
            { status: 500 }
          );
        }
      }
    }
    
    // Generate order ID
    const timestamp = Date.now();
    const orderId = `ORD-${timestamp}`;
    
    // Create new order (totalPrepTime in minutes for countdown)
    const newOrder = {
      id: orderId,
      tableNumber: body.tableNumber || null,
      items: body.items || [],
      total: body.total || 0,
      status: 'pending',
      priority: body.priority || 'Medium',
      totalPrepTime: body.totalPrepTime ?? 15, // minutes, for real-time countdown
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customerInfo: body.customerInfo || {},
      notes: body.notes || '',
      hasLaterOrderItems: false,
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
    
    const currentOrder = data.orders[orderIndex];
    const isAcceptingOrder = updateData.status === 'processing' && currentOrder.status === 'pending';
    
    // If accepting an order, check if there's already a processing order for the same table
    if (isAcceptingOrder && currentOrder.tableNumber) {
      // Check for existing processing order for the same table
      const existingProcessingOrder = data.orders.find(
        order => order.id !== id && 
        order.tableNumber === currentOrder.tableNumber && 
        (order.status === 'processing' || order.status === 'accepted')
      );
      
      if (existingProcessingOrder) {
        // Merge into existing processing order instead of creating a new one
        const processingOrderIndex = data.orders.findIndex(order => order.id === existingProcessingOrder.id);
        
        // Get all pending orders for the same table (including the one being accepted)
        const allPendingOrders = data.orders.filter(
          order => order.tableNumber === currentOrder.tableNumber && 
          order.status === 'pending'
        );
        
        let mergedItems = [...existingProcessingOrder.items];
        let mergedTotal = existingProcessingOrder.total || 0;
        let highestPriority = existingProcessingOrder.priority || 'Medium';
        
        const priorityRank = { Low: 1, Medium: 2, High: 3 };
        
        // Merge all pending orders (including the one being accepted) into the processing order
        allPendingOrders.forEach(pendingOrder => {
          // Mark items from pending orders as later order items
          const laterOrderItems = (pendingOrder.items || []).map(item => ({
            ...item,
            isLaterOrder: true,
            addedAt: pendingOrder.createdAt || new Date().toISOString(),
          }));
          
          mergedItems = [...mergedItems, ...laterOrderItems];
          mergedTotal += (pendingOrder.total || 0);
          
          // Update priority to highest
          const pendingPriority = priorityRank[pendingOrder.priority || 'Medium'] || 2;
          const currentPriority = priorityRank[highestPriority] || 2;
          if (pendingPriority > currentPriority) {
            highestPriority = pendingOrder.priority || 'Medium';
          }
        });
        
        // Update the existing processing order with merged data
        data.orders[processingOrderIndex] = {
          ...data.orders[processingOrderIndex],
          items: mergedItems,
          total: mergedTotal,
          priority: highestPriority,
          hasLaterOrderItems: true,
          updatedAt: new Date().toISOString(),
        };
        
        // Mark all pending orders (including the one being accepted) as cancelled (merged)
        allPendingOrders.forEach(pendingOrder => {
          const pendingIndex = data.orders.findIndex(order => order.id === pendingOrder.id);
          if (pendingIndex !== -1) {
            data.orders[pendingIndex] = {
              ...data.orders[pendingIndex],
              status: 'cancelled',
              mergedInto: existingProcessingOrder.id,
              updatedAt: new Date().toISOString(),
            };
          }
        });
        
        // Don't update the current order since it's being merged into the processing order
        // Instead, return the merged processing order
        if (writeOrdersData(data, orderDate)) {
          // Broadcast order update for the merged processing order
          broadcastMessage('order_update', data.orders[processingOrderIndex]);
          
          return NextResponse.json({ 
            success: true, 
            message: 'Order merged with existing processing order',
            order: data.orders[processingOrderIndex],
            merged: true
          });
        } else {
          return NextResponse.json(
            { success: false, error: 'Failed to merge order' },
            { status: 500 }
          );
        }
      } else {
        // No existing processing order, check for other pending orders to merge
        const otherPendingOrders = data.orders.filter(
          order => order.id !== id && 
          order.tableNumber === currentOrder.tableNumber && 
          order.status === 'pending'
        );
        
        if (otherPendingOrders.length > 0) {
          // Merge all pending orders into the current order
          let mergedItems = [...currentOrder.items];
          let mergedTotal = currentOrder.total || 0;
          let highestPriority = currentOrder.priority || 'Medium';
          
          const priorityRank = { Low: 1, Medium: 2, High: 3 };
          
          otherPendingOrders.forEach(pendingOrder => {
            // Mark items from pending orders as later order items
            const laterOrderItems = (pendingOrder.items || []).map(item => ({
              ...item,
              isLaterOrder: true,
              addedAt: pendingOrder.createdAt || new Date().toISOString(),
            }));
            
            mergedItems = [...mergedItems, ...laterOrderItems];
            mergedTotal += (pendingOrder.total || 0);
            
            // Update priority to highest
            const pendingPriority = priorityRank[pendingOrder.priority || 'Medium'] || 2;
            const currentPriority = priorityRank[highestPriority] || 2;
            if (pendingPriority > currentPriority) {
              highestPriority = pendingOrder.priority || 'Medium';
            }
          });
          
          // Update the current order with merged data
          updateData.items = mergedItems;
          updateData.total = mergedTotal;
          updateData.priority = highestPriority;
          updateData.hasLaterOrderItems = true;
          
          // Mark other pending orders as cancelled (merged)
          otherPendingOrders.forEach(pendingOrder => {
            const pendingIndex = data.orders.findIndex(order => order.id === pendingOrder.id);
            if (pendingIndex !== -1) {
              data.orders[pendingIndex] = {
                ...data.orders[pendingIndex],
                status: 'cancelled',
                mergedInto: id,
                updatedAt: new Date().toISOString(),
              };
            }
          });
        }
      }
    }

    // Store timestamps when status changes (for queue vs processing time)
    const nextStatus = updateData.status ?? currentOrder.status;
    const nowIso = new Date().toISOString();
    if (nextStatus === 'accepted' || nextStatus === 'processing') {
      if (!currentOrder.acceptedAt) updateData.acceptedAt = nowIso;
    }
    if (nextStatus === 'completed') {
      updateData.completedAt = nowIso;
      // Persist total queue time and total processing time (in seconds)
      const created = currentOrder.createdAt ? new Date(currentOrder.createdAt).getTime() : null;
      const accepted = (currentOrder.acceptedAt || updateData.acceptedAt) ? new Date(currentOrder.acceptedAt || updateData.acceptedAt).getTime() : null;
      const completed = new Date(nowIso).getTime();
      if (created != null && accepted != null) {
        updateData.queueTimeSeconds = Math.round((accepted - created) / 1000);
      }
      if (accepted != null) {
        updateData.processingTimeSeconds = Math.round((completed - accepted) / 1000);
      }
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

