import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// Mark this route as dynamic (don't pre-render during build)
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email } = body;

    // Validation
    if (!token || !email) {
      return NextResponse.json(
        { error: 'Token and email are required' },
        { status: 400 }
      );
    }

    // Find user by email and token using Admin SDK
    const usersSnapshot = await adminDb().collection('users')
      .where('email', '==', email.toLowerCase())
      .where('resetToken', '==', token)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid reset token' },
        { status: 400 }
      );
    }

    const userData = usersSnapshot.docs[0].data();

    // Check if token has expired
    const expiryDate = userData.resetExpiry?.toDate();
    if (!expiryDate || expiryDate < new Date()) {
      return NextResponse.json(
        { error: 'This reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Token is valid',
    });

  } catch (error: any) {
    console.error('Error validating reset token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to validate token' },
      { status: 500 }
    );
  }
}
