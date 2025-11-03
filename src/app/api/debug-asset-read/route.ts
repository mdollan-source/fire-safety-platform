import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');

    if (!assetId) {
      return NextResponse.json({ error: 'assetId parameter required' }, { status: 400 });
    }

    // Fetch using Admin SDK (bypasses security rules)
    const assetDoc = await adminDb().collection('assets').doc(assetId).get();

    if (!assetDoc.exists) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const assetData = assetDoc.data();

    return NextResponse.json({
      success: true,
      assetId: assetDoc.id,
      orgId: assetData?.orgId,
      hasOrgId: 'orgId' in (assetData || {}),
      assetData: assetData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
