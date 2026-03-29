import { Report, CategoryId, ReportLocation, Authority, UserProfile } from '../types';
import { getCategoryById } from '../constants/categories';
import { getAuthorityById, getBoroughAuthority } from '../constants/authorities';
import { submitViaOpen311, getFixMyStreetUrl } from './open311';
import { composeReportEmail } from './emailService';
import { saveReport } from './storage';
import { calculateEscalationDate } from './escalationService';
import { lookupMP } from './representativeLookup';
import { getProfile } from './profileService';
import * as WebBrowser from 'expo-web-browser';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function generateReference(authorityType: string): string {
  const prefixes: Record<string, string> = {
    borough: 'FIL',
    tfl: 'TFL',
    'met-police': 'MET',
    'city-police': 'CLP',
    'canary-wharf': 'CWG',
    'thames-water': 'THW',
    streetlink: 'STL',
    lime: 'LME',
    'network-rail': 'NRL',
  };
  const prefix = prefixes[authorityType] || 'FIL';
  const year = new Date().getFullYear();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${num}`;
}

function resolveAuthority(
  categoryId: CategoryId,
  fixedAuthorityId: string | undefined,
  location: ReportLocation
): Authority {
  // Fixed authority categories (TfL, police, etc.)
  if (fixedAuthorityId) {
    // Special case: crime in City of London → City Police
    if (
      (categoryId === 'crime' || categoryId === 'suspicious-activity') &&
      location.boroughId === 'city-of-london'
    ) {
      return getAuthorityById('city-police')!;
    }
    return getAuthorityById(fixedAuthorityId)!;
  }

  // Auto-detect: use detected borough
  if (location.boroughId) {
    const borough = getBoroughAuthority(location.boroughId);
    if (borough) return borough;
  }

  // Fallback to a generic entry
  return getAuthorityById('southwark')!;
}

function resolveDeepLinkUrl(authority: Authority, location: ReportLocation): string | null {
  if (authority.deepLinkUrlTemplate) {
    return authority.deepLinkUrlTemplate
      .replace('{{lat}}', location.latitude.toString())
      .replace('{{lon}}', location.longitude.toString());
  }
  return authority.deepLinkUrl || null;
}

export interface SubmitResult {
  report: Report;
  openedExternal: boolean;
}

export async function submitReport(params: {
  categoryId: CategoryId;
  description: string;
  location: ReportLocation;
  photoUri?: string;
  extras?: Record<string, string>;
  apiKey?: string;
}): Promise<SubmitResult> {
  const category = getCategoryById(params.categoryId);
  if (!category) throw new Error('Invalid category');

  const authority = resolveAuthority(
    params.categoryId,
    category.fixedAuthorityId,
    params.location
  );

  const report: Report = {
    id: generateId(),
    categoryId: params.categoryId,
    description: params.description,
    location: params.location,
    photoUri: params.photoUri,
    status: 'submitted',
    reference: generateReference(authority.type),
    authorityId: authority.id,
    authorityName: authority.name,
    submissionMethod: 'deeplink',
    createdAt: new Date().toISOString(),
    extras: params.extras,
    escalationStage: 1,
    escalationHistory: [
      {
        stage: 1,
        date: new Date().toISOString(),
        action: `Report submitted to ${authority.name}`,
      },
    ],
    escalationAvailableDate: calculateEscalationDate(category.escalationDays),
    boroughId: params.location.boroughId,
    postcode: params.location.postcode,
  };

  // Lookup MP in background (best-effort)
  if (params.location.postcode) {
    lookupMP(params.location.postcode).then((mp) => {
      if (mp) {
        report.mpName = mp.name;
        report.mpEmail = mp.email;
      }
    });
  }

  let openedExternal = false;

  // Cascade: Open311 → Email → Deep Link
  // 1. Try Open311 for borough authorities
  if (authority.type === 'borough' && authority.fixmystreetJurisdiction) {
    const apiResult = await submitViaOpen311(
      report,
      authority.fixmystreetJurisdiction,
      params.apiKey
    );
    if (apiResult) {
      report.reference = apiResult.reference;
      report.submissionMethod = 'open311';
    } else {
      // 2. Try email
      const profile = await getProfile();
      if (authority.contactEmail && profile) {
        await composeReportEmail(report, authority, category, profile);
        report.submissionMethod = 'email';
        openedExternal = true;
      } else {
        // 3. Fallback to FixMyStreet web
        const url = getFixMyStreetUrl(
          params.location.latitude,
          params.location.longitude
        );
        await WebBrowser.openBrowserAsync(url);
        report.submissionMethod = 'deeplink';
        openedExternal = true;
      }
    }
  } else if (authority.contactEmail) {
    // Non-borough with email (e.g. Canary Wharf, Network Rail)
    const profile = await getProfile();
    if (profile) {
      await composeReportEmail(report, authority, category, profile);
      report.submissionMethod = 'email';
      openedExternal = true;
    } else {
      const url = resolveDeepLinkUrl(authority, params.location);
      if (url) {
        await WebBrowser.openBrowserAsync(url);
        report.submissionMethod = 'deeplink';
        openedExternal = true;
      }
    }
  } else {
    // Non-borough with deep link only (police, TfL, etc.)
    const url = resolveDeepLinkUrl(authority, params.location);
    if (url) {
      await WebBrowser.openBrowserAsync(url);
      report.submissionMethod = 'deeplink';
      openedExternal = true;
    }
  }

  // Always save locally
  await saveReport(report);

  return { report, openedExternal };
}
