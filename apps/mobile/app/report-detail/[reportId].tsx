import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Report, getCategoryById, lookupMP, getWriteToThemUrl } from '@fixitlondon/shared';
import { getReportById, deleteReport } from '../../services/storage';
import {
  getEscalationStatus,
  escalateReport,
  resolveReport,
  daysUntilEscalation,
} from '../../services/escalationService';
import { composeEscalationEmail } from '../../services/emailService';
import { getProfile } from '../../services/profileService';

export default function ReportDetailScreen() {
  const { reportId } = useLocalSearchParams<{ reportId: string }>();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);

  const loadReport = useCallback(async () => {
    if (!reportId) return;
    const r = await getReportById(reportId);
    if (r) {
      // Try to fill in MP data if missing
      if (!r.mpName && r.postcode) {
        const mp = await lookupMP(r.postcode);
        if (mp) {
          r.mpName = mp.name;
          r.mpEmail = mp.email;
        }
      }
      setReport(r);
    }
  }, [reportId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  if (!report) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>Loading...</Text>
      </View>
    );
  }

  const category = getCategoryById(report.categoryId);
  const escalation = getEscalationStatus(report);

  const handleEscalate = async (stage: 2 | 3 | 4) => {
    const labels = {
      2: 'escalation',
      3: 'councillor contact',
      4: 'MP contact',
    };
    Alert.alert(
      `Confirm ${labels[stage]}`,
      `This will advance the escalation. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            if (stage === 3 && report.councillorEmail) {
              const profile = await getProfile();
              if (profile) {
                await composeEscalationEmail(
                  report.councillorEmail,
                  report.councillorName || 'Councillor',
                  'Councillor',
                  report,
                  category?.title || '',
                  profile
                );
              }
            } else if (stage === 3 && report.postcode) {
              // Open WriteToThem to find councillor
              await WebBrowser.openBrowserAsync(
                getWriteToThemUrl(report.postcode)
              );
            }

            if (stage === 4 && report.mpEmail) {
              const profile = await getProfile();
              if (profile) {
                await composeEscalationEmail(
                  report.mpEmail,
                  report.mpName || 'MP',
                  'MP',
                  report,
                  category?.title || '',
                  profile
                );
              }
            } else if (stage === 4 && report.postcode) {
              await WebBrowser.openBrowserAsync(
                getWriteToThemUrl(report.postcode)
              );
            }

            const updated = await escalateReport(
              report.id,
              stage,
              `Escalated to stage ${stage}`
            );
            if (updated) setReport({ ...updated });
          },
        },
      ]
    );
  };

  const handleResolve = () => {
    Alert.alert('Mark as resolved?', 'This will close the escalation timeline.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Resolve',
        onPress: async () => {
          await resolveReport(report.id);
          loadReport();
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete this report?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteReport(report.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{ headerTitle: category?.title || 'Report Detail' }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryIcon}>{category?.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>{category?.title}</Text>
              <Text style={styles.summaryAuthority}>{report.authorityName}</Text>
            </View>
            <View style={[styles.statusBadge, statusBg(report.status)]}>
              <Text style={[styles.statusText, statusFg(report.status)]}>
                {report.status.replace(/-/g, ' ')}
              </Text>
            </View>
          </View>

          {report.reference && (
            <Text style={styles.reference}>Ref: {report.reference}</Text>
          )}

          <Text style={styles.description}>{report.description}</Text>

          {report.location.address && (
            <Text style={styles.location}>{report.location.address}</Text>
          )}

          <Text style={styles.date}>
            Submitted{' '}
            {new Date(report.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>

          {report.photoUri && (
            <Image source={{ uri: report.photoUri }} style={styles.photo} />
          )}
        </View>

        {/* Escalation Timeline */}
        <Text style={styles.sectionTitle}>Escalation Timeline</Text>
        <View style={styles.timeline}>
          {escalation.actions.map((action, index) => {
            const isLast = index === escalation.actions.length - 1;
            return (
              <View key={action.stage} style={styles.timelineItem}>
                {/* Connector line */}
                {!isLast && (
                  <View
                    style={[
                      styles.timelineLine,
                      action.completed
                        ? styles.timelineLineActive
                        : styles.timelineLineInactive,
                    ]}
                  />
                )}

                {/* Dot */}
                <View
                  style={[
                    styles.timelineDot,
                    action.completed
                      ? styles.dotCompleted
                      : action.available
                        ? styles.dotAvailable
                        : styles.dotLocked,
                  ]}
                >
                  <Text style={styles.dotText}>
                    {action.completed ? '✓' : action.available ? '!' : action.stage}
                  </Text>
                </View>

                {/* Content */}
                <View style={styles.timelineContent}>
                  <Text
                    style={[
                      styles.timelineLabel,
                      !action.completed && !action.available && styles.timelineLabelLocked,
                    ]}
                  >
                    {action.label}
                  </Text>

                  {action.date && action.stage <= 2 && (
                    <Text style={styles.timelineDate}>
                      {action.stage === 1
                        ? new Date(action.date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : action.completed
                          ? 'Escalated'
                          : `${daysUntilEscalation(action.date)} days remaining`}
                    </Text>
                  )}

                  {action.contactName && (action.completed || action.available) && (
                    <Text style={styles.contactName}>
                      {action.contactName}
                      {action.contactEmail ? ` — ${action.contactEmail}` : ''}
                    </Text>
                  )}

                  {action.available && report.status !== 'resolved' && (
                    <TouchableOpacity
                      style={styles.escalateBtn}
                      onPress={() => handleEscalate(action.stage as 2 | 3 | 4)}
                    >
                      <Text style={styles.escalateBtnText}>
                        {action.stage === 2
                          ? 'Escalate'
                          : action.stage === 3
                            ? 'Email Councillor'
                            : 'Email MP'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {!action.completed && !action.available && (
                    <Text style={styles.lockedText}>
                      {action.stage === 2
                        ? 'Waiting for response period to pass'
                        : `Complete stage ${action.stage - 1} first`}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {report.status !== 'resolved' && (
            <TouchableOpacity style={styles.resolveBtn} onPress={handleResolve}>
              <Text style={styles.resolveBtnText}>Mark as Resolved</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>Delete Report</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

function statusBg(status: string) {
  const map: Record<string, object> = {
    submitted: { backgroundColor: '#DBEAFE' },
    'awaiting-response': { backgroundColor: '#FEF3C7' },
    'escalated-councillor': { backgroundColor: '#FED7AA' },
    'escalated-mp': { backgroundColor: '#FECACA' },
    resolved: { backgroundColor: '#D1FAE5' },
  };
  return map[status] || {};
}

function statusFg(status: string) {
  const map: Record<string, object> = {
    submitted: { color: '#1D4ED8' },
    'awaiting-response': { color: '#B45309' },
    'escalated-councillor': { color: '#C2410C' },
    'escalated-mp': { color: '#DC2626' },
    resolved: { color: '#059669' },
  };
  return map[status] || {};
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F7' },
  centerText: { fontSize: 16, color: '#6B7280' },

  // Summary card
  summaryCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6, elevation: 2, marginBottom: 20,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  summaryIcon: { fontSize: 32, marginRight: 10 },
  summaryTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  summaryAuthority: { fontSize: 13, color: '#6B7280', marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  reference: { fontSize: 13, fontWeight: '600', color: '#1B2A4A', marginBottom: 8 },
  description: { fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 8 },
  location: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  date: { fontSize: 12, color: '#9CA3AF', marginBottom: 8 },
  photo: { width: '100%', height: 180, borderRadius: 10, marginTop: 4 },

  // Timeline
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12,
  },
  timeline: { marginBottom: 24 },
  timelineItem: {
    flexDirection: 'row', marginBottom: 4, minHeight: 70, position: 'relative',
  },
  timelineLine: {
    position: 'absolute', left: 15, top: 32, width: 2, bottom: -4,
  },
  timelineLineActive: { backgroundColor: '#3A7BD5' },
  timelineLineInactive: { backgroundColor: '#D1D5DB' },
  timelineDot: {
    width: 32, height: 32, borderRadius: 16, justifyContent: 'center',
    alignItems: 'center', marginRight: 12, zIndex: 1,
  },
  dotCompleted: { backgroundColor: '#3A7BD5' },
  dotAvailable: { backgroundColor: '#F59E0B' },
  dotLocked: { backgroundColor: '#E5E7EB' },
  dotText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  timelineContent: { flex: 1, paddingBottom: 16 },
  timelineLabel: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  timelineLabelLocked: { color: '#9CA3AF' },
  timelineDate: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  contactName: { fontSize: 12, color: '#3A7BD5', marginTop: 4 },
  lockedText: { fontSize: 11, color: '#9CA3AF', marginTop: 4, fontStyle: 'italic' },
  escalateBtn: {
    backgroundColor: '#F59E0B', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 8, alignSelf: 'flex-start', marginTop: 8,
  },
  escalateBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Actions
  actions: { marginTop: 8 },
  resolveBtn: {
    backgroundColor: '#059669', padding: 14, borderRadius: 10,
    alignItems: 'center', marginBottom: 8,
  },
  resolveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  deleteBtn: {
    backgroundColor: '#fff', padding: 14, borderRadius: 10,
    alignItems: 'center', borderWidth: 1, borderColor: '#FECACA',
  },
  deleteBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '500' },
});
