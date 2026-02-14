// Shared broadcast utility for server-side use

// Use global connections map: connectionId -> { controller, role }
if (!global.connections) {
  global.connections = new Map();
}

/**
 * Broadcast a message to SSE clients.
 * @param {string} type - Message type (e.g. 'new_order', 'call_waiter', 'order_update')
 * @param {object} data - Message payload
 * @param {object} [options] - Optional: { targetRoles: ['owner','waiter'] } — only send to these roles. Omit to send to all.
 */
export function broadcastMessage(type, data, options = {}) {
  const connections = global.connections;
  const targetRoles = options.targetRoles || null;
  const message = JSON.stringify({
    type,
    data,
    timestamp: new Date().toISOString(),
  });

  let sentCount = 0;
  const encoder = new TextEncoder();
  const deadConnections = [];

  connections.forEach((entry, connectionId) => {
    const { controller, role } = typeof entry === 'object' && entry !== null
      ? entry
      : { controller: entry, role: null };

    if (targetRoles && targetRoles.length > 0) {
      if (!role || !targetRoles.includes(role)) return;
    }

    try {
      controller.enqueue(encoder.encode(`data: ${message}\n\n`));
      sentCount++;
    } catch (error) {
      console.error('Error broadcasting to connection:', error);
      deadConnections.push(connectionId);
    }
  });

  deadConnections.forEach((id) => connections.delete(id));
  return sentCount;
}

