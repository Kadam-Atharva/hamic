import { NextResponse } from 'next/server';
import { connectDB, dbModel } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyDetails: user.companyDetails
      }
    });
  } catch (err) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { name, companyDetails } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    const updateData: any = { name };
    if (user.role === 'company' && companyDetails) {
      updateData.companyDetails = {
        description: companyDetails.description || '',
        website: companyDetails.website || '',
        logoUrl: companyDetails.logoUrl || ''
      };
    }

    const userId = (user._id || user.id || '').toString();
    const updatedUser = await dbModel.Account.findByIdAndUpdate(userId, updateData);

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        companyDetails: updatedUser.companyDetails
      }
    });
  } catch (err: any) {
    console.error('Update profile error:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
