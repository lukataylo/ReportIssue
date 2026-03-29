import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { hasProfile, saveProfile } from '../services/profileService';

export default function RootLayout() {
  const [profileReady, setProfileReady] = useState<boolean | null>(null);
  const [name, setName] = useState('');
  const [postcode, setPostcode] = useState('');

  useEffect(() => {
    hasProfile().then(setProfileReady);
  }, []);

  const handleSaveProfile = async () => {
    if (!name.trim() || !postcode.trim()) return;
    await saveProfile({ name: name.trim(), postcode: postcode.trim().toUpperCase() });
    setProfileReady(true);
  };

  // Loading state
  if (profileReady === null) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Fix It London</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="report" />
        <Stack.Screen name="report-detail" />
      </Stack>

      {/* Profile setup modal — shown on first launch */}
      <Modal visible={!profileReady} animationType="slide" transparent={false}>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Welcome to Fix It London</Text>
            <Text style={styles.modalSubtitle}>
              We need a few details to pre-fill your reports and find your local
              representatives.
            </Text>

            <Text style={styles.fieldLabel}>Your name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Jane Smith"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>Your postcode</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. SE1 2QH"
              placeholderTextColor="#9CA3AF"
              value={postcode}
              onChangeText={setPostcode}
              autoCapitalize="characters"
            />

            <TouchableOpacity
              style={[
                styles.saveBtn,
                (!name.trim() || !postcode.trim()) && styles.saveBtnDisabled,
              ]}
              onPress={handleSaveProfile}
              disabled={!name.trim() || !postcode.trim()}
            >
              <Text style={styles.saveBtnText}>Get Started</Text>
            </TouchableOpacity>

            <Text style={styles.privacyNote}>
              Your details are stored locally on your device only.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1B2A4A',
  },
  loadingText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1B2A4A',
    justifyContent: 'center',
  },
  modalContent: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B2A4A',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  saveBtn: {
    backgroundColor: '#3A7BD5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  privacyNote: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
  },
});
