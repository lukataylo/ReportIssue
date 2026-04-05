import { Report, Category, UserProfile } from '../types';

export type LetterType =
  | 'initial-complaint'
  | 'follow-up-reminder'
  | 'escalation-councillor'
  | 'escalation-mp'
  | 'foi-request'
  | 'ombudsman-complaint';

export interface LetterRecipient {
  name: string;
  role: string;
  organisation: string;
  address?: string;
  email?: string;
}

export interface LetterContext {
  report: Report;
  category: Category;
  profile: UserProfile;
  recipient: LetterRecipient;
  daysSinceSubmission?: number;
  previousEscalationDates?: string[];
}

export interface GeneratedLetter {
  type: LetterType;
  title: string;
  recipient: LetterRecipient;
  formattedText: string;
  subject: string;
}

interface LetterTypeDef {
  type: LetterType;
  title: string;
  description: string;
  minStage: number;
}

export const LETTER_TYPES: LetterTypeDef[] = [
  { type: 'initial-complaint', title: 'Initial Complaint', description: 'Formal complaint to the responsible authority', minStage: 1 },
  { type: 'follow-up-reminder', title: 'Follow-up Reminder', description: 'Chase a response after no reply', minStage: 1 },
  { type: 'escalation-councillor', title: 'Escalation to Councillor', description: 'Request intervention from your ward councillor', minStage: 2 },
  { type: 'escalation-mp', title: 'Escalation to MP', description: 'Formal letter to your Member of Parliament', minStage: 3 },
  { type: 'foi-request', title: 'Freedom of Information Request', description: 'Request data under the Freedom of Information Act 2000', minStage: 1 },
  { type: 'ombudsman-complaint', title: 'Ombudsman Complaint', description: 'Complaint to the Local Government Ombudsman', minStage: 3 },
];

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getSalutation(recipient: LetterRecipient): string {
  const surname = recipient.name.split(' ').pop() || recipient.name;
  if (recipient.role.includes('Councillor')) return `Councillor ${surname}`;
  if (recipient.role.includes('MP') || recipient.role.includes('Member of Parliament')) return `${recipient.name}`;
  return `Sir/Madam`;
}

function getClosing(recipient: LetterRecipient): string {
  const salutation = getSalutation(recipient);
  return salutation === 'Sir/Madam' ? 'Yours faithfully' : 'Yours sincerely';
}

function getLocationStr(report: Report): string {
  return report.location.address || `${report.location.latitude.toFixed(5)}, ${report.location.longitude.toFixed(5)}`;
}

function getLegislationRef(categoryId: string): string {
  const refs: Record<string, string> = {
    'potholes': 'Under Section 41 of the Highways Act 1980, the highway authority has a duty to maintain the highway. Failure to repair a dangerous pothole may constitute a breach of this duty.',
    'broken-paving': 'Under Section 41 of the Highways Act 1980, the highway authority has a duty to maintain the highway, including footways and pavements.',
    'fly-tipping': 'Fly-tipping is a criminal offence under Section 33 of the Environmental Protection Act 1990, punishable by an unlimited fine or imprisonment.',
    'graffiti': 'Under the Anti-social Behaviour, Crime and Policing Act 2014, graffiti constitutes criminal damage and local authorities have powers to issue Community Protection Notices.',
    'noise': 'Under Sections 79–82 of the Environmental Protection Act 1990, noise amounting to a statutory nuisance may be subject to an abatement notice.',
    'litter': 'Under Section 87 of the Environmental Protection Act 1990, dropping litter is an offence. Section 89 places a duty on local authorities to keep public land clear of litter.',
    'dog-fouling': 'Under the Anti-social Behaviour, Crime and Policing Act 2014, councils may make Public Spaces Protection Orders requiring dog owners to clean up after their animals.',
    'overflowing-bins': 'Under Section 89 of the Environmental Protection Act 1990, the council has a duty to keep land under its control clear of litter and refuse.',
    'dangerous-trees': 'Under the Highways Act 1980, local authorities have a duty to ensure that vegetation does not pose a danger to highway users.',
    'missing-manhole-cover': 'An open manhole on a public highway represents a serious hazard. Under Section 41 of the Highways Act 1980, the authority has a duty to maintain the highway in a safe condition.',
    'flooding': 'Under Section 6 of the Flood and Water Management Act 2010, lead local flood authorities have a duty to develop and maintain a strategy for managing local flood risk.',
    'blocked-drain': 'Under Section 100 of the Highways Act 1980, the highway authority has powers and duties regarding the drainage of highways.',
    'housing-disrepair': 'Under Section 11 of the Landlord and Tenant Act 1985, landlords must keep in repair the structure and exterior of the dwelling, and installations for water, gas, electricity, sanitation, and heating.',
    'air-quality': 'Under Part IV of the Environment Act 1995, local authorities have a duty to review and assess air quality in their area and take action where national objectives are not being met.',
    'building-safety': 'Under the Building Safety Act 2022, there are enhanced duties regarding the safety of buildings, particularly higher-risk buildings.',
  };
  return refs[categoryId] || '';
}

