import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { testInfo } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { validateRequest } from '@/lib/auth-utils';

// GET - Ambil semua data ulangan milik pengguna yang login
export async function GET() {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await db
      .select()
      .from(testInfo)
      .where(eq(testInfo.userId, parseInt(user.id)))
      .orderBy(desc(testInfo.updatedAt));

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching test data:', error);
    return NextResponse.json({
      error: 'Gagal mengambil data',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// DELETE - Hapus data ulangan
export async function DELETE(req: Request) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await req.json();

    // Pastikan hanya pengguna yang memiliki data ini yang bisa menghapus
    const existing = await db
      .select()
      .from(testInfo)
      .where(eq(testInfo.id, id))
      .limit(1);

    if (existing.length === 0 || existing[0].userId !== parseInt(user.id)) {
      return NextResponse.json(
        { error: 'Data tidak ditemukan atau tidak berhak' },
        { status: 403 }
      );
    }

    await db.delete(testInfo).where(eq(testInfo.id, id));

    return NextResponse.json({
      success: true,
      message: 'Data berhasil dihapus',
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting test data:', error);
    return NextResponse.json({
      error: 'Gagal menghapus data',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
