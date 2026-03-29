// Types
export * from './types';

// Constants
export { CATEGORIES, CATEGORY_GROUPS, getCategoryById, getCategoriesByGroup } from './constants/categories';
export { AUTHORITIES, getAuthorityById, getBoroughAuthority } from './constants/authorities';
export { LONDON_BOROUGHS, findBoroughByName, findBoroughById } from './constants/boroughs';
export { BANK_HOLIDAYS, isBankHoliday, isWeekend, isWorkingDay } from './constants/bankHolidays';

// Pure services
export { lookupMP, getWriteToThemUrl } from './services/representativeLookup';
export { submitViaOpen311, getFixMyStreetUrl } from './services/open311';

// Escalation helpers (pure date math)
export {
  calculateEscalationDate,
  daysUntilEscalation,
  getEscalationStatus,
} from './services/escalationService';

// Email composer (pure template generation)
export {
  composeReportEmailUrl,
  composeEscalationEmailUrl,
} from './services/emailComposer';
