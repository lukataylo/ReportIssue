import AsyncStorage from '@react-native-async-storage/async-storage';
import { Report } from '@fixitlondon/shared';

const REPORTS_KEY = 'fixitlondon_reports';
const OLD_KEY = 'reportse_reports';

export async function getReports(): Promise<Report[]> {
  try {
    let data = await AsyncStorage.getItem(REPORTS_KEY);

    // Migrate from old ReportSE format if needed
    if (!data) {
      const oldData = await AsyncStorage.getItem(OLD_KEY);
      if (oldData) {
        const oldReports = JSON.parse(oldData);
        const migrated = oldReports.map(migrateReport);
        await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(migrated));
        await AsyncStorage.removeItem(OLD_KEY);
        return migrated;
      }
      return [];
    }

    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function getReportById(id: string): Promise<Report | null> {
  const reports = await getReports();
  return reports.find((r) => r.id === id) || null;
}

export async function saveReport(report: Report): Promise<void> {
  const reports = await getReports();
  reports.unshift(report);
  await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

export async function updateReport(updated: Report): Promise<void> {
  const reports = await getReports();
  const index = reports.findIndex((r) => r.id === updated.id);
  if (index !== -1) {
    reports[index] = updated;
    await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  }
}

export async function deleteReport(id: string): Promise<void> {
  const reports = await getReports();
  const filtered = reports.filter((r) => r.id !== id);
  await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(filtered));
}

// Migrate old ReportSE reports to Fix It London format
function migrateReport(old: Record<string, unknown>): Report {
  return {
    id: (old.id as string) || Date.now().toString(36),
    categoryId: old.categoryId as Report['categoryId'],
    description: (old.description as string) || '',
    location: (old.location as Report['location']) || { latitude: 51.509, longitude: -0.118 },
    photoUri: old.photoUri as string | undefined,
    status: 'submitted',
    reference: old.reference as string | undefined,
    authorityId: 'southwark',
    authorityName: 'London Borough of Southwark',
    submissionMethod: (old.submissionMethod as Report['submissionMethod']) || 'deeplink',
    createdAt: (old.createdAt as string) || new Date().toISOString(),
    extras: old.extras as Record<string, string> | undefined,
    escalationStage: 1,
    escalationHistory: [
      {
        stage: 1,
        date: (old.createdAt as string) || new Date().toISOString(),
        action: 'Report submitted (migrated from ReportSE)',
      },
    ],
  };
}
