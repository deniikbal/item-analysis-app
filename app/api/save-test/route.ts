import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { testInfo } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET - Ambil data ulangan terakhir
export async function GET() {
  try {
    const data = await db
      .select()
      .from(testInfo)
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
    const data = await req.json();

    // Check if data already exists
    const existing = await db
      .select()
      .from(testInfo)
      .limit(1);

    let result;

    if (existing.length > 0) {
      // Update existing data
      [result] = await db
        .update(testInfo)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(testInfo.id, existing[0].id))
        .returning();
    } else {
      // Insert new data
      [result] = await db
        .insert(testInfo)
        .values(data)
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
    const data = await req.json();
    const { id, ...updateData } = data;

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
