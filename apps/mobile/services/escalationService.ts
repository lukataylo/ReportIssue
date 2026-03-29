import { EscalationStage, Report } from '@fixitlondon/shared';
import { getReportById, updateReport } from './storage';

// Re-export pure shared functions
export { getEscalationStatus, calculateEscalationDate, daysUntilEscalation } from '@fixitlondon/shared';

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
