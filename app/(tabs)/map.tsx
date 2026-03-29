import { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Report } from '../../types';
import { getReports } from '../../services/storage';
import { getCategoryById, CATEGORY_GROUPS, CATEGORIES } from '../../constants/categories';

// Central London — covers all boroughs at this zoom
const LONDON_REGION = {
  latitude: 51.509,
  longitude: -0.118,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export default function MapScreen() {
  const [reports, setReports] = useState<Report[]>([]);

  useFocusEffect(
    useCallback(() => {
      getReports().then(setReports);
    }, [])
  );

  // Unique colors for the legend
  const legendItems = CATEGORY_GROUPS.map((group) => {
    const first = CATEGORIES.find((c) => c.group === group.id);
    return first ? { title: group.title, color: first.color } : null;
  }).filter(Boolean) as { title: string; color: string }[];

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={LONDON_REGION}
        showsUserLocation
      >
        {reports.map((report) => {
          const category = getCategoryById(report.categoryId);
          return (
            <Marker
              key={report.id}
              coordinate={report.location}
              pinColor={category?.color || '#999'}
            >
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>
                    {category?.icon} {category?.title}
                  </Text>
                  <Text style={styles.calloutDesc} numberOfLines={2}>
                    {report.description}
                  </Text>
                  <Text style={styles.calloutAuthority}>
                    {report.authorityName}
                  </Text>
                  {report.reference && (
                    <Text style={styles.calloutRef}>{report.reference}</Text>
                  )}
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      <View style={styles.legend}>
        {legendItems.map((item) => (
          <View key={item.title} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.title}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  callout: { width: 180, padding: 4 },
  calloutTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  calloutDesc: { fontSize: 12, color: '#6B7280' },
  calloutAuthority: { fontSize: 11, color: '#374151', marginTop: 4 },
  calloutRef: { fontSize: 11, color: '#3A7BD5', marginTop: 2, fontWeight: '500' },
  legend: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#ffffffee',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
  },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  legendText: { fontSize: 10, color: '#374151' },
});
