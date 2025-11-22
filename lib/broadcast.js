// Shared broadcast utility for server-side use

// Use global connections map
if (!global.connections) {
  global.connections = new Map();
}

/**
 * Broadcast a message to all connected SSE clients
 */
export function broadcastMessage(type, data) {
  const connections = global.connections;
  const message = JSON.stringify({ 
    type, 
    data, 
    timestamp: new Date().toISOString() 
  });
  
  let sentCount = 0;
  const encoder = new TextEncoder();
  
  const deadConnections = [];
  connections.forEach((controller, connectionId) => {
    try {
      controller.enqueue(encoder.encode(`data: ${message}\n\n`));
      sentCount++;
    } catch (error) {
      console.error('Error broadcasting to connection:', error);
      // Mark for removal
      deadConnections.push(connectionId);
    }
  });
  
  // Remove dead connections
  deadConnections.forEach(connectionId => connections.delete(connectionId));
  
  return sentCount;
}

