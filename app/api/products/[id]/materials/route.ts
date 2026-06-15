import { NextResponse } from 'next/server';
import { connectDB, dbModel } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { syncMossIndex } from '@/lib/moss';
import fs from 'fs';
import path from 'path';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    const { id: productId } = await params;

    if (!user || user.role !== 'company') {
      return NextResponse.json({ error: 'Unauthorized. Company account required.' }, { status: 401 });
    }

    const product = await dbModel.Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    if (product.companyId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized. You do not own this product.' }, { status: 403 });
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const type = formData.get('type') as 'pdf' | 'text' | 'image' | 'video' | 'link';
    const contentUrlInput = formData.get('contentUrl') as string;
    const rawText = formData.get('rawText') as string;
    const file = formData.get('file') as File | null;

    if (!title || !type) {
      return NextResponse.json({ error: 'Title and type are required.' }, { status: 400 });
    }

    let contentUrl = contentUrlInput || '';

    // Handle file upload if present
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.promises.mkdir(uploadsDir, { recursive: true });

      // Create a unique safe filename
      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
      const filePath = path.join(uploadsDir, safeName);

      await fs.promises.writeFile(filePath, buffer);
      contentUrl = `/uploads/${safeName}`;
    }

    const newMaterial = await dbModel.SupportMaterial.create({
      productId,
      title,
      type,
      contentUrl,
      rawText: rawText || '',
      createdAt: new Date().toISOString()
    });

    // Sync search index
    await syncMossIndex();

    return NextResponse.json({ success: true, material: newMaterial }, { status: 201 });
  } catch (error: any) {
    console.error('Create support material error:', error);
    return NextResponse.json({ error: 'Failed to upload support material: ' + error.message }, { status: 500 });
  }
}
