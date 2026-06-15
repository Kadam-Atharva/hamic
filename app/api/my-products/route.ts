import { NextResponse } from 'next/server';
import { connectDB, dbModel } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { extractMaintenanceTasks } from '@/lib/maintenanceExtractor';

// GET: Fetch user's owned products and associated maintenance schedules
export async function GET(request: Request) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const ownedLinks = await dbModel.OwnedProduct.find({ userId: user._id || user.id });
    
    const ownedProducts = [];
    for (const link of ownedLinks) {
      const product = await dbModel.Product.findById(link.productId);
      if (product) {
        const tasks = await dbModel.MaintenanceTask.find({ 
          userId: user._id || user.id, 
          productId: link.productId 
        });
        ownedProducts.push({
          _id: link._id,
          productId: link.productId,
          product,
          tasks,
          createdAt: link.createdAt
        });
      }
    }

    return NextResponse.json({ success: true, ownedProducts });
  } catch (error: any) {
    console.error('Fetch owned products error:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory: ' + error.message }, { status: 500 });
  }
}

// POST: Add a product to inventory and auto-generate maintenance tasks
export async function POST(request: Request) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const { productId } = await request.json();
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    // Check if product exists
    const product = await dbModel.Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    // Check if already owned
    const existing = await dbModel.OwnedProduct.findOne({ 
      userId: user._id || user.id, 
      productId 
    });

    if (existing) {
      return NextResponse.json({ error: 'You already own this product.' }, { status: 400 });
    }

    // Register ownership
    const ownedLink = await dbModel.OwnedProduct.create({
      userId: user._id || user.id,
      productId,
      createdAt: new Date().toISOString()
    });

    // Auto-extract tasks from product manuals
    const materials = await dbModel.SupportMaterial.find({ productId });
    const manualText = materials
      .filter((m: any) => m.rawText && m.rawText.trim().length > 0)
      .map((m: any) => m.rawText)
      .join('\n\n');

    const extractedTasks = await extractMaintenanceTasks(manualText, product.category);

    // Seed tasks in database
    for (const t of extractedTasks) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + t.intervalMonths);

      await dbModel.MaintenanceTask.create({
        userId: user._id || user.id,
        productId,
        title: t.title,
        description: t.description,
        intervalMonths: t.intervalMonths,
        dueDate: dueDate.toISOString(),
        completed: false,
        createdAt: new Date().toISOString()
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Product added. Auto-extracted ${extractedTasks.length} maintenance schedules.`,
      ownedProduct: ownedLink
    }, { status: 201 });
  } catch (error: any) {
    console.error('Add owned product error:', error);
    return NextResponse.json({ error: 'Failed to add product: ' + error.message }, { status: 500 });
  }
}

// DELETE: Remove product from inventory and clear maintenance schedules
export async function DELETE(request: Request) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const { productId } = await request.json();
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    // Delete ownership link
    await dbModel.OwnedProduct.deleteOne({ 
      userId: user._id || user.id, 
      productId 
    });

    // Delete all related tasks
    await dbModel.MaintenanceTask.deleteMany({ 
      userId: user._id || user.id, 
      productId 
    });

    return NextResponse.json({ success: true, message: 'Product removed and schedules deleted.' });
  } catch (error: any) {
    console.error('Delete owned product error:', error);
    return NextResponse.json({ error: 'Failed to delete product: ' + error.message }, { status: 500 });
  }
}
