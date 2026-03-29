import {
  Report, CategoryId, ReportLocation,
  getCategoryById, calculateEscalationDate, lookupMP,
  submitViaOpen311, getFixMyStreetUrl,
  generateId, generateReference, resolveAuthority, resolveDeepLinkUrl,
} from '@fixitlondon/shared';
import { composeReportEmail } from './emailService';
import { saveReport } from './storage';
import { getProfile } from './profileService';
import * as WebBrowser from 'expo-web-browser';

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
