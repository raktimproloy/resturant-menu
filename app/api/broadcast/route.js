import { NextResponse } from 'next/server';
import { broadcastMessage } from '@/lib/broadcast';

/**
 * POST /api/broadcast - Broadcast a message to all connected clients
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { type, data } = body;
    
    const sentCount = broadcastMessage(type, data);
    
    return NextResponse.json({ 
      success: true, 
      message: `Broadcasted to ${sentCount} connections` 
    });
  } catch (error) {
    console.error('Error broadcasting:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to broadcast message' },
      { status: 500 }
    );
  }
}


