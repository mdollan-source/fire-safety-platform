import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

/**
 * ONE-TIME USE ONLY
 * Creates a super admin account
 * DELETE THIS FILE AFTER USE
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, name' },
        { status: 400 }
      );
    }

    const auth = adminAuth();
    const db = adminDb();

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: true, // Verify automatically for super admin
    });

    // Create user document in Firestore with super_admin role
    await db.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      email,
      name,
      role: 'super_admin',
      status: 'active',
      mfaEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Set custom claims for super admin
    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'super_admin',
    });

    return NextResponse.json({
      success: true,
      message: 'Super admin account created successfully',
      userId: userRecord.uid,
      email: userRecord.email,
    });

  } catch (error: any) {
    console.error('Error creating super admin:', error);

    // Handle specific errors
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'This email is already registered' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create super admin account' },
      { status: 500 }
    );
  }
}
