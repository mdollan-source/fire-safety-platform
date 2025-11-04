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

    const defects = defectsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore timestamps to ISO strings for JSON serialization
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        targetDate: data.targetDate?.toDate?.()?.toISOString() || null,
        resolvedAt: data.resolvedAt?.toDate?.()?.toISOString() || null,
      };
    });

    // Convert asset timestamps
    const assetWithDates = {
      id: assetDoc.id,
      ...assetData,
      createdAt: assetData?.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: assetData?.updatedAt?.toDate?.()?.toISOString() || null,
      serviceDates: assetData?.serviceDates ? {
        ...assetData.serviceDates,
        lastService: assetData.serviceDates.lastService?.toDate?.()?.toISOString() || null,
        nextService: assetData.serviceDates.nextService?.toDate?.()?.toISOString() || null,
      } : null,
    };

    return NextResponse.json({
      asset: assetWithDates,
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
