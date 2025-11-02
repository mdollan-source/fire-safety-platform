import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

const adminAuth = getAuth();
const adminDb = getFirestore();

export async function POST(request: NextRequest) {
  try {
    // Get the Firebase ID token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Get the request body
    const body = await request.json();
    const { userId } = body;

    // Security: Users can only set their own claims OR admins can set anyone's claims
    if (uid !== userId) {
      // Check if the requesting user is an admin
      const requestingUserDoc = await adminDb.collection('users').doc(uid).get();
      const requestingUser = requestingUserDoc.data();

      if (!requestingUser || !['responsible_person', 'super_admin'].includes(requestingUser.role)) {
        return NextResponse.json(
          { error: 'Unauthorized - You can only update your own claims or be an admin' },
          { status: 403 }
        );
      }
    }

    // Get user data from Firestore
    const userDoc = await adminDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // Prepare custom claims
    const customClaims: Record<string, any> = {
      orgId: userData?.orgId || null,
      role: userData?.role || 'viewer',
      siteIds: userData?.siteIds || null, // null = all sites
    };

    console.log('Setting custom claims for user:', userId, customClaims);

    // Set custom claims
    await adminAuth.setCustomUserClaims(userId, customClaims);

    return NextResponse.json({
      success: true,
      message: 'Custom claims updated successfully',
      claims: customClaims,
    });

  } catch (error: any) {
    console.error('Error setting custom claims:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set custom claims' },
      { status: 500 }
    );
  }
}
