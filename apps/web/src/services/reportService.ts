import {
  Report,
  CategoryId,
  ReportLocation,
  Authority,
  getCategoryById,
  getAuthorityById,
  getBoroughAuthority,
  calculateEscalationDate,
  composeReportEmailUrl,
  lookupMP,
} from '@fixitlondon/shared';
import { saveReport, getProfile } from './storage';

const REFERENCE_PREFIXES: Record<string, string> = {
  borough: 'FIL', tfl: 'TFL', 'met-police': 'MET', 'city-police': 'CLP',
  'canary-wharf': 'CWG', 'thames-water': 'THW', streetlink: 'STL', lime: 'LME',
  'network-rail': 'NRL', ukpn: 'UKP', 'cadent-gas': 'GAS', openreach: 'OPR',
  veolia: 'VEO', biffa: 'BIF', serco: 'SRC', 'crown-estate': 'CRE',
  grosvenor: 'GRV', 'great-portland-estates': 'GPE', cadogan: 'CAD',
  'howard-de-walden': 'HDW', 'portman-estate': 'PRT', 'shaftesbury-capital': 'SHC',
  'british-land': 'BRL', landsec: 'LSC', argent: 'ARG', peabody: 'PBY',
  lq: 'LNQ', clarion: 'CLR', 'notting-hill-genesis': 'NHG', mtvh: 'MTV',
  rspca: 'RSP', 'environment-agency': 'ENV', 'port-of-london': 'PLA',
  hse: 'HSE', 'national-highways': 'NHW', tier: 'TIR', dott: 'DOT', voi: 'VOI',
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function generateReference(authorityType: string): string {
  const prefix = REFERENCE_PREFIXES[authorityType] || 'FIL';
  const year = new Date().getFullYear();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${num}`;
}

function resolveAuthority(
  categoryId: CategoryId,
  fixedAuthorityId: string | undefined,
  location: ReportLocation
): Authority {
  if (fixedAuthorityId) {
    if (
      (categoryId === 'crime' || categoryId === 'suspicious-activity') &&
      location.boroughId === 'city-of-london'
    ) {
      return getAuthorityById('city-police')!;
    }
    return getAuthorityById(fixedAuthorityId)!;
  }
  if (location.boroughId) {
    const borough = getBoroughAuthority(location.boroughId);
    if (borough) return borough;
  }
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
