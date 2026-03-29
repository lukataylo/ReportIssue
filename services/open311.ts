import { Report } from '../types';

// FixMyStreet Open311 v2 API — works for all London boroughs
// Documentation: https://www.fixmystreet.com/open311
const FIXMYSTREET_BASE = 'https://www.fixmystreet.com/open311/v2';

const SERVICE_CODES: Record<string, string> = {
  potholes: 'Potholes',
  'fly-tipping': 'Flytipping',
  graffiti: 'Graffiti',
  'broken-paving': 'Pavements/footpaths',
  streetlights: 'Street lighting',
  'overflowing-bins': 'Rubbish (refuse and recycling)',
  'parks-greenspaces': 'Parks/landscapes',
  noise: 'Noise report',
  asb: 'Other',
  'abandoned-vehicle': 'Abandoned vehicles',
  'dangerous-trees': 'Trees',
  'missing-manhole-cover': 'Manhole cover - Loss or damaged',
  'damaged-street-furniture': 'Street furniture',
  'damaged-road-signs': 'Signs/bollards',
  'faulty-parking-meters': 'Parking meters/machines',
  'dog-fouling': 'Dog fouling',
  litter: 'Litter',
  'pest-infestation': 'Pest problem',
  'japanese-knotweed': 'Trees',
  'air-quality': 'Other',
  'blocked-drain': 'Blocked drain',
  'blocked-dropped-kerb': 'Pavements/footpaths',
  'housing-disrepair': 'Other',
  'estate-maintenance': 'Other',
  'dead-animal': 'Dead animal',
};

export async function submitViaOpen311(
  report: Report,
  jurisdictionId: string,
  apiKey?: string
): Promise<{ reference: string } | null> {
  if (!apiKey) return null;

  const serviceCode = SERVICE_CODES[report.categoryId];
  if (!serviceCode) return null;

  try {
    const body = new FormData();
    body.append('api_key', apiKey);
    body.append('service_code', serviceCode);
    body.append('lat', report.location.latitude.toString());
    body.append('long', report.location.longitude.toString());
    body.append('description', report.description);
    body.append('jurisdiction_id', jurisdictionId);

    if (report.photoUri) {
      const filename = report.photoUri.split('/').pop() || 'photo.jpg';
      body.append('media', {
        uri: report.photoUri,
        type: 'image/jpeg',
        name: filename,
      } as unknown as Blob);
    }

    const response = await fetch(`${FIXMYSTREET_BASE}/requests.json`, {
      method: 'POST',
      body,
    });

    if (!response.ok) {
      console.warn('Open311 submission failed:', response.status);
      return null;
    }

    const data = await response.json();
    if (Array.isArray(data) && data.length > 0 && data[0].service_request_id) {
      return { reference: data[0].service_request_id };
    }
    return null;
  } catch (error) {
    console.warn('Open311 error:', error);
    return null;
  }
}

export function getFixMyStreetUrl(lat: number, lon: number): string {
  return `https://www.fixmystreet.com/report/new?latitude=${lat}&longitude=${lon}`;
}
