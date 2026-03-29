import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';
import { getCategoryById } from '../../constants/categories';
import { getAuthorityById, getBoroughAuthority } from '../../constants/authorities';
import { submitReport } from '../../services/reportService';
import { detectBorough, reverseGeocode } from '../../services/boroughDetection';
import { CategoryId, ReportLocation } from '../../types';

const LONDON_CENTER = {
  latitude: 51.509,
  longitude: -0.118,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

export default function ReportFormScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const router = useRouter();
  const category = getCategoryById(categoryId || '');

  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<ReportLocation | null>(null);
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [authorityName, setAuthorityName] = useState('');

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        // Reverse geocode for address + borough
        const geo = await reverseGeocode(coords.latitude, coords.longitude);
        setLocation({
          ...coords,
          address: geo?.address,
          postcode: geo?.postcode,
          boroughId: geo?.boroughId,
        });
        // Resolve authority name
        resolveAuthorityName(geo?.boroughId);
      }
    })();
  }, []);

  const resolveAuthorityName = (boroughId?: string) => {
    if (!category) return;
    if (category.fixedAuthorityId) {
      setAuthorityName(
        getAuthorityById(category.fixedAuthorityId)?.name || ''
      );
    } else if (boroughId) {
      setAuthorityName(
        getBoroughAuthority(boroughId)?.name || ''
      );
    }
  };

  const handleMapPress = async (e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    const coords = e.nativeEvent.coordinate;
    const geo = await reverseGeocode(coords.latitude, coords.longitude);
    setLocation({
      ...coords,
      address: geo?.address,
      postcode: geo?.postcode,
      boroughId: geo?.boroughId,
    });
    resolveAuthorityName(geo?.boroughId);
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Description required', 'Please describe the issue.');
      return;
    }
    if (!location) {
      Alert.alert('Location required', 'Please tap the map to set a location or enable location services.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitReport({
        categoryId: categoryId as CategoryId,
        description: description.trim(),
        location,
        photoUri,
        extras: Object.keys(extras).length > 0 ? extras : undefined,
      });
      router.replace({
        pathname: '/report/success',
        params: {
          reference: result.report.reference || '',
          authorityName: result.report.authorityName,
          openedExternal: result.openedExternal ? '1' : '0',
          categoryTitle: category?.title || '',
          escalationDate: result.report.escalationAvailableDate || '',
          escalationDays: String(category?.escalationDays || 0),
        },
      });
    } catch {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!category) {
    return (
      <View style={styles.center}>
        <Text>Category not found.</Text>
      </View>
    );
  }

  const mapRegion = location
    ? { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }
    : LONDON_CENTER;

  return (
    <>
      <Stack.Screen options={{ headerTitle: category.title }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {/* Authority routing banner */}
          <View style={[styles.banner, { backgroundColor: category.color + '15' }]}>
            <Text style={[styles.bannerText, { color: category.color }]}>
              {authorityName
                ? `Submitting to: ${authorityName}`
                : 'Set location to detect your council'}
            </Text>
          </View>

          {/* Map */}
          <Text style={styles.label}>Location</Text>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={mapRegion}
              onPress={handleMapPress}
              showsUserLocation
            >
              {location && (
                <Marker
                  coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                  pinColor={category.color}
                />
              )}
            </MapView>
          </View>
          {location?.address && (
            <Text style={styles.address}>{location.address}</Text>
          )}
          <Text style={styles.hint}>Tap the map to set the exact location</Text>

          {/* Photo */}
          <Text style={styles.label}>Photo (optional)</Text>
          <View style={styles.photoRow}>
            <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
              <Text style={styles.photoBtnText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}>
              <Text style={styles.photoBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>
          {photoUri && (
            <View style={styles.photoPreview}>
              <Image source={{ uri: photoUri }} style={styles.photo} />
              <TouchableOpacity onPress={() => setPhotoUri(undefined)}>
                <Text style={styles.removePhoto}>Remove photo</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Description */}
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe the issue..."
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Dynamic extra fields from category config */}
          {category.extraFields?.map((field) => (
            <View key={field.key}>
              <Text style={styles.label}>{field.label}</Text>
              {field.type === 'options' && field.options ? (
                <View style={styles.optionRow}>
                  {field.options.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.optionBtn,
                        extras[field.key] === opt && styles.optionBtnActive,
                      ]}
                      onPress={() => setExtras({ ...extras, [field.key]: opt })}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          extras[field.key] === opt && styles.optionTextActive,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <TextInput
                  style={styles.input}
                  placeholder={field.placeholder || ''}
                  placeholderTextColor="#9CA3AF"
                  value={extras[field.key] || ''}
                  onChangeText={(v) => setExtras({ ...extras, [field.key]: v })}
                  autoCapitalize={field.key === 'registration' ? 'characters' : 'sentences'}
                />
              )}
            </View>
          ))}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: category.color }]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  banner: { padding: 10, borderRadius: 8, marginBottom: 12 },
  bannerText: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 16 },
  hint: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  address: { fontSize: 13, color: '#374151', marginTop: 6, fontWeight: '500' },
  mapContainer: { borderRadius: 12, overflow: 'hidden', height: 200, backgroundColor: '#E5E7EB' },
  map: { flex: 1 },
  photoRow: { flexDirection: 'row', gap: 10 },
  photoBtn: {
    flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 10,
    alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB',
  },
  photoBtnText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  photoPreview: { marginTop: 10, alignItems: 'center' },
  photo: { width: '100%', height: 180, borderRadius: 10 },
  removePhoto: { color: '#EF4444', fontSize: 13, fontWeight: '500', marginTop: 6 },
  textArea: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 15,
    minHeight: 100, borderWidth: 1, borderColor: '#E5E7EB', color: '#1F2937',
  },
  input: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 15,
    borderWidth: 1, borderColor: '#E5E7EB', color: '#1F2937',
  },
  optionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  optionBtn: {
    flexGrow: 1, padding: 10, borderRadius: 8, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', minWidth: 80,
  },
  optionBtnActive: { backgroundColor: '#1B2A4A', borderColor: '#1B2A4A' },
  optionText: { fontSize: 13, fontWeight: '500', color: '#374151' },
  optionTextActive: { color: '#fff' },
  submitBtn: { marginTop: 24, padding: 16, borderRadius: 12, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
