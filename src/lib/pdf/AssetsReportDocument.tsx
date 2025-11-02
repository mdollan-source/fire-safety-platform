import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 15, marginBottom: 10, borderBottom: '2 solid #E5E7EB', paddingBottom: 5 },
  table: { display: 'flex', width: 'auto', marginVertical: 10 },
  tableRow: { flexDirection: 'row', borderBottom: '1 solid #E5E7EB', paddingVertical: 8 },
  tableHeader: { backgroundColor: '#F3F4F6', fontWeight: 'bold' },
  tableCol: { width: '20%', paddingHorizontal: 5 },
  tableColWide: { width: '30%', paddingHorizontal: 5 },
  text: { fontSize: 10, marginBottom: 5 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', color: '#999', fontSize: 8, borderTop: '1 solid #E5E7EB', paddingTop: 10 },
});

interface AssetsReportProps {
  data: { org: any; sites: any[]; assets: any[] };
  startDate: Date;
  endDate: Date;
}

export const AssetsReportDocument: React.FC<AssetsReportProps> = ({ data, startDate, endDate }) => {
  const { org, sites, assets } = data;

  // Group assets by type
  const assetsByType: Record<string, any[]> = {};
  assets.forEach((asset: any) => {
    const type = asset.type || 'other';
    if (!assetsByType[type]) assetsByType[type] = [];
    assetsByType[type].push(asset);
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Asset Register Report</Text>
        <Text style={styles.text}>{org?.name || 'Organisation'}</Text>
        <Text style={styles.text}>Generated: {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>

        <Text style={styles.sectionTitle}>Summary</Text>
        <Text style={styles.text}>Total Assets: {assets.length}</Text>
        <Text style={styles.text}>Total Sites: {sites.length}</Text>

        <Text style={styles.sectionTitle}>Assets by Type</Text>
        {Object.keys(assetsByType).map((type) => (
          <Text key={type} style={styles.text}>
            {type.replace(/_/g, ' ').toUpperCase()}: {assetsByType[type].length}
          </Text>
        ))}

        <Text style={styles.sectionTitle}>Complete Asset List</Text>
        <View style={styles.table}>
          <View style={{ ...styles.tableRow, ...styles.tableHeader }}>
            <View style={styles.tableCol}><Text>Tag</Text></View>
            <View style={styles.tableColWide}><Text>Name</Text></View>
            <View style={styles.tableCol}><Text>Type</Text></View>
            <View style={styles.tableColWide}><Text>Location</Text></View>
          </View>
          {assets.slice(0, 50).map((asset: any) => (
            <View key={asset.id} style={styles.tableRow}>
              <View style={styles.tableCol}><Text>{asset.tag || 'N/A'}</Text></View>
              <View style={styles.tableColWide}><Text>{asset.name || 'Unnamed'}</Text></View>
              <View style={styles.tableCol}><Text>{asset.type?.replace(/_/g, ' ') || 'N/A'}</Text></View>
              <View style={styles.tableColWide}><Text>{asset.location || 'N/A'}</Text></View>
            </View>
          ))}
        </View>

        {assets.length > 50 && (
          <Text style={{ ...styles.text, fontStyle: 'italic' }}>
            Showing first 50 of {assets.length} assets.
          </Text>
        )}

        <View style={styles.footer}>
          <Text>Assets Report | Generated {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
        </View>
      </Page>
    </Document>
  );
};
