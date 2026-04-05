import {
  Report,
  CategoryId,
  ReportLocation,
  getCategoryById,
  calculateEscalationDate,
  composeReportEmailUrl,
  lookupMP,
  generateId,
  generateReference,
  resolveAuthority,
  resolveDeepLinkUrl,
} from '@fixitlondon/shared';
import { saveReport, getProfile } from './storage';

export interface SubmitResult {
  report: Report;
  openedExternal: boolean;
}

export function submitReport(params: {
  categoryId: CategoryId;
  description: string;
  location: ReportLocation;
  photoUri?: string;
  extras?: Record<string, string>;
}): SubmitResult {
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
    escalationHistory: [{
      stage: 1,
      date: new Date().toISOString(),
      action: `Report submitted to ${authority.name}`,
    }],
    escalationAvailableDate: calculateEscalationDate(category.escalationDays),
    boroughId: params.location.boroughId,
    postcode: params.location.postcode,
  };

  // MP lookup in background
  if (params.location.postcode) {
    lookupMP(params.location.postcode).then((mp) => {
      if (mp) {
        report.mpName = mp.name;
        report.mpEmail = mp.email;
      }
    });
  }

  let openedExternal = false;

  // For web: try email then deep link
  const profile = getProfile();
  if (authority.contactEmail && profile) {
    const emailUrl = composeReportEmailUrl(report, authority, category, profile);
    window.open(emailUrl, '_self');
    report.submissionMethod = 'email';
    openedExternal = true;
  } else {
    const url = resolveDeepLinkUrl(authority, params.location);
    if (url) {
      window.open(url, '_blank');
      report.submissionMethod = 'deeplink';
      openedExternal = true;
    }
  }

  saveReport(report);
  return { report, openedExternal };
}
