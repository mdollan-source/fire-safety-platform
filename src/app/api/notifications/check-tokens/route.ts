import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// Mark this route as dynamic (don't pre-render during build)
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    console.log('Checking FCM tokens for user:', userId);

    // Try to get FCM tokens using Admin SDK
    const tokensSnapshot = await adminDb()
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
