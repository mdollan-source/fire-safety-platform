import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 15, marginBottom: 10, borderBottom: '2 solid #E5E7EB', paddingBottom: 5 },
  drillBlock: { marginBottom: 15, paddingBottom: 10, borderBottom: '1 solid #E5E7EB' },
  text: { fontSize: 10, marginBottom: 5 },
  badge: { padding: '3 8', borderRadius: 4, fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  badgePass: { backgroundColor: '#10B981', color: '#FFFFFF' },
  badgeFail: { backgroundColor: '#EF4444', color: '#FFFFFF' },
  badgeWarning: { backgroundColor: '#F59E0B', color: '#FFFFFF' },
  signature: { width: 120, height: 40, marginTop: 5, border: '1 solid #E5E7EB' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', color: '#999', fontSize: 8, borderTop: '1 solid #E5E7EB', paddingTop: 10 },
});

interface DrillsReportProps {
  data: { org: any; sites: any[]; drills: any[] };
  startDate: Date;
  endDate: Date;
}

export const DrillsReportDocument: React.FC<DrillsReportProps> = ({ data, startDate, endDate }) => {
  const { org, sites, drills } = data;

  // Calculate summary statistics
  const totalDrills = drills.length;
  const allAccountedDrills = drills.filter((d: any) => d.allAccountedFor).length;
  const drillsWithIssues = drills.filter((d: any) => d.issues && d.issues.trim()).length;
  const avgEvacuationTime = drills.length > 0
    ? Math.round(drills.reduce((sum: number, d: any) => sum + (d.evacuationTime || 0), 0) / drills.length)
    : 0;

  const formatEvacuationTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Fire Drills Report</Text>
        <Text style={styles.text}>{org?.name || 'Organisation'}</Text>
        <Text style={styles.text}>{format(startDate, 'dd/MM/yyyy')} - {format(endDate, 'dd/MM/yyyy')}</Text>

        <Text style={styles.sectionTitle}>Summary</Text>
        <Text style={styles.text}>Total Drills: {totalDrills}</Text>
        <Text style={styles.text}>All Personnel Accounted: {allAccountedDrills} / {totalDrills}</Text>
        <Text style={styles.text}>Drills with Issues: {drillsWithIssues}</Text>
        <Text style={styles.text}>Average Evacuation Time: {formatEvacuationTime(avgEvacuationTime)}</Text>

        <Text style={styles.sectionTitle}>Drill Records</Text>
        {drills.length === 0 ? (
          <Text style={styles.text}>No fire drills recorded in this period.</Text>
        ) : (
          drills.map((drill: any) => {
            const site = sites.find((s: any) => s.id === drill.siteId);
            const drillDate = drill.date?.toDate ? drill.date.toDate() : drill.date;

            return (
              <View key={drill.id} style={styles.drillBlock} wrap={false}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontWeight: 'bold' }}>
                    {site?.name || 'Unknown Site'} - {drillDate ? format(drillDate, 'dd/MM/yyyy') : 'N/A'}
                  </Text>
                  <Text style={{
                    ...styles.badge,
                    ...(drill.allAccountedFor ? styles.badgePass : styles.badgeFail),
                  }}>
                    {drill.allAccountedFor ? 'ALL ACCOUNTED' : 'MISSING PERSONNEL'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                  <Text style={{ fontSize: 9, color: '#666', width: '50%' }}>
                    Time: {drill.startTime || 'N/A'}
                  </Text>
                  <Text style={{ fontSize: 9, color: '#666', width: '50%' }}>
                    Evacuation: {formatEvacuationTime(drill.evacuationTime || 0)}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                  <Text style={{ fontSize: 9, color: '#666', width: '50%' }}>
                    Alarm Type: {drill.alarmType ? drill.alarmType.replace(/_/g, ' ') : 'N/A'}
                  </Text>
                  <Text style={{ fontSize: 9, color: '#666', width: '50%' }}>
                    Headcount: {drill.actualHeadcount || 0}
                    {drill.expectedHeadcount ? ` / ${drill.expectedHeadcount}` : ''}
                  </Text>
                </View>

                {drill.assemblyPoint && (
                  <Text style={{ fontSize: 9, color: '#666', marginBottom: 3 }}>
                    Assembly Point: {drill.assemblyPoint}
                  </Text>
                )}

                {drill.conductedBy && (
                  <Text style={{ fontSize: 9, color: '#666', marginBottom: 3 }}>
                    Conducted By: {drill.conductedBy}
                  </Text>
                )}

                {drill.weatherConditions && (
                  <Text style={{ fontSize: 9, color: '#666', marginBottom: 3 }}>
                    Weather: {drill.weatherConditions}
                  </Text>
                )}

                {drill.issues && drill.issues.trim() && (
                  <View style={{ backgroundColor: '#FEF2F2', padding: 5, marginTop: 5, marginBottom: 5 }}>
                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#991B1B', marginBottom: 2 }}>
                      Issues:
                    </Text>
                    <Text style={{ fontSize: 8, color: '#7F1D1D' }}>
                      {drill.issues}
                    </Text>
                  </View>
                )}

                {drill.observations && drill.observations.trim() && (
                  <View style={{ backgroundColor: '#F9FAFB', padding: 5, marginTop: 5, marginBottom: 5 }}>
                    <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 2 }}>
                      Observations:
                    </Text>
                    <Text style={{ fontSize: 8, color: '#666' }}>
                      {drill.observations}
                    </Text>
                  </View>
                )}

                {drill.latitude && drill.longitude && (
                  <Text style={{ fontSize: 8, color: '#059669', marginTop: 3 }}>
                    GPS: {drill.latitude.toFixed(6)}, {drill.longitude.toFixed(6)}
                    {drill.locationAccuracy ? ` (±${drill.locationAccuracy.toFixed(0)}m)` : ''}
                  </Text>
                )}

                {drill.signature && (
                  <View style={{ marginTop: 5 }}>
                    <Text style={{ fontSize: 8, color: '#666', marginBottom: 2 }}>
                      Signature:
                    </Text>
                    <Image src={drill.signature} style={styles.signature} />
                  </View>
                )}

                {drill.nextDrillDue && (
                  <Text style={{ fontSize: 8, color: '#666', marginTop: 5 }}>
                    Next Drill Due: {drill.nextDrillDue?.toDate
                      ? format(drill.nextDrillDue.toDate(), 'dd/MM/yyyy')
                      : format(drill.nextDrillDue, 'dd/MM/yyyy')}
                  </Text>
                )}
              </View>
            );
          })
        )}

        <View style={styles.footer}>
          <Text>Fire Drills Report | Generated {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
        </View>
      </Page>
    </Document>
  );
};
