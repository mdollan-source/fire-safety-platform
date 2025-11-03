import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    // Show what we're getting
    return NextResponse.json({
      projectId: projectId || 'MISSING',
      clientEmail: clientEmail || 'MISSING',
      privateKeyExists: !!privateKey,
      privateKeyLength: privateKey?.length || 0,
      privateKeyFirstChars: privateKey?.substring(0, 50) || 'MISSING',
      privateKeyLastChars: privateKey?.substring(privateKey.length - 50) || 'MISSING',
      // Show if it has literal \n or actual newlines
      hasLiteralBackslashN: privateKey?.includes('\\n') || false,
      hasActualNewlines: privateKey?.includes('\n') || false,
      // Show the first 200 chars with escaped characters visible
      privateKeyPreview: JSON.stringify(privateKey?.substring(0, 200)),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
