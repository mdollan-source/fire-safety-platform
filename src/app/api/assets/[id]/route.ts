import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { auth } from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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

    // Fetch the asset
    const assetDoc = await adminDb().collection('assets').doc(params.id).get();

    if (!assetDoc.exists) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    const assetData = assetDoc.data();

    // Check if user has access to this asset's org
    if (assetData?.orgId !== userOrgId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Fetch related site
    let siteData = null;
    if (assetData?.siteId) {
      const siteDoc = await adminDb().collection('sites').doc(assetData.siteId).get();
      if (siteDoc.exists) {
        siteData = { id: siteDoc.id, ...siteDoc.data() };
      }
    }

    // Fetch related defects
    const defectsSnapshot = await adminDb()
      .collection('defects')
      .where('assetId', '==', params.id)
      .get();

    const defects = defectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      asset: {
        id: assetDoc.id,
        ...assetData,
      },
      site: siteData,
      defects: defects,
    });
  } catch (error: any) {
    console.error('Error fetching asset:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
