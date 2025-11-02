import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Define styles for PDF
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
  },
  badgePass: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
  },
  badgeFail: {
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
  },
  badgeWarning: {
    backgroundColor: '#F59E0B',
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
});

interface CompliancePackProps {
  data: {
    org: any;
    sites: any[];
    assets: any[];
    entries: any[];
    defects: any[];
    drills: any[];
    training: any[];
    users: any[];
  };
  startDate: Date;
  endDate: Date;
}

export const CompliancePackDocument: React.FC<CompliancePackProps> = ({ data, startDate, endDate }) => {
  const { org, sites, assets, entries, defects, drills = [], training = [], users } = data;

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          <Text style={styles.title}>Fire Safety Compliance Pack</Text>
          <Text style={styles.subtitle}>{org?.name || 'Organisation'}</Text>
          <Text style={styles.subtitle}>
            {format(startDate, 'dd MMMM yyyy')} - {format(endDate, 'dd MMMM yyyy')}
          </Text>
          <Text style={{ ...styles.text, marginTop: 40, textAlign: 'center', color: '#666' }}>
            This document provides a complete audit trail of fire safety compliance activities{'\n'}
            including checks, defects, and evidence for the specified period.
          </Text>
          <Text style={{ ...styles.text, marginTop: 20, textAlign: 'center', fontSize: 8, color: '#999' }}>
            Generated on {format(new Date(), 'dd MMMM yyyy HH:mm')}
          </Text>
        </View>
      </Page>

      {/* Summary Page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Executive Summary</Text>

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
            <Text style={styles.label}>Total Assets:</Text> {assets.length}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.text, fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>
            Compliance Statistics
          </Text>
          <View style={styles.table}>
            <View style={{ ...styles.tableRow, ...styles.tableHeader }}>
              <View style={styles.tableColWide}>
                <Text>Metric</Text>
              </View>
              <View style={styles.tableColWide}>
                <Text>Count</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColWide}>
                <Text>Checks Completed</Text>
              </View>
              <View style={styles.tableColWide}>
                <Text>{entries.length}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColWide}>
                <Text>Total Defects Raised</Text>
              </View>
              <View style={styles.tableColWide}>
                <Text>{defects.length}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColWide}>
                <Text>Critical Defects</Text>
              </View>
              <View style={styles.tableColWide}>
                <Text>{defects.filter((d: any) => d.severity === 'critical').length}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColWide}>
                <Text>Open Defects</Text>
              </View>
              <View style={styles.tableColWide}>
                <Text>{defects.filter((d: any) => d.status === 'open' || d.status === 'in_progress').length}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColWide}>
                <Text>Resolved Defects</Text>
              </View>
              <View style={styles.tableColWide}>
                <Text>{defects.filter((d: any) => d.status === 'resolved' || d.status === 'verified' || d.status === 'closed').length}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColWide}>
                <Text>Fire Drills Conducted</Text>
              </View>
              <View style={styles.tableColWide}>
                <Text>{drills.length}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableColWide}>
                <Text>Training Sessions</Text>
              </View>
              <View style={styles.tableColWide}>
                <Text>{training.length}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Fire Safety Compliance Pack | Page 2 | Generated by Fire Safety Log Book</Text>
        </View>
      </Page>

      {/* Assets Register */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Asset Register</Text>

        {assets.length === 0 ? (
          <Text style={styles.text}>No assets registered for this period.</Text>
        ) : (
          <View style={styles.table}>
            <View style={{ ...styles.tableRow, ...styles.tableHeader }}>
              <View style={styles.tableCol}>
                <Text>Asset Tag</Text>
              </View>
              <View style={styles.tableCol}>
                <Text>Type</Text>
              </View>
              <View style={styles.tableCol}>
                <Text>Location</Text>
              </View>
              <View style={styles.tableCol}>
                <Text>Status</Text>
              </View>
            </View>
            {assets.slice(0, 30).map((asset: any) => (
              <View key={asset.id} style={styles.tableRow}>
                <View style={styles.tableCol}>
                  <Text>{asset.tag || asset.name}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text>{asset.type?.replace(/_/g, ' ').toUpperCase() || 'N/A'}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text>{asset.location || 'N/A'}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text>{asset.status || 'active'}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {assets.length > 30 && (
          <Text style={{ ...styles.text, marginTop: 10, fontStyle: 'italic' }}>
            Showing first 30 of {assets.length} assets. Contact your administrator for complete asset list.
          </Text>
        )}

        <View style={styles.footer}>
          <Text>Fire Safety Compliance Pack | Page 3 | Generated by Fire Safety Log Book</Text>
        </View>
      </Page>

      {/* Completed Checks */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Completed Checks</Text>

        {entries.length === 0 ? (
          <Text style={styles.text}>No checks completed during this period.</Text>
        ) : (
          <View style={styles.table}>
            <View style={{ ...styles.tableRow, ...styles.tableHeader }}>
              <View style={styles.tableCol}>
                <Text>Date</Text>
              </View>
              <View style={styles.tableCol}>
                <Text>Asset</Text>
              </View>
              <View style={styles.tableCol}>
                <Text>Template</Text>
              </View>
              <View style={styles.tableCol}>
                <Text>Completed By</Text>
              </View>
            </View>
            {entries.slice(0, 25).map((entry: any) => {
              const asset = assets.find((a: any) => a.id === entry.assetId);
              const completedAt = entry.completedAt?.toDate ? entry.completedAt.toDate() : entry.completedAt;

              return (
                <View key={entry.id} style={styles.tableRow}>
                  <View style={styles.tableCol}>
                    <Text>{completedAt ? format(completedAt, 'dd/MM/yyyy') : 'N/A'}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text>{asset?.name || asset?.tag || 'Unknown'}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text>{entry.templateId || 'N/A'}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text>{entry.completedByName || 'Unknown'}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {entries.length > 25 && (
          <Text style={{ ...styles.text, marginTop: 10, fontStyle: 'italic' }}>
            Showing first 25 of {entries.length} completed checks.
          </Text>
        )}

        <View style={styles.footer}>
          <Text>Fire Safety Compliance Pack | Page 4 | Generated by Fire Safety Log Book</Text>
        </View>
      </Page>

      {/* Defects Report */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Defects Register</Text>

        {defects.length === 0 ? (
          <Text style={styles.text}>No defects raised during this period.</Text>
        ) : (
          <>
            {defects.slice(0, 15).map((defect: any) => {
              const asset = assets.find((a: any) => a.id === defect.assetId);
              const site = sites.find((s: any) => s.id === defect.siteId);
              const createdAt = defect.createdAt?.toDate ? defect.createdAt.toDate() : defect.createdAt;

              return (
                <View key={defect.id} style={{ ...styles.section, paddingBottom: 10, borderBottom: '1 solid #E5E7EB' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 11 }}>{defect.title}</Text>
                    <Text style={{
                      ...styles.badge,
                      ...(defect.severity === 'critical' ? styles.badgeFail :
                          defect.severity === 'high' ? styles.badgeWarning : {}),
                    }}>
                      {defect.severity?.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={{ ...styles.text, fontSize: 9, color: '#666' }}>
                    {defect.description || 'No description provided'}
                  </Text>
                  <View style={{ flexDirection: 'row', marginTop: 5, fontSize: 8, color: '#888' }}>
                    <Text style={{ marginRight: 15 }}>
                      Site: {site?.name || 'Unknown'}
                    </Text>
                    <Text style={{ marginRight: 15 }}>
                      Asset: {asset?.name || asset?.tag || 'General'}
                    </Text>
                    <Text>
                      Raised: {createdAt ? format(createdAt, 'dd/MM/yyyy') : 'N/A'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 8, marginTop: 3, color: defect.status === 'resolved' ? '#10B981' : '#EF4444' }}>
                    Status: {defect.status?.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                </View>
              );
            })}
          </>
        )}

        {defects.length > 15 && (
          <Text style={{ ...styles.text, marginTop: 10, fontStyle: 'italic' }}>
            Showing first 15 of {defects.length} defects.
          </Text>
        )}

        <View style={styles.footer}>
          <Text>Fire Safety Compliance Pack | Page 5 | Generated by Fire Safety Log Book</Text>
        </View>
      </Page>

      {/* Fire Drills Page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Fire Drills</Text>

        {drills.length === 0 ? (
          <Text style={styles.text}>No fire drills conducted during this period.</Text>
        ) : (
          <>
            <Text style={{ ...styles.text, marginBottom: 15 }}>
              Total drills conducted: {drills.length}
            </Text>
            {drills.slice(0, 10).map((drill: any) => {
              const site = sites.find((s: any) => s.id === drill.siteId);
              const drillDate = drill.date?.toDate ? drill.date.toDate() : drill.date;
              const formatEvacuationTime = (seconds: number) => {
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
              };

              return (
                <View key={drill.id} style={{ marginBottom: 15, paddingBottom: 10, borderBottom: '1 solid #E5E7EB' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 11 }}>
                      {site?.name || 'Unknown Site'} - {drillDate ? format(drillDate, 'dd/MM/yyyy') : 'N/A'}
                    </Text>
                    <View style={{
                      ...styles.badge,
                      ...(drill.allAccountedFor ? styles.badgePass : styles.badgeFail),
                    }}>
                      <Text>{drill.allAccountedFor ? 'ALL ACCOUNTED' : 'MISSING'}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 9, color: '#666', marginBottom: 3 }}>
                    Time: {drill.startTime || 'N/A'} | Evacuation: {formatEvacuationTime(drill.evacuationTime || 0)} |
                    Headcount: {drill.actualHeadcount || 0}{drill.expectedHeadcount ? ` / ${drill.expectedHeadcount}` : ''}
                  </Text>
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
                  {drill.issues && drill.issues.trim() && (
                    <View style={{ backgroundColor: '#FEF2F2', padding: 5, marginTop: 5 }}>
                      <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#991B1B' }}>
                        Issues: {drill.issues}
                      </Text>
                    </View>
                  )}
                  {drill.latitude && drill.longitude && (
                    <Text style={{ fontSize: 8, color: '#059669', marginTop: 3 }}>
                      GPS: {drill.latitude.toFixed(6)}, {drill.longitude.toFixed(6)}
                    </Text>
                  )}
                </View>
              );
            })}
          </>
        )}

        {drills.length > 10 && (
          <Text style={{ ...styles.text, marginTop: 10, fontStyle: 'italic' }}>
            Showing first 10 of {drills.length} drills. Generate a dedicated Fire Drills Report for complete details.
          </Text>
        )}

        <View style={styles.footer}>
          <Text>Fire Safety Compliance Pack | Page 6 | Generated by Fire Safety Log Book</Text>
        </View>
      </Page>

      {/* Training Records Page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Training Records</Text>

        {training.length === 0 ? (
          <Text style={styles.text}>No training sessions conducted during this period.</Text>
        ) : (
          <>
            <Text style={{ ...styles.text, marginBottom: 15 }}>
              Total training sessions: {training.length}
            </Text>
            {training.slice(0, 12).map((record: any) => {
              const site = sites.find((s: any) => s.id === record.siteId);
              const trainingDate = record.date?.toDate ? record.date.toDate() : record.date;
              const nextDue = record.nextDue?.toDate ? record.nextDue.toDate() : record.nextDue;

              const typeLabels: Record<string, string> = {
                induction: 'Induction',
                refresher: 'Refresher Training',
                drill: 'Evacuation Drill',
                specialist: 'Specialist Training',
              };

              return (
                <View key={record.id} style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1 solid #E5E7EB' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 11 }}>
                      {site?.name || 'Unknown Site'} - {trainingDate ? format(trainingDate, 'dd/MM/yyyy') : 'N/A'}
                    </Text>
                    <View style={{ ...styles.badge, backgroundColor: '#3B82F6', color: '#FFFFFF' }}>
                      <Text>{typeLabels[record.type] || record.type}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 9, color: '#333', marginBottom: 3 }}>
                    {record.syllabus}
                  </Text>
                  <Text style={{ fontSize: 8, color: '#666', marginBottom: 2 }}>
                    Trainer: {record.assessor}
                    {record.duration && ` | Duration: ${record.duration} mins`}
                  </Text>
                  {record.attendees && record.attendees.trim() && (
                    <Text style={{ fontSize: 8, color: '#666', marginBottom: 2 }}>
                      Attendees: {record.attendees}
                    </Text>
                  )}
                  {record.outcomes && record.outcomes.trim() && (
                    <Text style={{ fontSize: 8, color: '#666', marginTop: 2, fontStyle: 'italic' }}>
                      Outcomes: {record.outcomes}
                    </Text>
                  )}
                  {nextDue && (
                    <Text style={{ fontSize: 8, color: '#F59E0B', marginTop: 2 }}>
                      Next training due: {format(nextDue, 'dd/MM/yyyy')}
                    </Text>
                  )}
                </View>
              );
            })}
          </>
        )}

        {training.length > 12 && (
          <Text style={{ ...styles.text, marginTop: 10, fontStyle: 'italic' }}>
            Showing first 12 of {training.length} training sessions. Generate a dedicated Training Report for complete details.
          </Text>
        )}

        <View style={styles.footer}>
          <Text>Fire Safety Compliance Pack | Page 7 | Generated by Fire Safety Log Book</Text>
        </View>
      </Page>

      {/* Declaration Page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Declaration & Certification</Text>

        <View style={styles.section}>
          <Text style={styles.text}>
            This Fire Safety Compliance Pack has been generated from the Fire Safety Log Book system
            and represents a true and accurate record of all fire safety compliance activities
            undertaken during the period:
          </Text>
          <Text style={{ ...styles.text, fontWeight: 'bold', marginTop: 10 }}>
            {format(startDate, 'dd MMMM yyyy')} to {format(endDate, 'dd MMMM yyyy')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.text, fontSize: 11, fontWeight: 'bold', marginBottom: 10 }}>
            Document Integrity
          </Text>
          <Text style={styles.text}>
            All entries within this pack are cryptographically hashed to ensure immutability.
            Any tampering with check entries or evidence would be immediately detectable through
            hash verification.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.text, fontSize: 11, fontWeight: 'bold', marginBottom: 10 }}>
            Regulatory Compliance
          </Text>
          <Text style={styles.text}>
            This document is prepared in accordance with the requirements of:
          </Text>
          <Text style={{ ...styles.text, marginLeft: 15 }}>
            • Regulatory Reform (Fire Safety) Order 2005{'\n'}
            • BS 5839-1:2017 (Fire detection and alarm systems){'\n'}
            • BS 5266-1:2016 (Emergency lighting){'\n'}
            • BS 9999:2017 (Fire safety in design, management and use of buildings)
          </Text>
        </View>

        <View style={{ marginTop: 60 }}>
          <Text style={styles.text}>Generated: {format(new Date(), 'dd MMMM yyyy HH:mm')}</Text>
          <Text style={styles.text}>System: Fire Safety Log Book</Text>
          <Text style={styles.text}>Organisation: {org?.name || 'N/A'}</Text>
        </View>

        <View style={styles.footer}>
          <Text>Fire Safety Compliance Pack | Page 8 | Generated by Fire Safety Log Book</Text>
        </View>
      </Page>
    </Document>
  );
};
