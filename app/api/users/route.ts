import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// GET - Mengambil semua users (admin only)
export async function GET(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users);

    return NextResponse.json({
      success: true,
      data: allUsers,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Membuat user baru (admin only)
export async function POST(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Cek apakah email sudah ada
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { message: 'Email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user baru
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role || 'user',
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      });

    return NextResponse.json({
      success: true,
      data: newUser,
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update user (admin only)
export async function PUT(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { id, name, email, password, role } = await req.json();

    if (!id) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Cek apakah user ada
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, id));

    if (existingUser.length === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Jika email diubah, cek apakah email baru sudah digunakan
    if (email && email.toLowerCase() !== existingUser[0].email) {
      const emailExists = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()));

      if (emailExists.length > 0) {
        return NextResponse.json(
          { message: 'Email already exists' },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (role) updateData.role = role;
    if (password && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Hapus user (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Cek apakah user mencoba menghapus dirinya sendiri
    if (id === user.id) {
      return NextResponse.json(
        { message: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Hapus user
    await db.delete(users).where(eq(users.id, id));

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
