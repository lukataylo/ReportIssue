import { useState, useEffect, useMemo } from 'react';
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
import {
  CATEGORIES,
  CATEGORY_GROUPS,
  getCategoryById,
  getAuthorityById,
  getBoroughAuthority,
  CategoryId,
  ReportLocation,
  Category,
  classifyImage,
  isClassifierAvailable,
  ClassificationSuggestion,
} from '@fixitlondon/shared';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';
import { submitReport } from '../../services/reportService';
import { reverseGeocode } from '../../services/boroughDetection';

const GEMINI_API_KEY = Constants.expoConfig?.extra?.geminiApiKey || '';

const LONDON_CENTER = {
  latitude: 51.509,
  longitude: -0.118,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

export default function NewReportScreen() {
  const params = useLocalSearchParams<{ photoUri?: string; categoryId?: string }>();
  const router = useRouter();

  // Step management: 1=photo, 2=describe, 3=category, 4=review
  const [step, setStep] = useState(params.photoUri ? 2 : 1);
  const [photoUri, setPhotoUri] = useState<string | undefined>(params.photoUri);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<ReportLocation | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(params.categoryId);
  const [categorySearch, setCategorySearch] = useState('');
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [authorityName, setAuthorityName] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<ClassificationSuggestion[]>([]);
  const [classifying, setClassifying] = useState(false);

  const selectedCategory = selectedCategoryId ? getCategoryById(selectedCategoryId) : null;

  // Auto-detect location on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        const geo = await reverseGeocode(coords.latitude, coords.longitude);
        setLocation({
          ...coords,
          address: geo?.address,
          postcode: geo?.postcode,
          boroughId: geo?.boroughId,
        });
      }
    })();
  }, []);

  // Resolve authority when category or location changes
  useEffect(() => {
    if (!selectedCategory) { setAuthorityName(''); return; }
    if (selectedCategory.fixedAuthorityId) {
      setAuthorityName(getAuthorityById(selectedCategory.fixedAuthorityId)?.name || '');
    } else if (location?.boroughId) {
      setAuthorityName(getBoroughAuthority(location.boroughId)?.name || '');
    } else {
      setAuthorityName('');
    }
  }, [selectedCategory, location]);

  // Classify photo with Gemini when photo is set
  useEffect(() => {
    if (!photoUri || !isClassifierAvailable(GEMINI_API_KEY)) return;
    let cancelled = false;
    setClassifying(true);
    (async () => {
      try {
        const base64 = await FileSystem.readAsStringAsync(photoUri, { encoding: 'base64' });
        const ext = photoUri.split('.').pop()?.toLowerCase() || 'jpeg';
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
        const result = await classifyImage(base64, mimeType, { apiKey: GEMINI_API_KEY });
        if (!cancelled) setAiSuggestions(result.suggestions);
      } catch {
        // Classification failed silently — user picks manually
      } finally {
        if (!cancelled) setClassifying(false);
      }
    })();
    return () => { cancelled = true; };
  }, [photoUri]);

  // If categoryId was passed, skip to step 2
  useEffect(() => {
    if (params.categoryId) setStep(2);
  }, [params.categoryId]);

  // Filtered categories for search
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return CATEGORIES;
    const q = categorySearch.toLowerCase();
    return CATEGORIES.filter(
      (c) => c.title.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q)
    );
  }, [categorySearch]);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setStep(2);
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], quality: 0.7, allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setStep(2);
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
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Description required', 'Please describe the issue.');
      return;
    }
    if (!location) {
      Alert.alert('Location required', 'Please enable location services.');
      return;
    }
    if (!selectedCategoryId) {
      Alert.alert('Category required', 'Please select an issue category.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitReport({
        categoryId: selectedCategoryId as CategoryId,
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
          categoryTitle: selectedCategory?.title || '',
          escalationDate: result.report.escalationAvailableDate || '',
          escalationDays: String(selectedCategory?.escalationDays || 0),
        },
      });
    } catch {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const mapRegion = location
    ? { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }
    : LONDON_CENTER;

  const stepTitles = ['Take Photo', 'Describe Issue', 'Select Category', 'Review & Submit'];

  return (
    <>
      <Stack.Screen options={{ headerTitle: stepTitles[step - 1] }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Progress bar */}
        <View style={styles.progressBar}>
          {[1, 2, 3, 4].map((s) => (
            <View
              key={s}
              style={[styles.progressStep, s <= step && styles.progressStepActive]}
            />
          ))}
        </View>

        {/* Step 1: Photo */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={styles.photoHero}>
              <Text style={styles.stepIcon}>📷</Text>
              <Text style={styles.stepTitle}>Capture the issue</Text>
              <Text style={styles.stepSubtitle}>A photo helps authorities identify and fix the problem faster</Text>
            </View>
            <View style={styles.photoActions}>
              <TouchableOpacity style={styles.primaryBtn} onPress={takePhoto}>
                <Text style={styles.primaryBtnText}>Open Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={pickPhoto}>
                <Text style={styles.secondaryBtnText}>Choose from Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.skipBtn} onPress={() => setStep(2)}>
                <Text style={styles.skipBtnText}>Skip — no photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 2: Describe */}
        {step === 2 && (
          <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
            {photoUri && (
              <View style={styles.photoThumbRow}>
                <Image source={{ uri: photoUri }} style={styles.photoThumb} />
                <TouchableOpacity onPress={() => { setPhotoUri(undefined); setStep(1); }}>
                  <Text style={styles.changePhoto}>Change photo</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.label}>What's the issue? *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="e.g. Large pothole on the left side of the road, about 30cm wide..."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoFocus={!!photoUri}
            />

            <Text style={styles.label}>Location</Text>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={mapRegion}
                onPress={handleMapPress}
                showsUserLocation
              >
                {location && (
                  <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }} />
                )}
              </MapView>
            </View>
            {location?.address ? (
              <Text style={styles.address}>{location.address}{location.postcode ? ` — ${location.postcode}` : ''}</Text>
            ) : (
              <Text style={styles.hint}>Detecting your location...</Text>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, { marginTop: 24 }, !description.trim() && styles.btnDisabled]}
              onPress={() => setStep(3)}
              disabled={!description.trim()}
            >
              <Text style={styles.primaryBtnText}>Next: Choose Category</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Step 3: Category selection */}
        {step === 3 && (
          <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
            {/* AI Suggestions */}
            {classifying && (
              <View style={styles.aiSection}>
                <View style={styles.aiHeader}>
                  <ActivityIndicator size="small" color="#3A7BD5" />
                  <Text style={styles.aiHeaderText}>Analysing photo...</Text>
                </View>
              </View>
            )}
            {!classifying && aiSuggestions.length > 0 && (
              <View style={styles.aiSection}>
                <Text style={styles.aiSectionTitle}>AI Suggestions</Text>
                {aiSuggestions.map((s) => {
                  const cat = getCategoryById(s.categoryId);
                  if (!cat) return null;
                  return (
                    <TouchableOpacity
                      key={s.categoryId}
                      style={[catStyles.card, { borderLeftColor: cat.color }, selectedCategoryId === s.categoryId && catStyles.cardSelected]}
                      onPress={() => { setSelectedCategoryId(s.categoryId); setStep(4); }}
                      activeOpacity={0.7}
                    >
                      <Text style={catStyles.icon}>{cat.icon}</Text>
                      <View style={catStyles.text}>
                        <Text style={catStyles.title}>{cat.title}</Text>
                        <Text style={styles.aiReasoning}>{s.reasoning}</Text>
                      </View>
                      <View style={styles.confidenceBadge}>
                        <Text style={styles.confidenceText}>{Math.round(s.confidence * 100)}%</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                <Text style={styles.aiDivider}>Or browse all categories:</Text>
              </View>
            )}

            <TextInput
              style={styles.searchInput}
              placeholder="Search categories..."
              placeholderTextColor="#9CA3AF"
              value={categorySearch}
              onChangeText={setCategorySearch}
            />

            {categorySearch.trim() ? (
              // Flat filtered list
              filteredCategories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  selected={selectedCategoryId === cat.id}
                  onPress={() => {
                    setSelectedCategoryId(cat.id);
                    setStep(4);
                  }}
                />
              ))
            ) : (
              // Grouped list
              CATEGORY_GROUPS.map((group) => {
                const groupCats = CATEGORIES.filter((c) => c.group === group.id);
                if (groupCats.length === 0) return null;
                return (
                  <View key={group.id}>
                    <Text style={styles.sectionTitle}>{group.title}</Text>
                    {groupCats.map((cat) => (
                      <CategoryCard
                        key={cat.id}
                        category={cat}
                        selected={selectedCategoryId === cat.id}
                        onPress={() => {
                          setSelectedCategoryId(cat.id);
                          setStep(4);
                        }}
                      />
                    ))}
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && selectedCategory && (
          <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
            {/* Review summary */}
            <View style={styles.reviewCard}>
              {photoUri && <Image source={{ uri: photoUri }} style={styles.reviewPhoto} />}

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Category</Text>
                <TouchableOpacity onPress={() => setStep(3)}>
                  <Text style={styles.reviewValue}>
                    {selectedCategory.icon} {selectedCategory.title}
                    <Text style={styles.editLink}> change</Text>
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Description</Text>
                <TouchableOpacity onPress={() => setStep(2)}>
                  <Text style={styles.reviewValue} numberOfLines={2}>
                    {description}
                    <Text style={styles.editLink}> edit</Text>
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Location</Text>
                <Text style={styles.reviewValue}>
                  {location?.address || (location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Not set')}
                </Text>
              </View>

              {authorityName ? (
                <View style={[styles.routingBanner, { backgroundColor: selectedCategory.color + '15' }]}>
                  <Text style={[styles.routingText, { color: selectedCategory.color }]}>
                    Will be submitted to: {authorityName}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Extra fields */}
            {selectedCategory.extraFields?.map((field) => (
              <View key={field.key}>
                <Text style={styles.label}>{field.label}</Text>
                {field.type === 'options' && field.options ? (
                  <View style={styles.optionRow}>
                    {field.options.map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={[styles.optionBtn, extras[field.key] === opt && styles.optionBtnActive]}
                        onPress={() => setExtras({ ...extras, [field.key]: opt })}
                      >
                        <Text style={[styles.optionText, extras[field.key] === opt && styles.optionTextActive]}>
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
                  />
                )}
              </View>
            ))}

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: selectedCategory.color }]}
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
        )}
      </KeyboardAvoidingView>
    </>
  );
}

function CategoryCard({ category, selected, onPress }: { category: Category; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[
        catStyles.card,
        { borderLeftColor: category.color },
        selected && catStyles.cardSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={catStyles.icon}>{category.icon}</Text>
      <View style={catStyles.text}>
        <Text style={catStyles.title}>{category.title}</Text>
        <Text style={catStyles.subtitle}>{category.subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

const catStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4,
    marginBottom: 6, shadowColor: '#000', shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 3, elevation: 1,
  },
  cardSelected: { backgroundColor: '#EFF6FF', borderColor: '#3A7BD5' },
  icon: { fontSize: 26, marginRight: 12 },
  text: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 1 },
});

const styles = StyleSheet.create({
  progressBar: {
    flexDirection: 'row', gap: 4, paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#fff',
  },
  progressStep: {
    flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB',
  },
  progressStepActive: { backgroundColor: '#3A7BD5' },

  stepContainer: { flex: 1, justifyContent: 'center', padding: 24 },
  photoHero: { alignItems: 'center', marginBottom: 32 },
  stepIcon: { fontSize: 48, marginBottom: 12 },
  stepTitle: { fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  stepSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  photoActions: { gap: 10 },

  scrollContainer: { flex: 1, backgroundColor: '#F5F5F7' },
  scrollContent: { padding: 16, paddingBottom: 40 },

  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 16 },
  hint: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  address: { fontSize: 13, color: '#374151', marginTop: 6, fontWeight: '500' },

  photoThumbRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  photoThumb: { width: 80, height: 60, borderRadius: 8 },
  changePhoto: { fontSize: 13, fontWeight: '600', color: '#3A7BD5' },

  mapContainer: { borderRadius: 12, overflow: 'hidden', height: 180, backgroundColor: '#E5E7EB' },
  map: { flex: 1 },

  textArea: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 15,
    minHeight: 100, borderWidth: 1, borderColor: '#E5E7EB', color: '#1F2937',
  },
  input: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 15,
    borderWidth: 1, borderColor: '#E5E7EB', color: '#1F2937',
  },
  searchInput: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 15,
    borderWidth: 1, borderColor: '#E5E7EB', color: '#1F2937', marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 12,
  },

  reviewCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  reviewPhoto: { width: '100%', height: 180, borderRadius: 10, marginBottom: 12 },
  reviewRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  reviewLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  reviewValue: { fontSize: 15, color: '#1F2937', marginTop: 2 },
  editLink: { fontSize: 13, color: '#3A7BD5', fontWeight: '600' },
  routingBanner: { padding: 10, borderRadius: 8, marginTop: 12 },
  routingText: { fontSize: 13, fontWeight: '500', textAlign: 'center' },

  optionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  optionBtn: {
    flexGrow: 1, padding: 10, borderRadius: 8, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', minWidth: 80,
  },
  optionBtnActive: { backgroundColor: '#1B2A4A', borderColor: '#1B2A4A' },
  optionText: { fontSize: 13, fontWeight: '500', color: '#374151' },
  optionTextActive: { color: '#fff' },

  primaryBtn: {
    backgroundColor: '#3A7BD5', padding: 16, borderRadius: 14, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: '#fff', padding: 16, borderRadius: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  skipBtn: { padding: 12, alignItems: 'center' },
  skipBtnText: { fontSize: 14, fontWeight: '500', color: '#9CA3AF' },
  btnDisabled: { opacity: 0.5 },

  submitBtn: { marginTop: 24, padding: 16, borderRadius: 14, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  aiSection: { marginBottom: 12 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  aiHeaderText: { fontSize: 14, color: '#3A7BD5', fontWeight: '500' },
  aiSectionTitle: { fontSize: 13, fontWeight: '700', color: '#3A7BD5', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  aiReasoning: { fontSize: 12, color: '#6B7280', marginTop: 2, fontStyle: 'italic' },
  confidenceBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginLeft: 8 },
  confidenceText: { fontSize: 12, fontWeight: '700', color: '#3A7BD5' },
  aiDivider: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 12, marginBottom: 4 },
});
