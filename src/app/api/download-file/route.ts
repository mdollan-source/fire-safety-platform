import { NextRequest, NextResponse } from 'next/server';
import { adminStorage, getAdminApp } from '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';

export async function POST(request: NextRequest) {
  try {
    // ============= AUTHENTICATION =============
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No authentication token provided' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify the token and get claims
    const decodedToken = await getAuth(getAdminApp()).verifyIdToken(idToken);
    const userOrgId = decodedToken.orgId;

    if (!userOrgId) {
      return NextResponse.json(
        { error: 'User does not belong to an organization' },
        { status: 403 }
      );
    }

    // ============= VALIDATE REQUEST =============
    const body = await request.json();
    const { storageUrl } = body;

    if (!storageUrl) {
      return NextResponse.json({ error: 'storageUrl is required' }, { status: 400 });
    }

    // ============= AUTHORIZATION =============
    // Extract orgId from storage URL to verify ownership
    // Storage URLs are in format: documents/{orgId}/... or evidence/{orgId}/...
    const orgIdMatch = storageUrl.match(/\/org_[0-9]+\//);
    if (!orgIdMatch) {
      console.warn('Invalid storage URL format - no orgId found:', storageUrl);
      return NextResponse.json(
        { error: 'Invalid storage URL format' },
        { status: 400 }
      );
    }

    const fileOrgId = orgIdMatch[0].replace(/\//g, ''); // Extract org_1234567890

    // Verify the file belongs to the user's organization
    if (fileOrgId !== userOrgId) {
      console.warn(`Access denied: User ${decodedToken.uid} (org: ${userOrgId}) attempted to access file from org: ${fileOrgId}`);
      return NextResponse.json(
        { error: 'Access denied - You do not have permission to access this file' },
        { status: 403 }
      );
    }

    // ============= DOWNLOAD FILE =============
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

    // Handle specific Firebase Auth errors
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: 'Authentication token expired - Please refresh and try again' },
        { status: 401 }
      );
    }

    if (error.code?.startsWith('auth/')) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to download file' },
      { status: 500 }
    );
  }
}
