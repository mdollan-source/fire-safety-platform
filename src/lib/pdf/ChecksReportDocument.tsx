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
  tableCol: { width: '25%', paddingHorizontal: 5 },
  text: { fontSize: 10, marginBottom: 5 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', color: '#999', fontSize: 8, borderTop: '1 solid #E5E7EB', paddingTop: 10 },
});

interface ChecksReportProps {
  data: { org: any; sites: any[]; assets: any[]; entries: any[] };
  startDate: Date;
  endDate: Date;
}

export const ChecksReportDocument: React.FC<ChecksReportProps> = ({ data, startDate, endDate }) => {
  const { org, sites, assets, entries } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Checks Report</Text>
        <Text style={styles.text}>{org?.name || 'Organisation'}</Text>
        <Text style={styles.text}>{format(startDate, 'dd/MM/yyyy')} - {format(endDate, 'dd/MM/yyyy')}</Text>

        <Text style={styles.sectionTitle}>Summary</Text>
        <Text style={styles.text}>Total Checks Completed: {entries.length}</Text>

        <Text style={styles.sectionTitle}>Completed Checks</Text>
        <View style={styles.table}>
          <View style={{ ...styles.tableRow, ...styles.tableHeader }}>
            <View style={styles.tableCol}><Text>Date</Text></View>
            <View style={styles.tableCol}><Text>Asset</Text></View>
            <View style={styles.tableCol}><Text>Template</Text></View>
            <View style={styles.tableCol}><Text>Completed By</Text></View>
          </View>
          {entries.slice(0, 40).map((entry: any) => {
            const asset = assets.find((a: any) => a.id === entry.assetId);
            const completedAt = entry.completedAt?.toDate ? entry.completedAt.toDate() : entry.completedAt;
            return (
              <View key={entry.id} style={styles.tableRow}>
                <View style={styles.tableCol}><Text>{completedAt ? format(completedAt, 'dd/MM/yyyy') : 'N/A'}</Text></View>
                <View style={styles.tableCol}><Text>{asset?.name || asset?.tag || 'Unknown'}</Text></View>
                <View style={styles.tableCol}><Text>{entry.templateId || 'N/A'}</Text></View>
                <View style={styles.tableCol}><Text>{entry.completedByName || 'Unknown'}</Text></View>
              </View>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text>Checks Report | Generated {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
        </View>
      </Page>
    </Document>
  );
};
