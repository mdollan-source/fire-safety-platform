import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 15, marginBottom: 10, borderBottom: '2 solid #E5E7EB', paddingBottom: 5 },
  defectBlock: { marginBottom: 15, paddingBottom: 10, borderBottom: '1 solid #E5E7EB' },
  text: { fontSize: 10, marginBottom: 5 },
  badge: { padding: '3 8', borderRadius: 4, fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  badgeFail: { backgroundColor: '#EF4444', color: '#FFFFFF' },
  badgeWarning: { backgroundColor: '#F59E0B', color: '#FFFFFF' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', color: '#999', fontSize: 8, borderTop: '1 solid #E5E7EB', paddingTop: 10 },
});

interface DefectsReportProps {
  data: { org: any; sites: any[]; assets: any[]; defects: any[] };
  startDate: Date;
  endDate: Date;
}

export const DefectsReportDocument: React.FC<DefectsReportProps> = ({ data, startDate, endDate }) => {
  const { org, sites, assets, defects } = data;
  const criticalDefects = defects.filter((d: any) => d.severity === 'critical');
  const openDefects = defects.filter((d: any) => d.status === 'open' || d.status === 'in_progress');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Defects Report</Text>
        <Text style={styles.text}>{org?.name || 'Organisation'}</Text>
        <Text style={styles.text}>{format(startDate, 'dd/MM/yyyy')} - {format(endDate, 'dd/MM/yyyy')}</Text>

        <Text style={styles.sectionTitle}>Summary</Text>
        <Text style={styles.text}>Total Defects: {defects.length}</Text>
        <Text style={styles.text}>Critical Defects: {criticalDefects.length}</Text>
        <Text style={styles.text}>Open Defects: {openDefects.length}</Text>

        <Text style={styles.sectionTitle}>Defects List</Text>
        {defects.slice(0, 20).map((defect: any) => {
          const asset = assets.find((a: any) => a.id === defect.assetId);
          const site = sites.find((s: any) => s.id === defect.siteId);
          const createdAt = defect.createdAt?.toDate ? defect.createdAt.toDate() : defect.createdAt;

          return (
            <View key={defect.id} style={styles.defectBlock}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: 'bold' }}>{defect.title}</Text>
                <Text style={{
                  ...styles.badge,
                  ...(defect.severity === 'critical' || defect.severity === 'high' ? styles.badgeFail : styles.badgeWarning),
                }}>
                  {defect.severity?.toUpperCase()}
                </Text>
              </View>
              <Text style={{ ...styles.text, fontSize: 9, color: '#666' }}>{defect.description || 'No description'}</Text>
              <Text style={{ fontSize: 8, color: '#888' }}>
                Site: {site?.name || 'Unknown'} | Asset: {asset?.name || asset?.tag || 'General'} | Raised: {createdAt ? format(createdAt, 'dd/MM/yyyy') : 'N/A'}
              </Text>
              <Text style={{ fontSize: 8, marginTop: 3 }}>Status: {defect.status?.replace(/_/g, ' ').toUpperCase()}</Text>
            </View>
          );
        })}

        <View style={styles.footer}>
          <Text>Defects Report | Generated {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
        </View>
      </Page>
    </Document>
  );
};
