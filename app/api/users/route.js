import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';

/**
 * GET /api/users - List all users (admin/owner only)
 */
export async function GET(request) {
  try {
    await connectDB();

    const admins = await Admin.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      users: admins.map((u) => ({
        id: u._id.toString(),
        username: u.username,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users - Create a new user (admin/owner only)
 */
export async function POST(request) {
  try {
    await connectDB();

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }
    const { username, email, password, role } = body || {};

    if (!username || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    const validRoles = ['owner', 'manager', 'cashier', 'waiter'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be: owner, manager, cashier, or waiter' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    if (username.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    const existingAdmin = await Admin.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { username: username.trim() }],
    });

    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: 'User with this email or username already exists' },
        { status: 400 }
      );
    }

    const admin = new Admin({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
    });

    await admin.save();

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: admin._id.toString(),
        username: admin.username,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Email or username already exists' },
        { status: 400 }
      );
    }
    if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors)[0];
      return NextResponse.json(
        { success: false, error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
