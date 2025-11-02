import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const adminDb = admin.firestore();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    console.log('Checking FCM tokens for user:', userId);

    // Try to get FCM tokens using Admin SDK
    const tokensSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('fcmTokens')
      .get();

    const tokens = tokensSnapshot.docs.map((doc) => ({
      id: doc.id,
      token: doc.data().token,
      createdAt: doc.data().createdAt,
    }));

    console.log('Found tokens:', tokens.length);

    return NextResponse.json({
      success: true,
      userId,
      tokenCount: tokens.length,
      tokens,
    });
  } catch (error: any) {
    console.error('Error checking tokens:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}
