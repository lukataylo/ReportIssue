import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { CATEGORIES, CATEGORY_GROUPS } from '../../constants/categories';
import { detectBorough } from '../../services/boroughDetection';
import { getAuthorityById, getBoroughAuthority } from '../../constants/authorities';
import { DetectedBorough, Category } from '../../types';

export default function HomeScreen() {
  const router = useRouter();
  const [borough, setBorough] = useState<DetectedBorough | null>(null);
  const [detecting, setDetecting] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          const result = await detectBorough(
            loc.coords.latitude,
            loc.coords.longitude
          );
          setBorough(result);
        }
      } catch {
        // Detection failed — app still works without it
      } finally {
        setDetecting(false);
      }
    })();
  }, []);

  const getAuthorityLabel = useCallback(
    (category: Category): string => {
      if (category.fixedAuthorityId) {
        return getAuthorityById(category.fixedAuthorityId)?.name || category.fixedAuthorityId;
      }
      if (borough) {
        return getBoroughAuthority(borough.boroughId)?.name || borough.boroughName;
      }
      return 'Your Council';
    },
    [borough]
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Borough detection banner */}
      <View style={styles.boroughBanner}>
        {detecting ? (
          <View style={styles.boroughRow}>
            <ActivityIndicator size="small" color="#3A7BD5" />
            <Text style={styles.boroughText}>Detecting your borough...</Text>
          </View>
        ) : borough ? (
          <Text style={styles.boroughText}>
            Reporting in: <Text style={styles.boroughName}>{borough.boroughName}</Text>
          </Text>
        ) : (
          <Text style={styles.boroughText}>
            Could not detect borough — reports will use FixMyStreet
          </Text>
        )}
      </View>

      <Text style={styles.heading}>What would you like to report?</Text>

      {/* Grouped categories */}
      {CATEGORY_GROUPS.map((group) => {
        const groupCategories = CATEGORIES.filter((c) => c.group === group.id);
        if (groupCategories.length === 0) return null;

        return (
          <View key={group.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{group.title}</Text>
            {groupCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.card, { borderLeftColor: category.color }]}
                onPress={() => router.push(`/report/${category.id}`)}
                activeOpacity={0.7}
              >
                <Text style={styles.cardIcon}>{category.icon}</Text>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{category.title}</Text>
                  <Text style={styles.cardSubtitle}>{category.subtitle}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: category.color + '15' }]}>
                  <Text
                    style={[styles.badgeText, { color: category.color }]}
                    numberOfLines={1}
                  >
                    {category.fixedAuthorityId
                      ? getAuthorityById(category.fixedAuthorityId)?.name || ''
                      : borough
                        ? 'Council'
                        : 'Council'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  content: { padding: 16, paddingBottom: 32 },
  boroughBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  boroughRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  boroughText: { fontSize: 13, color: '#374151' },
  boroughName: { fontWeight: '700', color: '#1B2A4A' },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 6,
  },
  cardIcon: { fontSize: 26, marginRight: 12 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  cardSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 80,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
  },
});
