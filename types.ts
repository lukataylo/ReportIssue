// === Authority Types ===

export type AuthorityType =
  | 'borough'
  | 'tfl'
  | 'met-police'
  | 'city-police'
  | 'canary-wharf'
  | 'thames-water'
  | 'streetlink'
  | 'lime'
  | 'network-rail';

export type SubmissionMethod = 'open311' | 'email' | 'deeplink';

export interface Authority {
  id: string;
  name: string;
  type: AuthorityType;
  fixmystreetJurisdiction?: string;
  contactEmail?: string;
  websiteUrl?: string;
  deepLinkUrl?: string;
  deepLinkUrlTemplate?: string;
}

// === Category Types ===

export type CategoryId =
  | 'potholes'
  | 'fly-tipping'
  | 'graffiti'
  | 'broken-paving'
  | 'streetlights'
  | 'noise'
  | 'abandoned-vehicle'
  | 'overflowing-bins'
  | 'parks-greenspaces'
  | 'traffic-lights'
  | 'bus-stops'
  | 'road-markings'
  | 'tube-issues'
  | 'bus-lanes'
  | 'cycle-lanes'
  | 'crime'
  | 'suspicious-activity'
  | 'rough-sleeping'
  | 'flooding'
  | 'asb'
  | 'obstructing-scooter'
  | 'damaged-bike';

export type CategoryGroup =
  | 'streets'
  | 'environment'
  | 'transport'
  | 'safety'
  | 'other';

export interface ExtraFieldDef {
  key: string;
  label: string;
  type: 'text' | 'options';
  options?: string[];
  placeholder?: string;
}

export interface Category {
  id: CategoryId;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  group: CategoryGroup;
  responsibleAuthority: AuthorityType | 'auto';
  fixedAuthorityId?: string;
  escalationDays: number;
  extraFields?: ExtraFieldDef[];
}

export interface CategoryGroupDef {
  id: CategoryGroup;
  title: string;
}

// === Borough Detection ===

export interface BoroughInfo {
  id: string;
  name: string;
  gssCode: string;
}

export interface DetectedBorough {
  boroughId: string;
  boroughName: string;
  postcode?: string;
}

// === Report Types ===

export type ReportStatus =
  | 'submitted'
  | 'awaiting-response'
  | 'escalated-councillor'
  | 'escalated-mp'
  | 'resolved';

export type EscalationStage = 1 | 2 | 3 | 4;

export interface EscalationEvent {
  stage: EscalationStage;
  date: string;
  action: string;
  contactedEmail?: string;
}

export interface ReportLocation {
  latitude: number;
  longitude: number;
  address?: string;
  boroughId?: string;
  postcode?: string;
}

export interface Report {
  id: string;
  categoryId: CategoryId;
  description: string;
  location: ReportLocation;
  photoUri?: string;
  status: ReportStatus;
  reference?: string;
  authorityId: string;
  authorityName: string;
  submissionMethod: SubmissionMethod;
  createdAt: string;
  extras?: Record<string, string>;
  escalationStage: EscalationStage;
  escalationHistory: EscalationEvent[];
  escalationAvailableDate?: string;
  councillorEmail?: string;
  councillorName?: string;
  mpEmail?: string;
  mpName?: string;
  postcode?: string;
  boroughId?: string;
}

// === Representative Types ===

export interface Representative {
  name: string;
  role: 'MP' | 'Councillor';
  email?: string;
  party?: string;
  constituency?: string;
  ward?: string;
}

// === User Profile ===

export interface UserProfile {
  name: string;
  postcode: string;
  email?: string;
}
