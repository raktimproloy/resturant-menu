import { NextResponse } from 'next/server';

// Use global connections map
if (!global.connections) {
  global.connections = new Map();
}
const connections = global.connections;

/**
 * GET /api/websocket - Server-Sent Events endpoint for real-time updates
 * Query: ?role=owner|manager|waiter — used for role-based notification routing
 */
export async function GET(request) {
  const encoder = new TextEncoder();
  const connectionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') || null;

  const stream = new ReadableStream({
    start(controller) {
      connections.set(connectionId, { controller, role });
      
      // Send initial connection message
      const initData = JSON.stringify({ 
        type: 'connected', 
        id: connectionId,
        timestamp: new Date().toISOString()
      });
      controller.enqueue(encoder.encode(`data: ${initData}\n\n`));
      
      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = JSON.stringify({ 
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          });
          controller.enqueue(encoder.encode(`data: ${heartbeat}\n\n`));
        } catch (error) {
          clearInterval(heartbeatInterval);
        }
      }, 30000);
      
      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        connections.delete(connectionId);
        try {
          controller.close();
        } catch (error) {
          // Connection already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

