import { NextResponse } from 'next/server';
import { encrypt } from '@/lib/encryption';

/**
 * API endpoint to generate QR code data for a table
 * GET /api/generate-qr?table=1
 * Returns: { code: encryptedId, id: table-1, table: encryptedTable }
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tableNumber = searchParams.get('table');
    
    if (!tableNumber) {
      return NextResponse.json(
        { error: 'Table number is required' },
        { status: 400 }
      );
    }
    
    // Validate table number format (should be a number)
    const tableNum = parseInt(tableNumber);
    if (isNaN(tableNum) || tableNum <= 0) {
      return NextResponse.json(
        { error: 'Invalid table number. Must be a positive number.' },
        { status: 400 }
      );
    }
    
    // Generate encrypted values
    // The encrypted ID should be consistent for the same table (not changeable)
    const tableId = `table-${tableNum}`;
    const encryptedId = encrypt(`table-${tableNum}-restaurant-menu`);
    const encryptedTable = encrypt(tableNum.toString());
    
    // Generate the full URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const qrUrl = `${baseUrl}?code=${encodeURIComponent(encryptedId)}&id=${encodeURIComponent(tableId)}&table=${encodeURIComponent(encryptedTable)}`;
    
    return NextResponse.json({
      success: true,
      table: tableNum,
      qrData: {
        code: encryptedId,
        id: tableId,
        table: encryptedTable,
      },
      qrUrl: qrUrl,
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}

