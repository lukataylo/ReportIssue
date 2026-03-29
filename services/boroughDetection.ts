import AsyncStorage from '@react-native-async-storage/async-storage';
import { DetectedBorough } from '../types';
import { findBoroughByName } from '../constants/boroughs';

const CACHE_KEY = 'fixitlondon_borough_cache';

// Canary Wharf bounding box (within Tower Hamlets)
const CANARY_WHARF_BOUNDS = {
  minLat: 51.500,
  maxLat: 51.508,
  minLon: -0.026,
  maxLon: -0.014,
};

export function isInCanaryWharf(lat: number, lon: number): boolean {
  return (
    lat >= CANARY_WHARF_BOUNDS.minLat &&
    lat <= CANARY_WHARF_BOUNDS.maxLat &&
    lon >= CANARY_WHARF_BOUNDS.minLon &&
    lon <= CANARY_WHARF_BOUNDS.maxLon
  );
}

export async function detectBorough(
  lat: number,
  lon: number
): Promise<DetectedBorough | null> {
  try {
    const response = await fetch(
      `https://api.postcodes.io/postcodes?lon=${lon}&lat=${lat}&limit=1`
    );
    if (!response.ok) return getCachedBorough();

    const data = await response.json();
    const result = data?.result?.[0];
    if (!result) return getCachedBorough();

    const adminDistrict: string = result.admin_district || '';
    const postcode: string = result.postcode || '';
    const borough = findBoroughByName(adminDistrict);

    if (!borough) return getCachedBorough();

    const detected: DetectedBorough = {
      boroughId: borough.id,
      boroughName: borough.name,
      postcode,
    };

    // Cache for offline use
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(detected));
    return detected;
  } catch {
    return getCachedBorough();
  }
}

async function getCachedBorough(): Promise<DetectedBorough | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<{ address?: string; postcode?: string; boroughId?: string } | null> {
  try {
    const response = await fetch(
      `https://api.postcodes.io/postcodes?lon=${lon}&lat=${lat}&limit=1`
    );
    if (!response.ok) return null;

    const data = await response.json();
    const result = data?.result?.[0];
    if (!result) return null;

    const borough = findBoroughByName(result.admin_district || '');

    return {
      address: [result.admin_ward, result.admin_district].filter(Boolean).join(', '),
      postcode: result.postcode,
      boroughId: borough?.id,
    };
  } catch {
    return null;
  }
}
