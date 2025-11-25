import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { testInfo } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { validateRequest } from '@/lib/auth-utils';

// GET - Ambil data ulangan terakhir milik pengguna yang login
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
      .where(eq(testInfo.userId, user.id))
      .orderBy(testInfo.updatedAt)
      .limit(1);

    if (data.length === 0) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    return NextResponse.json({ data: data[0] }, { status: 200 });
  } catch (error) {
    console.error('Error fetching test info:', error);
    return NextResponse.json({
      error: 'Gagal mengambil data',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// POST - Simpan data ulangan baru
export async function POST(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await req.json();

    // Cek apakah sudah ada data untuk pengguna ini
    const existing = await db
      .select()
      .from(testInfo)
      .where(eq(testInfo.userId, user.id))
      .limit(1);

    let result;

    if (existing.length > 0) {
      // Update data yang sudah ada
      [result] = await db
        .update(testInfo)
        .set({
          ...data,
          userId: user.id,
          updatedAt: new Date(),
        })
        .where(eq(testInfo.id, existing[0].id))
        .returning();
    } else {
      // Insert data baru
      [result] = await db
        .insert(testInfo)
        .values({
          ...data,
          userId: user.id,
        })
        .returning();
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Data berhasil disimpan',
    }, { status: 200 });

  } catch (error) {
    console.error('Error saving test info:', error);
    return NextResponse.json({
      error: 'Gagal menyimpan data',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// PUT - Update data ulangan
export async function PUT(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await req.json();
    const { id, ...updateData } = data;

    // Pastikan hanya pengguna yang memiliki data ini yang bisa mengupdate
    const existing = await db
      .select()
      .from(testInfo)
      .where(eq(testInfo.id, id))
      .limit(1);

    if (existing.length === 0 || existing[0].userId !== user.id) {
      return NextResponse.json(
        { error: 'Data tidak ditemukan atau tidak berhak' },
        { status: 403 }
      );
    }

    const [result] = await db
      .update(testInfo)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(testInfo.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Data berhasil diupdate',
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating test info:', error);
    return NextResponse.json({
      error: 'Gagal mengupdate data',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
