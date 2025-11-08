import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storageUrl } = body;

    if (!storageUrl) {
      return NextResponse.json({ error: 'storageUrl is required' }, { status: 400 });
    }

    // Get file from Firebase Storage using Admin SDK
    const bucket = adminStorage().bucket();
    const file = bucket.file(storageUrl);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Download file
    const [fileBuffer] = await file.download();
    const [metadata] = await file.getMetadata();

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(fileBuffer);

    // Return file as blob
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': metadata.contentType || 'application/octet-stream',
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to download file' },
      { status: 500 }
    );
  }
}
