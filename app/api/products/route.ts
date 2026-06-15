import { NextResponse } from 'next/server';
import { connectDB, dbModel } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET: list all products with optional filters
export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let products = await dbModel.Product.find({});

    // Filter products
    if (category && category !== 'All') {
      products = products.filter((p: any) => p.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      products = products.filter(
        (p: any) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error('Fetch products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST: Add a new product (company only)
export async function POST(request: Request) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);

    if (!user || user.role !== 'company') {
      return NextResponse.json({ error: 'Unauthorized. Company account required.' }, { status: 401 });
    }

    const { name, category, description, imageUrl, specs } = await request.json();

    if (!name || !category || !description) {
      return NextResponse.json({ error: 'Name, category, and description are required.' }, { status: 400 });
    }

    const newProduct = await dbModel.Product.create({
      companyId: user._id,
      name,
      category,
      description,
      imageUrl: imageUrl || '',
      specs: specs || [],
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
