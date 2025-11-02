import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  coverPage: {
    padding: 60,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    borderBottom: '2 solid #E5E7EB',
    paddingBottom: 5,
  },
  text: {
    fontSize: 10,
    marginBottom: 5,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  badge: {
    padding: '3 8',
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#FFFFFF',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#999',
    fontSize: 8,
    borderTop: '1 solid #E5E7EB',
    paddingTop: 10,
  },
  table: {
    display: 'flex',
    width: 'auto',
    marginVertical: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #E5E7EB',
    paddingVertical: 8,
  },
  tableHeader: {
    backgroundColor: '#F3F4F6',
    fontWeight: 'bold',
  },
  tableCol: {
    width: '25%',
    paddingHorizontal: 5,
  },
  tableColWide: {
    width: '50%',
    paddingHorizontal: 5,
  },
});

interface TrainingReportProps {
  data: {
    org: any;
    sites: any[];
    training: any[];
    users: any[];
  };
  startDate: Date;
  endDate: Date;
}

export const TrainingReportDocument: React.FC<TrainingReportProps> = ({ data, startDate, endDate }) => {
  const { org, sites, training = [], users } = data;

  // Calculate statistics
  const totalSessions = training.length;
  const totalDuration = training.reduce((sum, t) => sum + (t.duration || 0), 0);
  const avgDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;

  const sessionsByType = {
    induction: training.filter(t => t.type === 'induction').length,
    refresher: training.filter(t => t.type === 'refresher').length,
    drill: training.filter(t => t.type === 'drill').length,
    specialist: training.filter(t => t.type === 'specialist').length,
  };

  const typeLabels: Record<string, string> = {
    induction: 'Induction',
    refresher: 'Refresher Training',
    drill: 'Evacuation Drill',
    specialist: 'Specialist Training',
  };

  // Calculate training coverage
  const upcomingDue = training.filter(t => {
    if (!t.nextDue) return false;
    const dueDate = t.nextDue.toDate ? t.nextDue.toDate() : t.nextDue;
    return dueDate > new Date();
  }).length;

  const overdue = training.filter(t => {
    if (!t.nextDue) return false;
    const dueDate = t.nextDue.toDate ? t.nextDue.toDate() : t.nextDue;
    return dueDate < new Date();
  }).length;

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          <Text style={styles.title}>Fire Safety Training Report</Text>
          <Text style={styles.subtitle}>{org?.name || 'Organisation'}</Text>
          <Text style={styles.subtitle}>
            {format(startDate, 'dd MMMM yyyy')} - {format(endDate, 'dd MMMM yyyy')}
          </Text>
          <Text style={{ ...styles.text, marginTop: 40, textAlign: 'center', color: '#666' }}>
            Comprehensive record of fire safety training sessions, drills, and staff competency{'\n'}
            development for the specified period.
          </Text>
          <Text style={{ ...styles.text, marginTop: 20, textAlign: 'center', fontSize: 8, color: '#999' }}>
            Generated on {format(new Date(), 'dd MMMM yyyy HH:mm')}
          </Text>
        </View>
      </Page>

      {/* Summary Page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Training Summary</Text>

        <View style={styles.section}>
          <Text style={styles.text}>
            <Text style={styles.label}>Organisation:</Text> {org?.name || 'N/A'}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.label}>Reporting Period:</Text> {format(startDate, 'dd/MM/yyyy')} - {format(endDate, 'dd/MM/yyyy')}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.label}>Total Sites:</Text> {sites.length}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.label}>Total Training Sessions:</Text> {totalSessions}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.text, fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>
            Training Statistics
          </Text>
          <View style={styles.table}>
            <View style={{ ...styles.tableRow, ...styles.tableHeader }}>
              <View style={styles.tableColWide}>
                <Text>Metric</Text>
              </View>
              <View style={styles.tableColWide}>
                <Text>Value</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColWide}>
                <Text>Total Training Sessions</Text>
              </View>
              <View style={styles.tableColWide}>
                <Text>{totalSessions}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColWide}>
                <Text>Average Session Duration (minutes)</Text>
              </View>
              <View style={styles.tableColWide}>
                <Text>{avgDuration}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColWide}>
                <Text>Upcoming Training Sessions Due</Text>
              </View>
              <View style={styles.tableColWide}>
                <Text>{upcomingDue}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColWide}>
                <Text>Overdue Training</Text>
              </View>
              <View style={styles.tableColWide}>
                <Text style={{ color: overdue > 0 ? '#EF4444' : '#10B981' }}>{overdue}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.text, fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>
            Sessions by Type
          </Text>
          <View style={styles.table}>
            <View style={{ ...styles.tableRow, ...styles.tableHeader }}>
              <View style={styles.tableColWide}>
                <Text>Training Type</Text>
              </View>
              <View style={styles.tableColWide}>
                <Text>Count</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColWide}>
                <Text>Induction Training</Text>
              </View>
              <View style={styles.tableColWide}>
                <Text>{sessionsByType.induction}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColWide}>
                <Text>Refresher Training</Text>
              </View>
              <View style={styles.tableColWide}>
                <Text>{sessionsByType.refresher}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColWide}>
                <Text>Evacuation Drills</Text>
              </View>
              <View style={styles.tableColWide}>
                <Text>{sessionsByType.drill}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColWide}>
                <Text>Specialist Training</Text>
              </View>
              <View style={styles.tableColWide}>
                <Text>{sessionsByType.specialist}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Fire Safety Training Report | Page 2 | Generated by Fire Safety Log Book</Text>
        </View>
      </Page>

      {/* Detailed Training Records */}
      {training.length === 0 ? (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Training Records</Text>
          <Text style={styles.text}>No training sessions conducted during this period.</Text>
          <View style={styles.footer}>
            <Text>Fire Safety Training Report | Page 3 | Generated by Fire Safety Log Book</Text>
          </View>
        </Page>
      ) : (
        training.map((record, index) => {
          const site = sites.find((s) => s.id === record.siteId);
          const trainingDate = record.date?.toDate ? record.date.toDate() : record.date;
          const nextDue = record.nextDue?.toDate ? record.nextDue.toDate() : record.nextDue;
          const isOverdue = nextDue && nextDue < new Date();
          const pageNumber = Math.floor(index / 3) + 3;

          // Group 3 records per page
          if (index % 3 === 0) {
            return (
              <Page key={`page-${index}`} size="A4" style={styles.page}>
                <Text style={styles.sectionTitle}>Training Records (Detailed)</Text>
                {training.slice(index, index + 3).map((rec) => {
                  const recSite = sites.find((s) => s.id === rec.siteId);
                  const recDate = rec.date?.toDate ? rec.date.toDate() : rec.date;
                  const recNextDue = rec.nextDue?.toDate ? rec.nextDue.toDate() : rec.nextDue;
                  const recOverdue = recNextDue && recNextDue < new Date();

                  return (
                    <View key={rec.id} style={{ marginBottom: 20, paddingBottom: 15, borderBottom: '1 solid #E5E7EB' }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 12 }}>
                          {recSite?.name || 'Unknown Site'} - {recDate ? format(recDate, 'dd/MM/yyyy') : 'N/A'}
                        </Text>
                        <View style={{ ...styles.badge, backgroundColor: '#3B82F6' }}>
                          <Text>{typeLabels[rec.type] || rec.type}</Text>
                        </View>
                      </View>

                      <View style={{ marginBottom: 8 }}>
                        <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>Syllabus / Content</Text>
                        <Text style={{ fontSize: 9, color: '#333', lineHeight: 1.4 }}>{rec.syllabus}</Text>
                      </View>

                      <View style={{ marginBottom: 6 }}>
                        <Text style={{ fontSize: 9, color: '#666' }}>
                          <Text style={{ fontWeight: 'bold' }}>Trainer:</Text> {rec.assessor}
                        </Text>
                        {rec.attendees && rec.attendees.trim() && (
                          <Text style={{ fontSize: 9, color: '#666' }}>
                            <Text style={{ fontWeight: 'bold' }}>Attendees:</Text> {rec.attendees}
                          </Text>
                        )}
                        {rec.duration && (
                          <Text style={{ fontSize: 9, color: '#666' }}>
                            <Text style={{ fontWeight: 'bold' }}>Duration:</Text> {rec.duration} minutes
                          </Text>
                        )}
                      </View>

                      {rec.outcomes && rec.outcomes.trim() && (
                        <View style={{ backgroundColor: '#F9FAFB', padding: 8, marginVertical: 6 }}>
                          <Text style={{ fontSize: 8, fontWeight: 'bold', marginBottom: 3 }}>Outcomes / Notes:</Text>
                          <Text style={{ fontSize: 8, color: '#666', lineHeight: 1.3 }}>{rec.outcomes}</Text>
                        </View>
                      )}

                      {recNextDue && (
                        <Text style={{ fontSize: 8, color: recOverdue ? '#EF4444' : '#F59E0B', marginTop: 4 }}>
                          <Text style={{ fontWeight: 'bold' }}>Next Training Due:</Text> {format(recNextDue, 'dd/MM/yyyy')}
                          {recOverdue && ' (OVERDUE)'}
                        </Text>
                      )}
                    </View>
                  );
                })}
                <View style={styles.footer}>
                  <Text>Fire Safety Training Report | Page {pageNumber} | Generated by Fire Safety Log Book</Text>
                </View>
              </Page>
            );
          }
          return null;
        })
      )}

      {/* Compliance Statement */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Regulatory Compliance</Text>

        <View style={styles.section}>
          <Text style={styles.text}>
            This Fire Safety Training Report has been generated from the Fire Safety Log Book system
            and represents a complete record of all fire safety training activities undertaken during
            the period:
          </Text>
          <Text style={{ ...styles.text, fontWeight: 'bold', marginTop: 10 }}>
            {format(startDate, 'dd MMMM yyyy')} to {format(endDate, 'dd MMMM yyyy')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.text, fontSize: 11, fontWeight: 'bold', marginBottom: 10 }}>
            Legal Requirements
          </Text>
          <Text style={styles.text}>
            Article 21 of the Regulatory Reform (Fire Safety) Order 2005 requires that employers provide
            appropriate fire safety training to all employees:
          </Text>
          <Text style={{ ...styles.text, marginLeft: 15, marginTop: 5 }}>
            • Upon appointment{'\n'}
            • When exposed to new or increased risks{'\n'}
            • When responsibilities change{'\n'}
            • Periodically, to ensure competence is maintained
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.text, fontSize: 11, fontWeight: 'bold', marginBottom: 10 }}>
            Training Standards
          </Text>
          <Text style={styles.text}>
            Training delivered in accordance with:
          </Text>
          <Text style={{ ...styles.text, marginLeft: 15, marginTop: 5 }}>
            • Regulatory Reform (Fire Safety) Order 2005 Article 21{'\n'}
            • BS 9999:2017 (Fire safety in design, management and use of buildings){'\n'}
            • Fire Safety Guidance (DCLG){'\n'}
            • Health and Safety at Work etc. Act 1974
          </Text>
        </View>

        <View style={{ marginTop: 60 }}>
          <Text style={styles.text}>Generated: {format(new Date(), 'dd MMMM yyyy HH:mm')}</Text>
          <Text style={styles.text}>System: Fire Safety Log Book</Text>
          <Text style={styles.text}>Organisation: {org?.name || 'N/A'}</Text>
        </View>

        <View style={styles.footer}>
          <Text>Fire Safety Training Report | Final Page | Generated by Fire Safety Log Book</Text>
        </View>
      </Page>
    </Document>
  );
};
