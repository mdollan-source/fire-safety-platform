'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { db, storage } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, orderBy, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import FormError from '@/components/ui/FormError';
import { FileText, Download, History, CheckCircle2, AlertTriangle, Package, Trash2, ExternalLink, Eye } from 'lucide-react';
import { formatUKDate } from '@/lib/utils/date';
import { Site, Report, ReportType } from '@/types';
import DocumentViewer from '@/components/documents/DocumentViewer';
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from 'date-fns';
import { pdf } from '@react-pdf/renderer';
import { CompliancePackDocument } from '@/lib/pdf/CompliancePackDocument';
import { ChecksReportDocument } from '@/lib/pdf/ChecksReportDocument';
import { DefectsReportDocument } from '@/lib/pdf/DefectsReportDocument';
import { AssetsReportDocument } from '@/lib/pdf/AssetsReportDocument';
import { DrillsReportDocument } from '@/lib/pdf/DrillsReportDocument';
import { TrainingReportDocument } from '@/lib/pdf/TrainingReportDocument';

export default function ReportsPage() {
  const { userData } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [viewingReport, setViewingReport] = useState<Report | null>(null);

  // Form state
  const [reportType, setReportType] = useState<ReportType>('compliance_pack');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'last_12_months' | 'this_year' | 'last_year' | 'custom'>('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    if (userData?.orgId) {
      fetchData();
    }
  }, [userData]);

  const fetchData = async () => {
    await Promise.all([fetchSites(), fetchReports()]);
  };

  const fetchSites = async () => {
    try {
      setLoading(true);
      const sitesQuery = query(
        collection(db, 'sites'),
        where('orgId', '==', userData!.orgId)
      );
      const sitesSnapshot = await getDocs(sitesQuery);
      setSites(sitesSnapshot.docs.map((doc) => doc.data() as Site));
    } catch (err) {
      console.error('Error fetching sites:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const reportsQuery = query(
        collection(db, 'reports'),
        where('orgId', '==', userData!.orgId),
        orderBy('generatedAt', 'desc')
      );
      const reportsSnapshot = await getDocs(reportsQuery);
      const reportsData = reportsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          startDate: data.startDate?.toDate(),
          endDate: data.endDate?.toDate(),
          generatedAt: data.generatedAt?.toDate(),
        } as Report;
      });
      setReports(reportsData);
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  };

  const getDateRange = (): { start: Date; end: Date } => {
    const now = new Date();

    switch (dateRange) {
      case 'this_month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'last_3_months':
        return { start: subMonths(startOfMonth(now), 3), end: endOfMonth(now) };
      case 'last_6_months':
        return { start: subMonths(startOfMonth(now), 6), end: endOfMonth(now) };
      case 'last_12_months':
        return { start: subMonths(startOfMonth(now), 12), end: endOfMonth(now) };
      case 'this_year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'last_year':
        const lastYear = subYears(now, 1);
        return { start: startOfYear(lastYear), end: endOfYear(lastYear) };
      case 'custom':
        return {
          start: customStartDate ? new Date(customStartDate) : startOfMonth(now),
          end: customEndDate ? new Date(customEndDate) : endOfMonth(now),
        };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const getDateRangeDescription = (): string => {
    const { start, end } = getDateRange();
    return `${formatUKDate(start, 'dd/MM/yyyy')} - ${formatUKDate(end, 'dd/MM/yyyy')}`;
  };

  const fetchReportData = async (startDate: Date, endDate: Date) => {
    // Fetch organisation
    const orgDocRef = doc(db, 'organisations', userData!.orgId);
    const orgSnapshot = await getDoc(orgDocRef);
    const orgData = orgSnapshot.data();

    // Fetch all necessary data
    let sitesQuery = query(collection(db, 'sites'), where('orgId', '==', userData!.orgId));
    if (selectedSite !== 'all') {
      // For specific site, we'll filter after fetching
    }
    const sitesSnapshot = await getDocs(sitesQuery);
    const sitesData = sitesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    let assetsQuery = query(collection(db, 'assets'), where('orgId', '==', userData!.orgId));
    if (selectedSite !== 'all') {
      assetsQuery = query(collection(db, 'assets'), where('orgId', '==', userData!.orgId), where('siteId', '==', selectedSite));
    }
    const assetsSnapshot = await getDocs(assetsQuery);
    const assetsData = assetsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    let entriesQuery = query(
      collection(db, 'entries'),
      where('orgId', '==', userData!.orgId),
      where('completedAt', '>=', startDate),
      where('completedAt', '<=', endDate)
    );
    if (selectedSite !== 'all') {
      entriesQuery = query(
        collection(db, 'entries'),
        where('orgId', '==', userData!.orgId),
        where('siteId', '==', selectedSite),
        where('completedAt', '>=', startDate),
        where('completedAt', '<=', endDate)
      );
    }
    const entriesSnapshot = await getDocs(entriesQuery);
    const entriesData = entriesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    let defectsQuery = query(
      collection(db, 'defects'),
      where('orgId', '==', userData!.orgId),
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate)
    );
    if (selectedSite !== 'all') {
      defectsQuery = query(
        collection(db, 'defects'),
        where('orgId', '==', userData!.orgId),
        where('siteId', '==', selectedSite),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate)
      );
    }
    const defectsSnapshot = await getDocs(defectsQuery);
    const defectsData = defectsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    let drillsQuery = query(
      collection(db, 'fire_drills'),
      where('orgId', '==', userData!.orgId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    if (selectedSite !== 'all') {
      drillsQuery = query(
        collection(db, 'fire_drills'),
        where('orgId', '==', userData!.orgId),
        where('siteId', '==', selectedSite),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );
    }
    const drillsSnapshot = await getDocs(drillsQuery);
    const drillsData = drillsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    let trainingQuery = query(
      collection(db, 'training_records'),
      where('orgId', '==', userData!.orgId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    if (selectedSite !== 'all') {
      trainingQuery = query(
        collection(db, 'training_records'),
        where('orgId', '==', userData!.orgId),
        where('siteId', '==', selectedSite),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );
    }
    const trainingSnapshot = await getDocs(trainingQuery);
    const trainingData = trainingSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return {
      org: { name: orgData?.name || 'Organisation' },
      sites: sitesData,
      assets: assetsData,
      entries: entriesData,
      defects: defectsData,
      drills: drillsData,
      training: trainingData,
      users: [],
    };
  };

  const handleGenerateReport = async () => {
    if (!userData) return;

    try {
      setGenerating(true);
      setError('');

      const { start, end } = getDateRange();

      // Fetch data
      const data = await fetchReportData(start, end);

      // Generate PDF based on type
      let document;
      let fileName;

      switch (reportType) {
        case 'compliance_pack':
          document = <CompliancePackDocument data={data} startDate={start} endDate={end} />;
          fileName = `compliance-pack-${Date.now()}.pdf`;
          break;
        case 'checks_report':
          document = <ChecksReportDocument data={data} startDate={start} endDate={end} />;
          fileName = `checks-report-${Date.now()}.pdf`;
          break;
        case 'defects_report':
          document = <DefectsReportDocument data={data} startDate={start} endDate={end} />;
          fileName = `defects-report-${Date.now()}.pdf`;
          break;
        case 'assets_report':
          document = <AssetsReportDocument data={data} startDate={start} endDate={end} />;
          fileName = `assets-report-${Date.now()}.pdf`;
          break;
        case 'drills_report':
          document = <DrillsReportDocument data={data} startDate={start} endDate={end} />;
          fileName = `drills-report-${Date.now()}.pdf`;
          break;
        case 'training_report':
          document = <TrainingReportDocument data={data} startDate={start} endDate={end} />;
          fileName = `training-report-${Date.now()}.pdf`;
          break;
        default:
          throw new Error('Invalid report type');
      }

      // Generate PDF blob
      const blob = await pdf(document).toBlob();

      // Upload to Firebase Storage
      const storageRef = ref(storage, `reports/${userData!.orgId}/${fileName}`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      // Save report metadata to Firestore
      const selectedSiteData = sites.find((s) => s.id === selectedSite);
      await addDoc(collection(db, 'reports'), {
        orgId: userData!.orgId,
        type: reportType,
        siteId: selectedSite === 'all' ? null : selectedSite,
        siteName: selectedSite === 'all' ? 'All Sites' : selectedSiteData?.name || 'Unknown',
        startDate: start,
        endDate: end,
        fileUri: storageRef.fullPath,
        fileName: fileName,
        sizeBytes: blob.size,
        generatedBy: userData!.id,
        generatedByName: userData!.name,
        generatedAt: new Date(),
      });

      // Refresh reports list
      await fetchReports();

      // Download PDF (client-side only)
      if (typeof window !== 'undefined') {
        const url = URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      console.error('Error generating report:', err);
      setError(err.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = async (report: Report) => {
    try {
      const downloadURL = await getDownloadURL(ref(storage, report.fileUri));
      if (typeof window !== 'undefined') {
        const link = window.document.createElement('a');
        link.href = downloadURL;
        link.download = report.fileName;
        link.target = '_blank'; // Open in new tab
        link.rel = 'noopener noreferrer';
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Error downloading report:', err);
      alert('Failed to download report');
    }
  };

  const handleDeleteReport = async (report: Report) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      // Delete from Storage
      await deleteObject(ref(storage, report.fileUri));

      // Delete from Firestore
      await deleteDoc(doc(db, 'reports', report.id));

      // Refresh list
      await fetchReports();
    } catch (err) {
      console.error('Error deleting report:', err);
      alert('Failed to delete report');
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'compliance_pack':
        return 'Compliance Pack';
      case 'checks_report':
        return 'Checks Report';
      case 'defects_report':
        return 'Defects Report';
      case 'training_report':
        return 'Training Report';
      case 'assets_report':
        return 'Assets Report';
      default:
        return type;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brand-600">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Reports</h1>
          <p className="text-sm text-brand-600 mt-1">
            Generate compliance packs and export data for audits
          </p>
        </div>
      </div>

      {/* Generate Report Form */}
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Generate New Report
          </div>
        </Card.Header>
        <Card.Content>
          {error && <FormError message={error} />}

          <div className="space-y-6">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                disabled={generating}
                className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="compliance_pack">Compliance Pack - Complete audit bundle (checks + defects + drills + training)</option>
                <option value="checks_report">Checks Report - All completed checks with results</option>
                <option value="defects_report">Defects Report - Open and resolved defects</option>
                <option value="assets_report">Assets Report - Asset register with service history</option>
                <option value="drills_report">Fire Drills Report - Evacuation drill records</option>
                <option value="training_report">Training Report - Staff training sessions and competency</option>
              </select>
            </div>

            {/* Site Filter */}
            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Site
              </label>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                disabled={generating}
                className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Sites</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                disabled={generating}
                className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="last_3_months">Last 3 Months</option>
                <option value="last_6_months">Last 6 Months</option>
                <option value="last_12_months">Last 12 Months</option>
                <option value="this_year">This Year</option>
                <option value="last_year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
              <p className="text-xs text-brand-600 mt-2">
                Report will include data from: {getDateRangeDescription()}
              </p>
            </div>

            {/* Custom Date Range */}
            {dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-900 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    disabled={generating}
                    className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-900 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    disabled={generating}
                    className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            )}

            {/* Generate Button */}
            <Button
              variant="primary"
              onClick={handleGenerateReport}
              isLoading={generating}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              {generating ? 'Generating PDF...' : 'Generate & Download Report'}
            </Button>

            <p className="text-xs text-brand-600 text-center">
              Report will be generated in your browser and downloaded automatically
            </p>
          </div>
        </Card.Content>
      </Card>

      {/* Generated Reports History */}
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Generated Reports
          </div>
        </Card.Header>
        <Card.Content>
          {reports.length === 0 ? (
            <p className="text-sm text-brand-600 py-4 text-center">
              No reports generated yet. Create your first report above.
            </p>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border border-brand-200 rounded hover:bg-brand-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-brand-600 flex-shrink-0" />
                      <p className="text-sm font-medium text-brand-900 truncate">
                        {getReportTypeLabel(report.type)}
                      </p>
                      <Badge variant="pending" className="flex-shrink-0">
                        {report.siteName || 'All Sites'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-brand-600">
                      <span>
                        {formatUKDate(report.startDate, 'dd/MM/yyyy')} - {formatUKDate(report.endDate, 'dd/MM/yyyy')}
                      </span>
                      <span>•</span>
                      <span>{formatFileSize(report.sizeBytes)}</span>
                      <span>•</span>
                      <span>Generated by {report.generatedByName}</span>
                      <span>•</span>
                      <span>{formatUKDate(report.generatedAt, 'dd/MM/yyyy HH:mm')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setViewingReport(report)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownloadReport(report)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteReport(report)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Document Viewer Modal */}
      {viewingReport && (
        <DocumentViewer
          document={{
            id: viewingReport.id,
            title: getReportTypeLabel(viewingReport.type),
            fileName: viewingReport.fileName,
            fileType: viewingReport.fileName.split('.').pop() || 'pdf',
            storageUrl: viewingReport.fileUri,
            fileSize: viewingReport.sizeBytes,
            uploadedAt: viewingReport.generatedAt,
            uploadedBy: viewingReport.generatedBy,
            uploadedByName: viewingReport.generatedByName,
            orgId: viewingReport.orgId,
            category: 'report' as any,
            entityType: 'report' as any,
            entityId: viewingReport.id,
            updatedAt: viewingReport.generatedAt,
          }}
          onClose={() => setViewingReport(null)}
        />
      )}
    </div>
  );
}
