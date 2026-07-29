import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getProducts, createProduct } from '@/features/products/product.service';
import { isAdminAuthenticated } from '@/lib/require-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search') ?? undefined;
    const hiddenRequested = request.nextUrl.searchParams.get('includeHidden') === 'true';
    const includeHidden = hiddenRequested && (await isAdminAuthenticated());
    const data = await getProducts({ search, includeHidden });

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ message: 'Parameter pencarian tidak valid.' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Gagal mengambil data produk.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: 'Tidak memiliki akses.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const product = await createProduct(body);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('POST /api/products error:', error);

    if (error instanceof ZodError) {
      return NextResponse.json({ message: 'Data produk tidak valid.' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Gagal membuat produk.' }, { status: 500 });
  }
}