function buildLetterHeader(ctx: LetterContext): string {
  const lines = [
    ctx.profile.name,
    ctx.profile.postcode,
    '',
    formatDate(new Date()),
    '',
    ctx.recipient.name,
    ctx.recipient.role,
    ctx.recipient.organisation,
  ];
  if (ctx.recipient.address) lines.push(ctx.recipient.address);
  lines.push('', `Dear ${getSalutation(ctx.recipient)},`);
  return lines.join('\n');
}

function buildSubject(ctx: LetterContext, prefix?: string): string {
  const ref = ctx.report.reference ? ` (Ref: ${ctx.report.reference})` : '';
  const base = `${ctx.category.title} — ${getLocationStr(ctx.report)}${ref}`;
  return prefix ? `${prefix}: ${base}` : base;
}

function buildInitialComplaint(ctx: LetterContext): string {
  const subject = buildSubject(ctx);
  const legislation = getLegislationRef(ctx.report.categoryId);
  const legislationPara = legislation ? `\n\n${legislation}` : '';

  return `${buildLetterHeader(ctx)}

Re: ${subject}

I am writing to formally report an issue of ${ctx.category.title.toLowerCase()} at the following location: ${getLocationStr(ctx.report)}.

${ctx.report.description}${legislationPara}

I would be grateful if you could investigate this matter and arrange for appropriate action to be taken. I would appreciate a written response within 20 working days confirming what action will be taken and the expected timescale for resolution.

If I do not receive a satisfactory response within a reasonable timeframe, I reserve the right to escalate this matter to my ward councillor, Member of Parliament, or the Local Government and Social Care Ombudsman.

${getClosing(ctx.recipient)},

${ctx.profile.name}${ctx.profile.email ? `\n${ctx.profile.email}` : ''}`;
}

function buildFollowUpReminder(ctx: LetterContext): string {
  const subject = buildSubject(ctx, 'Follow-up');
  const days = ctx.daysSinceSubmission ?? 0;

  return `${buildLetterHeader(ctx)}

Re: ${subject}

I am writing to follow up on my previous report regarding ${ctx.category.title.toLowerCase()} at ${getLocationStr(ctx.report)}, which was submitted ${days} days ago${ctx.report.reference ? ` under reference ${ctx.report.reference}` : ''}.

To date, I have not received a substantive response or any indication that action has been taken to resolve this issue.

I would be grateful if you could provide a written update within 10 working days confirming:
1. Whether the issue has been inspected
2. What action is planned or has been taken
3. The expected timescale for resolution

Please note that if I do not receive a satisfactory response, I intend to escalate this matter to my ward councillor and, if necessary, to the Local Government and Social Care Ombudsman.

${getClosing(ctx.recipient)},

${ctx.profile.name}${ctx.profile.email ? `\n${ctx.profile.email}` : ''}`;
}

function buildEscalationCouncillor(ctx: LetterContext): string {
  const subject = buildSubject(ctx, 'Request for Intervention');
  const days = ctx.daysSinceSubmission ?? 0;

  return `${buildLetterHeader(ctx)}

Re: ${subject}

I am writing to request your assistance regarding an unresolved issue in your ward.

I reported an issue of ${ctx.category.title.toLowerCase()} at ${getLocationStr(ctx.report)} to ${ctx.report.authorityName} approximately ${days} days ago${ctx.report.reference ? ` (reference: ${ctx.report.reference})` : ''}. Despite following up, the matter remains unresolved.

${ctx.report.description}

I have attempted to resolve this through the normal reporting channels but have been unable to obtain a satisfactory outcome. As my ward councillor, I would be grateful if you could raise this matter with the relevant council department and help to ensure that appropriate action is taken.

I am happy to provide any additional information or photographs that may be helpful.

${getClosing(ctx.recipient)},

${ctx.profile.name}
${ctx.profile.postcode}${ctx.profile.email ? `\n${ctx.profile.email}` : ''}`;
}

