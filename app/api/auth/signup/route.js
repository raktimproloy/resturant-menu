import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { username, email, password, role } = body;

    // Validation
    if (!username || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (!['owner', 'manager', 'cashier'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ email }, { username }],
    });

    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin with this email or username already exists' },
        { status: 400 }
      );
    }

    // Create new admin
    const admin = new Admin({
      username,
      email,
      password,
      role,
    });

    await admin.save();

    // Return success (don't send password)
    return NextResponse.json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Email or username already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create admin account' },
      { status: 500 }
    );
  }
}


