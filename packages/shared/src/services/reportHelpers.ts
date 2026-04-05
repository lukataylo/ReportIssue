import { CategoryId, ReportLocation, Authority } from '../types';
import { getCategoryById } from '../constants/categories';
import { getAuthorityById, getBoroughAuthority } from '../constants/authorities';

export const REFERENCE_PREFIXES: Record<string, string> = {
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

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function generateReference(authorityType: string): string {
  const prefix = REFERENCE_PREFIXES[authorityType] || 'FIL';
  const year = new Date().getFullYear();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${num}`;
}

export function resolveAuthority(
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

export function resolveDeepLinkUrl(authority: Authority, location: ReportLocation): string | null {
  if (authority.deepLinkUrlTemplate) {
    return authority.deepLinkUrlTemplate
      .replace('{{lat}}', location.latitude.toString())
      .replace('{{lon}}', location.longitude.toString());
  }
  return authority.deepLinkUrl || null;
}
