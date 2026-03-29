import { Report, EscalationStage } from '../types';
import { isWeekend, isBankHoliday } from '../constants/bankHolidays';
import { getReportById, updateReport } from './storage';

export interface EscalationAction {
  stage: EscalationStage;
  label: string;
  date?: string;
  completed: boolean;
  available: boolean;
  contactEmail?: string;
  contactName?: string;
}

export interface EscalationStatus {
  currentStage: EscalationStage;
  actions: EscalationAction[];
  nextActionAvailable: boolean;
}

export function getEscalationStatus(report: Report): EscalationStatus {
  const now = new Date();
  const escalationDate = report.escalationAvailableDate
    ? new Date(report.escalationAvailableDate)
    : null;
  const stage2Available =
    escalationDate !== null && now >= escalationDate && report.status !== 'resolved';

  const actions: EscalationAction[] = [
    {
      stage: 1,
      label: `Submitted to ${report.authorityName}`,
      date: report.createdAt,
      completed: true,
      available: false,
    },
    {
      stage: 2,
      label: 'Escalation available',
      date: report.escalationAvailableDate,
      completed: report.escalationStage >= 2,
      available: stage2Available && report.escalationStage < 2,
    },
    {
      stage: 3,
      label: 'Contact local councillor',
      completed: report.escalationStage >= 3,
      available: report.escalationStage >= 2 && report.escalationStage < 3,
      contactEmail: report.councillorEmail,
      contactName: report.councillorName,
    },
    {
      stage: 4,
      label: 'Contact MP',
      completed: report.escalationStage >= 4,
      available: report.escalationStage >= 3 && report.escalationStage < 4,
      contactEmail: report.mpEmail,
      contactName: report.mpName,
    },
  ];

  return {
    currentStage: report.escalationStage,
    actions,
    nextActionAvailable: actions.some((a) => a.available),
  };
}

export function calculateEscalationDate(workingDays: number): string {
  const date = new Date();
  let counted = 0;
  while (counted < workingDays) {
    date.setDate(date.getDate() + 1);
    if (!isWeekend(date) && !isBankHoliday(date)) {
      counted++;
    }
  }
  return date.toISOString();
}

export function daysUntilEscalation(escalationDate: string): number {
  const now = new Date();
  const target = new Date(escalationDate);
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export async function escalateReport(
  reportId: string,
  toStage: EscalationStage,
  action: string,
  contactedEmail?: string
): Promise<Report | null> {
  const report = await getReportById(reportId);
  if (!report) return null;

  report.escalationStage = toStage;
  report.escalationHistory.push({
    stage: toStage,
    date: new Date().toISOString(),
    action,
    contactedEmail,
  });

  if (toStage === 2) report.status = 'awaiting-response';
  if (toStage === 3) report.status = 'escalated-councillor';
  if (toStage === 4) report.status = 'escalated-mp';

  await updateReport(report);
  return report;
}

export async function resolveReport(reportId: string): Promise<void> {
  const report = await getReportById(reportId);
  if (!report) return;
  report.status = 'resolved';
  report.escalationHistory.push({
    stage: report.escalationStage,
    date: new Date().toISOString(),
    action: 'Marked as resolved',
  });
  await updateReport(report);
}
