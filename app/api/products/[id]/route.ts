import { NextResponse } from 'next/server';
import { connectDB, dbModel } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: get product details and its materials
export async function GET(request: Request, { params }: RouteParams) {
  try {
    await connectDB();
    const { id } = await params;

    const product = await dbModel.Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    const materials = await dbModel.SupportMaterial.find({ productId: id });

    return NextResponse.json({ success: true, product, materials });
  } catch (error: any) {
    console.error('Fetch product detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch product details' }, { status: 500 });
  }
}

// DELETE: delete product (company owner only)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    const { id } = await params;

    if (!user || user.role !== 'company') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const product = await dbModel.Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    // Verify company owns this product
    if (product.companyId.toString() !== (user._id || user.id || '').toString()) {
      return NextResponse.json({ error: 'Unauthorized. You do not own this product.' }, { status: 403 });
    }

    // Delete product
    await dbModel.Product.findByIdAndDelete(id);

    // Delete associated materials (can also clean up files if necessary, but metadata deletion is sufficient here)
    const materials = await dbModel.SupportMaterial.find({ productId: id });
    for (const material of materials) {
      await dbModel.SupportMaterial.findByIdAndDelete(material._id);
    }

    return NextResponse.json({ success: true, message: 'Product and associated materials deleted.' });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}

// PUT: update product (company owner only)
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    const { id } = await params;

    if (!user || user.role !== 'company') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const product = await dbModel.Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    // Verify company owns this product
    if (product.companyId.toString() !== (user._id || user.id || '').toString()) {
      return NextResponse.json({ error: 'Unauthorized. You do not own this product.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, category, description, imageUrl, specs } = body;

    if (!name || !description || !category) {
      return NextResponse.json({ error: 'Name, category, and description are required.' }, { status: 400 });
    }

    const updatedProduct = await dbModel.Product.findByIdAndUpdate(id, {
      name,
      category,
      description,
      imageUrl,
      specs
    });

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error: any) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}
