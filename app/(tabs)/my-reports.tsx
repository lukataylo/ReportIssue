import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Report } from '../../types';
import { getReports } from '../../services/storage';
import { getCategoryById } from '../../constants/categories';
import { getEscalationStatus } from '../../services/escalationService';

export default function MyReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadReports = useCallback(async () => {
    const data = await getReports();
    setReports(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  if (reports.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>No reports yet</Text>
        <Text style={styles.emptyText}>
          Reports you submit will appear here with escalation tracking.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {reports.map((report) => {
        const category = getCategoryById(report.categoryId);
        const escalation = getEscalationStatus(report);

        return (
          <TouchableOpacity
            key={report.id}
            style={[styles.card, { borderLeftColor: category?.color || '#999' }]}
            onPress={() => router.push(`/report-detail/${report.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {category?.icon} {category?.title || report.categoryId}
              </Text>
              <View style={[styles.statusBadge, statusBg(report.status)]}>
                <Text style={[styles.statusText, statusFg(report.status)]}>
                  {formatStatus(report.status)}
                </Text>
              </View>
            </View>

            <Text style={styles.cardDesc} numberOfLines={2}>
              {report.description}
            </Text>

            {/* Escalation stage dots */}
            <View style={styles.escalationRow}>
              {[1, 2, 3, 4].map((stage) => (
                <View
                  key={stage}
                  style={[
                    styles.stageDot,
                    stage <= report.escalationStage
                      ? styles.stageDotActive
                      : escalation.actions[stage - 1]?.available
                        ? styles.stageDotAvailable
                        : styles.stageDotLocked,
                  ]}
                />
              ))}
              {escalation.nextActionAvailable && (
                <Text style={styles.escalationBadge}>Action available</Text>
              )}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.cardAuthority}>{report.authorityName}</Text>
              <Text style={styles.cardDate}>
                {new Date(report.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
            </View>

            {report.reference && (
              <Text style={styles.cardRef}>Ref: {report.reference}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function formatStatus(status: string): string {
  return status.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusBg(status: string) {
  switch (status) {
    case 'submitted': return { backgroundColor: '#DBEAFE' };
    case 'awaiting-response': return { backgroundColor: '#FEF3C7' };
    case 'escalated-councillor': return { backgroundColor: '#FED7AA' };
    case 'escalated-mp': return { backgroundColor: '#FECACA' };
    case 'resolved': return { backgroundColor: '#D1FAE5' };
    default: return {};
  }
}

function statusFg(status: string) {
  switch (status) {
    case 'submitted': return { color: '#1D4ED8' };
    case 'awaiting-response': return { color: '#B45309' };
    case 'escalated-councillor': return { color: '#C2410C' };
    case 'escalated-mp': return { color: '#DC2626' };
    case 'resolved': return { color: '#059669' };
    default: return {};
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  content: { padding: 16, paddingBottom: 32 },
  empty: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 32, backgroundColor: '#F5F5F7',
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
    borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 3, elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1F2937', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 8 },
  statusText: { fontSize: 10, fontWeight: '600' },
  cardDesc: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  escalationRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 4,
  },
  stageDot: { width: 8, height: 8, borderRadius: 4 },
  stageDotActive: { backgroundColor: '#3A7BD5' },
  stageDotAvailable: { backgroundColor: '#F59E0B' },
  stageDotLocked: { backgroundColor: '#D1D5DB' },
  escalationBadge: {
    fontSize: 10, fontWeight: '600', color: '#D97706',
    backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, marginLeft: 6,
  },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cardAuthority: { fontSize: 11, color: '#6B7280' },
  cardDate: { fontSize: 11, color: '#9CA3AF' },
  cardRef: { fontSize: 11, color: '#1B2A4A', fontWeight: '500', marginTop: 4 },
});
