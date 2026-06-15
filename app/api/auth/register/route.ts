import { NextResponse } from 'next/server';
import { connectDB, dbModel } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await connectDB();
    const { name, email, password, role, companyDetails } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'All fields (name, email, password, role) are required.' }, { status: 400 });
    }

    if (role !== 'company' && role !== 'user') {
      return NextResponse.json({ error: 'Role must be either "company" or "user".' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await dbModel.Account.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const accountData: any = {
      name,
      email,
      passwordHash,
      role,
      createdAt: new Date().toISOString()
    };

    if (role === 'company') {
      accountData.companyDetails = {
        description: companyDetails?.description || '',
        website: companyDetails?.website || '',
        logoUrl: companyDetails?.logoUrl || ''
      };
    }

    const newAccount = await dbModel.Account.create(accountData);

    // Create session token
    const token = await signToken({
      id: newAccount._id,
      email: newAccount.email,
      role: newAccount.role,
      name: newAccount.name
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newAccount._id,
        name: newAccount.name,
        email: newAccount.email,
        role: newAccount.role,
        companyDetails: newAccount.companyDetails
      }
    });

    // Set cookie
    response.headers.set(
      'Set-Cookie',
      `hamic_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
    );

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}
