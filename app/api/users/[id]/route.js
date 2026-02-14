import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';

/**
 * GET /api/users/[id] - Get a single user
 */
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const admin = await Admin.findById(id).select('-password').lean();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: admin._id.toString(),
        username: admin.username,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[id] - Update a user
 */
export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { username, email, password, role } = body;

    const admin = await Admin.findById(id);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (username !== undefined) admin.username = username.trim();
    if (email !== undefined) admin.email = email.toLowerCase().trim();
    if (role !== undefined) {
      const validRoles = ['owner', 'manager', 'cashier', 'waiter'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { success: false, error: 'Invalid role' },
          { status: 400 }
        );
      }
      admin.role = role;
    }
    if (password && password.length >= 6) {
      admin.password = password;
    }

    await admin.save();

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: admin._id.toString(),
        username: admin.username,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Email or username already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id] - Delete a user
 */
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const admin = await Admin.findByIdAndDelete(id);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
