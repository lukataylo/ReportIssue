import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { DetectedBorough, Report, getCategoryById } from '@fixitlondon/shared';
import { detectBorough } from '../../services/boroughDetection';
import { getReports } from '../../services/storage';

export default function HomeScreen() {
  const router = useRouter();
  const [borough, setBorough] = useState<DetectedBorough | null>(null);
  const [recentReports, setRecentReports] = useState<Report[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          const result = await detectBorough(loc.coords.latitude, loc.coords.longitude);
          setBorough(result);
        }
      } catch {
        // Detection failed — app still works without it
      }
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      getReports().then((r) => setRecentReports(r.slice(0, 3)));
    }, [])
  );

  const startReport = async (source: 'camera' | 'gallery') => {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return;
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true });
      if (!result.canceled && result.assets[0]) {
        router.push({ pathname: '/report/new', params: { photoUri: result.assets[0].uri } });
      }
    } else {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: true,
      });
      if (!result.canceled && result.assets[0]) {
        router.push({ pathname: '/report/new', params: { photoUri: result.assets[0].uri } });
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Hero section */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>See something?{'\n'}Report it.</Text>
        <Text style={styles.heroSubtitle}>
          {borough
            ? `Reporting in ${borough.boroughName}`
            : 'Snap a photo to get started'}
        </Text>

        <TouchableOpacity
          style={styles.cameraBtn}
          onPress={() => startReport('camera')}
          activeOpacity={0.8}
        >
          <Text style={styles.cameraBtnIcon}>📷</Text>
          <Text style={styles.cameraBtnText}>Take Photo & Report</Text>
        </TouchableOpacity>

        <View style={styles.altRow}>
          <TouchableOpacity
            style={styles.altBtn}
            onPress={() => startReport('gallery')}
          >
            <Text style={styles.altBtnText}>Choose from Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.altBtn}
            onPress={() => router.push({ pathname: '/report/new' })}
          >
            <Text style={styles.altBtnText}>Skip Photo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent reports */}
      {recentReports.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Reports</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/my-reports')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentReports}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            renderItem={({ item }) => {
              const cat = getCategoryById(item.categoryId);
              return (
                <TouchableOpacity
                  style={styles.recentCard}
                  onPress={() => router.push(`/report-detail/${item.id}`)}
                >
                  {item.photoUri ? (
                    <Image source={{ uri: item.photoUri }} style={styles.recentPhoto} />
                  ) : (
                    <View style={[styles.recentPhoto, styles.recentPhotoPlaceholder]}>
                      <Text style={{ fontSize: 24 }}>{cat?.icon || '📢'}</Text>
                    </View>
                  )}
                  <Text style={styles.recentCardTitle} numberOfLines={1}>
                    {cat?.title || 'Report'}
                  </Text>
                  <Text style={styles.recentCardStatus}>
                    {item.status.replace(/-/g, ' ')}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* Browse categories link */}
      <TouchableOpacity
        style={styles.browseBtn}
        onPress={() => router.push('/report/categories')}
      >
        <Text style={styles.browseBtnIcon}>📋</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.browseBtnTitle}>Browse Categories</Text>
          <Text style={styles.browseBtnSub}>Pick a specific issue type first</Text>
        </View>
        <Text style={styles.browseBtnArrow}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },

  hero: {
    backgroundColor: '#1B2A4A',
    paddingTop: 20,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 34,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 24,
  },
  cameraBtn: {
    backgroundColor: '#3A7BD5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 10,
  },
  cameraBtnIcon: { fontSize: 22 },
  cameraBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  altRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  altBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  altBtnText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },

  recentSection: { marginTop: 20 },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  recentTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  seeAll: { fontSize: 13, fontWeight: '600', color: '#3A7BD5' },
  recentCard: {
    width: 130,
    marginRight: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  recentPhoto: { width: 130, height: 80 },
  recentPhotoPlaceholder: {
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentCardTitle: { fontSize: 13, fontWeight: '600', color: '#1F2937', paddingHorizontal: 8, paddingTop: 8 },
  recentCardStatus: {
    fontSize: 11, color: '#6B7280', paddingHorizontal: 8, paddingBottom: 8,
    marginTop: 2, textTransform: 'capitalize',
  },

  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  browseBtnIcon: { fontSize: 28 },
  browseBtnTitle: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  browseBtnSub: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  browseBtnArrow: { fontSize: 24, color: '#9CA3AF' },
});
