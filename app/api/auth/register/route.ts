import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  // Validasi input
  if (!name || !email || !password) {
    return NextResponse.json(
      { message: 'Nama, email, dan password wajib diisi' },
      { status: 400 }
    );
  }

  // Validasi panjang password
  if (password.length < 6) {
    return NextResponse.json(
      { message: 'Password harus memiliki minimal 6 karakter' },
      { status: 400 }
    );
  }

  try {
    // Cek apakah email sudah terdaftar
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { message: 'Email sudah terdaftar' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat pengguna baru
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
      })
      .returning();

    // Buat sesi untuk pengguna yang baru terdaftar
    const session = await auth.createSession({
      userId: newUser.id,
      attributes: {},
    });

    // Set cookie sesi
    const authRequest = auth.handleRequest(req);
    authRequest.setSession(session);

    return NextResponse.json({
      success: true,
      message: 'Registrasi berhasil',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat registrasi' },
      { status: 500 }
    );
  }
}