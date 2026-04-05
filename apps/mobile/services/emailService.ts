import { Linking } from 'react-native';
import { Report, Authority, Category, UserProfile, composeReportEmailUrl, composeEscalationEmailUrl } from '@fixitlondon/shared';

export async function composeReportEmail(
  report: Report,
  authority: Authority,
  category: Category,
  profile: UserProfile
): Promise<void> {
  const url = composeReportEmailUrl(report, authority, category, profile);
  await Linking.openURL(url);
}

export async function composeEscalationEmail(
  to: string,
  recipientName: string,
  recipientRole: 'Councillor' | 'MP',
  report: Report,
  categoryTitle: string,
  profile: UserProfile
): Promise<void> {
  const url = composeEscalationEmailUrl(to, recipientName, recipientRole, report, categoryTitle, profile);
  await Linking.openURL(url);
}
