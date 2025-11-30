import { NextRequest, NextResponse } from 'next/server';
import { lucia } from '@/lib/auth';
import { validateRequest } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { session } = await validateRequest();
    
    if (!session) {
      return NextResponse.json(
        { message: 'Tidak ada sesi yang aktif' },
        { status: 401 }
      );
    }

    // Hapus sesi
    await lucia.invalidateSession(session.id);

    // Hapus cookie sesi
    const sessionCookie = lucia.createBlankSessionCookie();
    const cookieStore = await cookies();
    cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return NextResponse.json({
      success: true,
      message: 'Logout berhasil',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat logout' },
      { status: 500 }
    );
  }
}