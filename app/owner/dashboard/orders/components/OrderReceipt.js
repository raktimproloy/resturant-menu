import React from 'react';

export default function OrderReceipt({ order }) {
  if (!order) return null;

  return (
    <div className="hidden print:block fixed inset-0 bg-white z-[100] p-0 m-0">
      <div className="w-[80mm] mx-auto p-4 text-black font-mono text-sm">
        <div className="text-center mb-4 border-b border-black pb-2">
          <h1 className="text-xl font-bold uppercase">The Midnight Kitchen</h1>
          <p className="text-xs">Order Receipt</p>
          <p className="text-xs">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between font-bold text-lg">
            <span>Order #{order.id.slice(-4)}</span>
            <span>Table {order.tableNumber}</span>
          </div>
          <div className="text-xs mt-1">
            Type: {order.priority || 'Standard'}
          </div>
        </div>

        <div className="border-b border-black border-dashed mb-4"></div>

        <div className="space-y-2 mb-4">
          {order.items.map((item, idx) => (
            <div key={idx}>
              <div className="flex justify-between font-bold">
                <span>{item.quantity}x {item.name}</span>
                <span>{(item.finalPrice || item.price) * item.quantity}</span>
              </div>
              {item.extras && item.extras.length > 0 && (
                <div className="text-xs pl-4">
                  {item.extras.map((ex, i) => (
                    <div key={i} className="flex justify-between">
                      <span>+ {ex.qty}x {ex.name}</span>
                      <span>{ex.price * ex.qty}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-b border-black border-dashed mb-4"></div>

        <div className="flex justify-between text-xl font-bold mb-8">
          <span>TOTAL</span>
          <span>{Number(order.total).toFixed(2)} BDT</span>
        </div>

        <div className="text-center text-xs">
          <p>Thank you for dining with us!</p>
        </div>
      </div>
    </div>
  );
}
