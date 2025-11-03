import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get first asset to check its structure
    const assetsSnapshot = await adminDb()
      .collection('assets')
      .limit(1)
      .get();

    if (assetsSnapshot.empty) {
      return NextResponse.json({ message: 'No assets found' });
    }

    const asset = assetsSnapshot.docs[0];
    const assetData = asset.data();

    return NextResponse.json({
      assetId: asset.id,
      hasOrgId: 'orgId' in assetData,
      orgId: assetData.orgId || 'MISSING',
      assetData: assetData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