function buildEscalationMP(ctx: LetterContext): string {
  const subject = buildSubject(ctx, 'Constituency Matter');
  const days = ctx.daysSinceSubmission ?? 0;
  const escalationHistory = ctx.previousEscalationDates?.length
    ? `\n\nI have previously escalated this to my ward councillor (${ctx.previousEscalationDates.join(', ')}) but the issue persists.`
    : '';

  return `${buildLetterHeader(ctx)}

Re: ${subject}

I am writing to you as my Member of Parliament to request your assistance with an ongoing local issue that has not been adequately addressed by the responsible authority.

I reported ${ctx.category.title.toLowerCase()} at ${getLocationStr(ctx.report)} approximately ${days} days ago${ctx.report.reference ? ` (reference: ${ctx.report.reference})` : ''}. The responsible authority is ${ctx.report.authorityName}.${escalationHistory}

${ctx.report.description}

Despite repeated attempts to resolve this through normal channels and local councillor intervention, the matter remains unresolved. I would be grateful if you could raise this issue with the relevant authority on my behalf, or advise on any further steps available to me as a constituent.

${getClosing(ctx.recipient)},

${ctx.profile.name}
${ctx.profile.postcode}${ctx.profile.email ? `\n${ctx.profile.email}` : ''}`;
}

function buildFOIRequest(ctx: LetterContext): string {
  return `${buildLetterHeader(ctx)}

Re: Freedom of Information Request — ${ctx.category.title}

I am writing to make a request for information under Section 1(1) of the Freedom of Information Act 2000.

Please provide the following information relating to ${ctx.category.title.toLowerCase()} in the ${ctx.report.location.address ? `area of ${ctx.report.location.address}` : `${ctx.report.location.postcode || 'local'} area`}:

1. The total number of reports received for this category of issue in the past 12 months
2. The average response time from report to initial inspection
3. The average time from report to resolution
4. The number of reports currently outstanding (unresolved)
5. Details of any action taken in response to reports in this area in the past 12 months

Under the Act, I expect to receive a response within 20 working days. If any part of this request is unclear, I would be happy to clarify. If any exemptions are applied, please specify which sections apply and provide a public interest test where relevant.

Yours faithfully,

${ctx.profile.name}${ctx.profile.email ? `\n${ctx.profile.email}` : ''}`;
}

function buildOmbudsmanComplaint(ctx: LetterContext): string {
  const days = ctx.daysSinceSubmission ?? 0;
  const escalationHistory = ctx.previousEscalationDates?.length
    ? ctx.previousEscalationDates.map((d, i) => `  ${i + 1}. Escalation on ${d}`).join('\n')
    : '  (No prior escalation dates recorded)';

  return `${buildLetterHeader(ctx)}

Re: Complaint regarding ${ctx.report.authorityName} — ${ctx.category.title}

I wish to make a formal complaint about the handling of a matter by ${ctx.report.authorityName}.

Summary of Complaint:

On ${ctx.report.createdAt ? new Date(ctx.report.createdAt).toLocaleDateString('en-GB') : 'the date of submission'}, I reported ${ctx.category.title.toLowerCase()} at ${getLocationStr(ctx.report)}${ctx.report.reference ? ` (reference: ${ctx.report.reference})` : ''}. It has now been ${days} days and the issue remains unresolved.

Escalation History:
${escalationHistory}

I have exhausted the normal complaints process and escalated through my ward councillor and Member of Parliament. I believe there has been maladministration in the handling of this matter, specifically:

- Failure to respond within a reasonable timeframe
- Failure to take appropriate action to resolve the reported issue
- Failure to provide adequate updates or communicate decisions

I would be grateful if the Ombudsman could investigate this complaint and make recommendations to the authority.

${ctx.report.description}

Yours faithfully,

${ctx.profile.name}
${ctx.profile.postcode}${ctx.profile.email ? `\n${ctx.profile.email}` : ''}`;
}

const BUILDERS: Record<LetterType, (ctx: LetterContext) => string> = {
  'initial-complaint': buildInitialComplaint,
  'follow-up-reminder': buildFollowUpReminder,
  'escalation-councillor': buildEscalationCouncillor,
  'escalation-mp': buildEscalationMP,
  'foi-request': buildFOIRequest,
  'ombudsman-complaint': buildOmbudsmanComplaint,
};

export function generateLetter(type: LetterType, context: LetterContext): GeneratedLetter {
  const def = LETTER_TYPES.find((lt) => lt.type === type);
  if (!def) throw new Error(`Unknown letter type: ${type}`);

  const builder = BUILDERS[type];
  const formattedText = builder(context);
  const subject = buildSubject(context, def.title);

  return {
    type,
    title: def.title,
    recipient: context.recipient,
    formattedText,
    subject,
  };
}

export function getAvailableLetterTypes(report: Report): LetterTypeDef[] {
  return LETTER_TYPES.filter((lt) => report.escalationStage >= lt.minStage);
}
