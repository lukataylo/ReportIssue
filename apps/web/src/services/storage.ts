import type { Report, UserProfile } from '@fixitlondon/shared';

const REPORTS_KEY = 'fixitlondon_reports';
const PROFILE_KEY = 'fixitlondon_profile';

export function getReports(): Report[] {
  try {
    const data = localStorage.getItem(REPORTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getReportById(id: string): Report | null {
  return getReports().find((r) => r.id === id) || null;
}

export function saveReport(report: Report): void {
  const reports = getReports();
  reports.unshift(report);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

export function updateReport(updated: Report): void {
  const reports = getReports();
  const index = reports.findIndex((r) => r.id === updated.id);
  if (index !== -1) {
    reports[index] = updated;
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  }
}

export function deleteReport(id: string): void {
  const reports = getReports().filter((r) => r.id !== id);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

export function getProfile(): UserProfile | null {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function hasProfile(): boolean {
  const profile = getProfile();
  return profile !== null && profile.name.length > 0 && profile.postcode.length > 0;
}
