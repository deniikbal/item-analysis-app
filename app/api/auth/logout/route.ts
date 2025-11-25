import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { validateRequest } from '@/lib/auth-utils';

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
    await auth.invalidateSession(session.sessionId);

    // Hapus cookie sesi
    const authRequest = auth.handleRequest(req);
    authRequest.setSession(null);

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