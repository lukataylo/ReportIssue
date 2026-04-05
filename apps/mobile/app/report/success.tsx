import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';

export default function SuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    reference: string;
    authorityName: string;
    openedExternal: string;
    categoryTitle: string;
    escalationDate: string;
    escalationDays: string;
  }>();

  const escalationDays = parseInt(params.escalationDays || '0', 10);

  return (
    <>
      <Stack.Screen
        options={{ headerTitle: 'Report Submitted', headerBackVisible: false }}
      />
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.icon}>✅</Text>
          <Text style={styles.title}>Report Submitted</Text>
          <Text style={styles.subtitle}>
            Your {params.categoryTitle?.toLowerCase()} report has been logged.
          </Text>

          {params.reference ? (
            <View style={styles.refBox}>
              <Text style={styles.refLabel}>Reference Number</Text>
              <Text style={styles.refValue}>{params.reference}</Text>
            </View>
          ) : null}

          <View style={styles.serviceBox}>
            <Text style={styles.serviceLabel}>Routed to</Text>
            <Text style={styles.serviceValue}>{params.authorityName}</Text>
          </View>

          {params.openedExternal === '1' && (
            <Text style={styles.note}>
              The {params.authorityName} website/email was opened so you can
              provide any additional details they require.
            </Text>
          )}

          {escalationDays > 0 && (
            <View style={styles.escalationBox}>
              <Text style={styles.escalationTitle}>Escalation Timeline</Text>
              <Text style={styles.escalationText}>
                If this issue isn't resolved within{' '}
                <Text style={{ fontWeight: '700' }}>{escalationDays} working days</Text>,
                you'll be able to escalate to your local councillor and MP.
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.replace('/(tabs)/my-reports')}
        >
          <Text style={styles.primaryBtnText}>View My Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.secondaryBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  refBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    padding: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  refLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  refValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B2A4A',
    marginTop: 2,
  },
  serviceBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  serviceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    marginTop: 2,
  },
  note: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  escalationBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
    width: '100%',
    marginTop: 4,
  },
  escalationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  escalationText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  primaryBtn: {
    backgroundColor: '#1B2A4A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryBtnText: { color: '#3A7BD5', fontSize: 15, fontWeight: '500' },
});
