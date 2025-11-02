import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase/admin';
import { renderToBuffer } from '@react-pdf/renderer';
import { CompliancePackDocument } from '@/lib/pdf/CompliancePackDocument';
import { ChecksReportDocument } from '@/lib/pdf/ChecksReportDocument';
import { DefectsReportDocument } from '@/lib/pdf/DefectsReportDocument';
import { AssetsReportDocument } from '@/lib/pdf/AssetsReportDocument';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, siteId, type, startDate, endDate, userId, userName } = body;

    if (!orgId || !type || !startDate || !endDate || !userId || !userName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch data from Firestore
    const data = await fetchReportData(orgId, siteId, new Date(startDate), new Date(endDate));

    // Generate PDF based on type
    let pdfBuffer: Buffer;
    let fileName: string;

    switch (type) {
      case 'compliance_pack':
        pdfBuffer = await renderToBuffer(
          CompliancePackDocument({ data, startDate: new Date(startDate), endDate: new Date(endDate) })
        );
        fileName = `compliance-pack-${Date.now()}.pdf`;
        break;
      case 'checks_report':
        pdfBuffer = await renderToBuffer(
          ChecksReportDocument({ data, startDate: new Date(startDate), endDate: new Date(endDate) })
        );
        fileName = `checks-report-${Date.now()}.pdf`;
        break;
      case 'defects_report':
        pdfBuffer = await renderToBuffer(
          DefectsReportDocument({ data, startDate: new Date(startDate), endDate: new Date(endDate) })
        );
        fileName = `defects-report-${Date.now()}.pdf`;
        break;
      case 'assets_report':
        pdfBuffer = await renderToBuffer(
          AssetsReportDocument({ data, startDate: new Date(startDate), endDate: new Date(endDate) })
        );
        fileName = `assets-report-${Date.now()}.pdf`;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }

    // Upload PDF to Firebase Storage
    const storagePath = `reports/${orgId}/${fileName}`;
    const fileRef = adminStorage().bucket().file(storagePath);

    await fileRef.save(pdfBuffer, {
      metadata: {
        contentType: 'application/pdf',
      },
    });

    // Make file publicly accessible
    await fileRef.makePublic();
    const downloadUrl = `https://storage.googleapis.com/${adminStorage().bucket().name}/${storagePath}`;

    // Save report metadata to Firestore
    const reportDoc = {
      orgId,
      siteId: siteId || null,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      fileUrl: downloadUrl,
      fileName,
      generatedBy: userId,
      generatedByName: userName,
      createdAt: new Date(),
    };

    const reportRef = await adminDb().collection('reports').add(reportDoc);

    return NextResponse.json({
      success: true,
      reportId: reportRef.id,
      downloadUrl,
      fileName,
    });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}

async function fetchReportData(
  orgId: string,
  siteId: string | null,
  startDate: Date,
  endDate: Date
) {
  const db = adminDb();

  // Fetch organization
  const orgDoc = await db.collection('organisations').doc(orgId).get();
  const org = orgDoc.exists ? orgDoc.data() : null;

  // Fetch sites
  let sitesQuery = db.collection('sites').where('orgId', '==', orgId);
  if (siteId) {
    sitesQuery = sitesQuery.where('__name__', '==', siteId) as any;
  }
  const sitesSnapshot = await sitesQuery.get();
  const sites = sitesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // Fetch assets
  let assetsQuery = db.collection('assets').where('orgId', '==', orgId);
  if (siteId) {
    assetsQuery = assetsQuery.where('siteId', '==', siteId);
  }
  const assetsSnapshot = await assetsQuery.get();
  const assets = assetsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // Fetch entries (completed checks)
  let entriesQuery = db
    .collection('entries')
    .where('orgId', '==', orgId)
    .where('completedAt', '>=', startDate)
    .where('completedAt', '<=', endDate);

  if (siteId) {
    entriesQuery = entriesQuery.where('siteId', '==', siteId);
  }

  const entriesSnapshot = await entriesQuery.get();
  const entries = entriesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // Fetch defects
  let defectsQuery = db
    .collection('defects')
    .where('orgId', '==', orgId)
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate);

  if (siteId) {
    defectsQuery = defectsQuery.where('siteId', '==', siteId);
  }

  const defectsSnapshot = await defectsQuery.get();
  const defects = defectsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // Fetch users
  const usersQuery = db.collection('users').where('orgId', '==', orgId);
  const usersSnapshot = await usersQuery.get();
  const users = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return {
    org,
    sites,
    assets,
    entries,
    defects,
    users,
  };
}
