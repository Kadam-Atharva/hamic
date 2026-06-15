import { NextResponse } from 'next/server';
import { connectDB, dbModel } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    const { id } = await params;

    if (!user || user.role !== 'company') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Find the material
    // We don't have a direct findById, but we can list supportmaterials by id or findOne
    // Wait, in dbModel we have SupportMaterial.find(query) which is list. Let's write a finder.
    const materials = await dbModel.SupportMaterial.find({ _id: id });
    const material = materials[0];

    if (!material) {
      return NextResponse.json({ error: 'Support material not found.' }, { status: 404 });
    }

    // Find product to verify company owns it
    const product = await dbModel.Product.findById(material.productId);
    if (!product) {
      // If product is missing, delete material anyway to avoid orphans
      await dbModel.SupportMaterial.findByIdAndDelete(id);
      return NextResponse.json({ success: true, message: 'Orphan support material deleted.' });
    }

    if (product.companyId.toString() !== (user._id || user.id || '').toString()) {
      return NextResponse.json({ error: 'Unauthorized. You do not own the parent product.' }, { status: 403 });
    }

    await dbModel.SupportMaterial.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Support material deleted successfully.' });
  } catch (error: any) {
    console.error('Delete support material error:', error);
    return NextResponse.json({ error: 'Failed to delete support material.' }, { status: 500 });
  }
}
