import { Linking } from 'react-native';
import { Report, Authority, Category, UserProfile } from '../types';

export async function composeReportEmail(
  report: Report,
  authority: Authority,
  category: Category,
  profile: UserProfile
): Promise<void> {
  const to = authority.contactEmail || '';
  const subject = `Issue Report: ${category.title} — ${report.location.address || `${report.location.latitude.toFixed(4)}, ${report.location.longitude.toFixed(4)}`}`;
  const body = [
    `Dear ${authority.name},`,
    '',
    'I would like to report the following issue:',
    '',
    `Category: ${category.title}`,
    `Location: ${report.location.address || 'See coordinates below'}`,
    `Coordinates: ${report.location.latitude.toFixed(6)}, ${report.location.longitude.toFixed(6)}`,
    report.location.postcode ? `Postcode: ${report.location.postcode}` : '',
    '',
    'Description:',
    report.description,
    '',
    report.extras
      ? Object.entries(report.extras)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n')
      : '',
    '',
    'Thank you for your attention to this matter.',
    '',
    `${profile.name}`,
    profile.postcode ? `Postcode: ${profile.postcode}` : '',
    '',
    'Sent via Fix It London',
  ]
    .filter((line) => line !== undefined)
    .join('\n');

  const url = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
  const salutation =
    recipientRole === 'MP'
      ? `Dear ${recipientName} MP`
      : `Dear Councillor ${recipientName}`;

  const subject = `Unresolved issue: ${categoryTitle} — Ref ${report.reference}`;
  const body = [
    `${salutation},`,
    '',
    `I am writing to escalate an issue I reported to ${report.authorityName} on ${formatDate(report.createdAt)} which remains unresolved.`,
    '',
    `Reference: ${report.reference}`,
    `Category: ${categoryTitle}`,
    `Location: ${report.location.address || `${report.location.latitude.toFixed(4)}, ${report.location.longitude.toFixed(4)}`}`,
    '',
    'Original description:',
    report.description,
    '',
    recipientRole === 'MP'
      ? 'I have already attempted to escalate this through my local councillor without resolution.'
      : 'This issue has been outstanding beyond the expected response time.',
    '',
    'I would be grateful if you could look into this matter.',
    '',
    'Yours sincerely,',
    profile.name,
    profile.postcode ? `Postcode: ${profile.postcode}` : '',
    '',
    'Sent via Fix It London',
  ].join('\n');

  const url = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  await Linking.openURL(url);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
