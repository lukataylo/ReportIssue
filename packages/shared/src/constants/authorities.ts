import { Authority } from '../types';

// Helper to create a borough authority entry — all London boroughs use FixMyStreet Open311
function borough(
  id: string,
  name: string,
  contactEmail: string,
  websiteUrl: string,
  jurisdiction?: string
): Authority {
  return {
    id,
    name: name.startsWith('City') ? name : `London Borough of ${name}`,
    type: 'borough',
    fixmystreetJurisdiction: jurisdiction || id,
    contactEmail,
    websiteUrl,
  };
}

export const AUTHORITIES: Authority[] = [
  // === 33 London Boroughs ===
  borough('barking-dagenham', 'Barking and Dagenham', 'contact@lbbd.gov.uk', 'https://www.lbbd.gov.uk'),
  borough('barnet', 'Barnet', 'first.contact@barnet.gov.uk', 'https://www.barnet.gov.uk'),
  borough('bexley', 'Bexley', 'customer.services@bexley.gov.uk', 'https://www.bexley.gov.uk'),
  borough('brent', 'Brent', 'customer.services@brent.gov.uk', 'https://www.brent.gov.uk'),
  borough('bromley', 'Bromley', 'customer.services@bromley.gov.uk', 'https://www.bromley.gov.uk'),
  borough('camden', 'Camden', 'streetenvironment@camden.gov.uk', 'https://www.camden.gov.uk'),
  borough('city-of-london', 'City of London Corporation', 'cityoflondon@cityoflondon.gov.uk', 'https://www.cityoflondon.gov.uk', 'city_of_london'),
  borough('croydon', 'Croydon', 'customer.services@croydon.gov.uk', 'https://www.croydon.gov.uk'),
  borough('ealing', 'Ealing', 'customer.services@ealing.gov.uk', 'https://www.ealing.gov.uk'),
  borough('enfield', 'Enfield', 'customer.services@enfield.gov.uk', 'https://www.enfield.gov.uk'),
  borough('greenwich', 'Greenwich', 'greenwich-direct@royalgreenwich.gov.uk', 'https://www.royalgreenwich.gov.uk'),
  borough('hackney', 'Hackney', 'customer.services@hackney.gov.uk', 'https://hackney.gov.uk'),
  borough('hammersmith-fulham', 'Hammersmith and Fulham', 'customer.services@lbhf.gov.uk', 'https://www.lbhf.gov.uk'),
  borough('haringey', 'Haringey', 'customer.services@haringey.gov.uk', 'https://www.haringey.gov.uk'),
  borough('harrow', 'Harrow', 'contact@harrow.gov.uk', 'https://www.harrow.gov.uk'),
  borough('havering', 'Havering', 'customer.services@havering.gov.uk', 'https://www.havering.gov.uk'),
  borough('hillingdon', 'Hillingdon', 'customer.services@hillingdon.gov.uk', 'https://www.hillingdon.gov.uk'),
  borough('hounslow', 'Hounslow', 'customer.services@hounslow.gov.uk', 'https://www.hounslow.gov.uk'),
  borough('islington', 'Islington', 'contact@islington.gov.uk', 'https://www.islington.gov.uk'),
  borough('kensington-chelsea', 'Kensington and Chelsea', 'customer.services@rbkc.gov.uk', 'https://www.rbkc.gov.uk'),
  borough('kingston', 'Kingston upon Thames', 'customer.services@kingston.gov.uk', 'https://www.kingston.gov.uk'),
  borough('lambeth', 'Lambeth', 'customer.services@lambeth.gov.uk', 'https://www.lambeth.gov.uk'),
  borough('lewisham', 'Lewisham', 'customer.services@lewisham.gov.uk', 'https://www.lewisham.gov.uk'),
  borough('merton', 'Merton', 'customer.services@merton.gov.uk', 'https://www.merton.gov.uk'),
  borough('newham', 'Newham', 'customer.services@newham.gov.uk', 'https://www.newham.gov.uk'),
  borough('redbridge', 'Redbridge', 'customer.services@redbridge.gov.uk', 'https://www.redbridge.gov.uk'),
  borough('richmond', 'Richmond upon Thames', 'customer.services@richmond.gov.uk', 'https://www.richmond.gov.uk'),
  borough('southwark', 'Southwark', 'environment@southwark.gov.uk', 'https://www.southwark.gov.uk'),
  borough('sutton', 'Sutton', 'customer.services@sutton.gov.uk', 'https://www.sutton.gov.uk'),
  borough('tower-hamlets', 'Tower Hamlets', 'customer.services@towerhamlets.gov.uk', 'https://www.towerhamlets.gov.uk'),
  borough('waltham-forest', 'Waltham Forest', 'customer.services@walthamforest.gov.uk', 'https://www.walthamforest.gov.uk'),
  borough('wandsworth', 'Wandsworth', 'customer.services@wandsworth.gov.uk', 'https://www.wandsworth.gov.uk'),
  borough('westminster', 'Westminster', 'customer.services@westminster.gov.uk', 'https://www.westminster.gov.uk'),

  // === Transport ===
  {
    id: 'tfl',
    name: 'Transport for London',
    type: 'tfl',
    contactEmail: 'streetcare@tfl.gov.uk',
    websiteUrl: 'https://tfl.gov.uk',
    deepLinkUrlTemplate: 'https://streetcare.tfl.gov.uk/report/new?latitude={{lat}}&longitude={{lon}}',
  },

  // === Police ===
  {
    id: 'met-police',
    name: 'Metropolitan Police',
    type: 'met-police',
    websiteUrl: 'https://www.met.police.uk',
    deepLinkUrl: 'https://www.met.police.uk/ro/report/',
  },
  {
    id: 'city-police',
    name: 'City of London Police',
    type: 'city-police',
    websiteUrl: 'https://www.cityoflondon.police.uk',
    deepLinkUrl: 'https://www.cityoflondon.police.uk/ro/report/',
  },

  // === Utilities ===
  {
    id: 'thames-water',
    name: 'Thames Water',
    type: 'thames-water',
    websiteUrl: 'https://www.thameswater.co.uk',
    deepLinkUrl: 'https://www.thameswater.co.uk/help/report-a-problem',
  },
  {
    id: 'ukpn',
    name: 'UK Power Networks',
    type: 'ukpn',
    websiteUrl: 'https://www.ukpowernetworks.co.uk',
    deepLinkUrl: 'https://www.ukpowernetworks.co.uk/power-cut/report-power-cut',
  },
  {
    id: 'cadent-gas',
    name: 'Cadent Gas (National Gas Emergency)',
    type: 'cadent-gas',
    websiteUrl: 'https://www.cadentgas.com',
    deepLinkUrl: 'https://www.cadentgas.com/emergencies/report-an-emergency',
  },
  {
    id: 'openreach',
    name: 'Openreach',
    type: 'openreach',
    websiteUrl: 'https://www.openreach.com',
    deepLinkUrl: 'https://www.openreach.com/help-and-support/report-a-problem',
  },

  // === Waste Contractors ===
  {
    id: 'veolia',
    name: 'Veolia UK',
    type: 'veolia',
    contactEmail: 'info@veolia.co.uk',
    websiteUrl: 'https://www.veolia.co.uk',
    deepLinkUrl: 'https://www.veolia.co.uk/contact-us',
  },
  {
    id: 'biffa',
    name: 'Biffa',
    type: 'biffa',
    contactEmail: 'enquiries@biffa.co.uk',
    websiteUrl: 'https://www.biffa.co.uk',
    deepLinkUrl: 'https://www.biffa.co.uk/contact-us',
  },
  {
    id: 'serco',
    name: 'Serco',
    type: 'serco',
    contactEmail: 'contactus@serco.com',
    websiteUrl: 'https://www.serco.com',
    deepLinkUrl: 'https://www.serco.com/contact',
  },

  // === Private Estates ===
  {
    id: 'crown-estate',
    name: 'The Crown Estate',
    type: 'crown-estate',
    contactEmail: 'enquiries@thecrownestate.co.uk',
    websiteUrl: 'https://www.thecrownestate.co.uk',
    deepLinkUrl: 'https://www.thecrownestate.co.uk/contact-us',
  },
  {
    id: 'grosvenor',
    name: 'Grosvenor',
    type: 'grosvenor',
    contactEmail: 'enquiries@grosvenor.com',
    websiteUrl: 'https://www.grosvenor.com',
    deepLinkUrl: 'https://www.grosvenor.com/contact-us',
  },
  {
    id: 'great-portland-estates',
    name: 'Great Portland Estates',
    type: 'great-portland-estates',
    contactEmail: 'info@gpe.co.uk',
    websiteUrl: 'https://www.gpe.co.uk',
    deepLinkUrl: 'https://www.gpe.co.uk/contact',
  },
  {
    id: 'cadogan',
    name: 'Cadogan Estates',
    type: 'cadogan',
    contactEmail: 'enquiries@cadogan.co.uk',
    websiteUrl: 'https://www.cadogan.co.uk',
    deepLinkUrl: 'https://www.cadogan.co.uk/contact',
  },
  {
    id: 'howard-de-walden',
    name: 'The Howard de Walden Estate',
    type: 'howard-de-walden',
    contactEmail: 'enquiries@hdwe.co.uk',
    websiteUrl: 'https://www.hdwe.co.uk',
    deepLinkUrl: 'https://www.hdwe.co.uk/contact',
  },
  {
    id: 'portman-estate',
    name: 'The Portman Estate',
    type: 'portman-estate',
    contactEmail: 'enquiries@portmanestate.co.uk',
    websiteUrl: 'https://www.portmanestate.co.uk',
    deepLinkUrl: 'https://www.portmanestate.co.uk/contact',
  },
  {
    id: 'shaftesbury-capital',
    name: 'Shaftesbury Capital',
    type: 'shaftesbury-capital',
    contactEmail: 'info@shaftesburycapital.com',
    websiteUrl: 'https://www.shaftesburycapital.com',
    deepLinkUrl: 'https://www.shaftesburycapital.com/contact',
  },
  {
    id: 'british-land',
    name: 'British Land',
    type: 'british-land',
    contactEmail: 'info@britishland.com',
    websiteUrl: 'https://www.britishland.com',
    deepLinkUrl: 'https://www.britishland.com/contact-us',
  },
  {
    id: 'landsec',
    name: 'Landsec',
    type: 'landsec',
    contactEmail: 'enquiries@landsec.com',
    websiteUrl: 'https://landsec.com',
    deepLinkUrl: 'https://landsec.com/contact-us',
  },
  {
    id: 'argent',
    name: 'Argent (King\'s Cross)',
    type: 'argent',
    contactEmail: 'info@argentllp.co.uk',
    websiteUrl: 'https://www.kingscross.co.uk',
    deepLinkUrl: 'https://www.kingscross.co.uk/contact-us',
  },
  {
    id: 'canary-wharf',
    name: 'Canary Wharf Group',
    type: 'canary-wharf',
    contactEmail: 'management@canarywharf.com',
    websiteUrl: 'https://canarywharf.com',
  },

  // === Housing Associations ===
  {
    id: 'peabody',
    name: 'Peabody',
    type: 'peabody',
    contactEmail: 'customerservice@peabody.org.uk',
    websiteUrl: 'https://www.peabody.org.uk',
    deepLinkUrl: 'https://www.peabody.org.uk/contact-us',
  },
  {
    id: 'lq',
    name: 'L&Q',
    type: 'lq',
    contactEmail: 'contactus@lqgroup.org.uk',
    websiteUrl: 'https://www.lqgroup.org.uk',
    deepLinkUrl: 'https://www.lqgroup.org.uk/contact-us',
  },
  {
    id: 'clarion',
    name: 'Clarion Housing Group',
    type: 'clarion',
    contactEmail: 'info@clarionhg.com',
    websiteUrl: 'https://www.clarionhg.com',
    deepLinkUrl: 'https://www.myclarionhousing.com/contact-us',
  },
  {
    id: 'notting-hill-genesis',
    name: 'Notting Hill Genesis',
    type: 'notting-hill-genesis',
    contactEmail: 'contactus@nhg.org.uk',
    websiteUrl: 'https://www.nhg.org.uk',
    deepLinkUrl: 'https://www.nhg.org.uk/contact-us',
  },
  {
    id: 'mtvh',
    name: 'Metropolitan Thames Valley Housing',
    type: 'mtvh',
    contactEmail: 'customer.services@mtvh.co.uk',
    websiteUrl: 'https://www.mtvh.co.uk',
    deepLinkUrl: 'https://www.mtvh.co.uk/contact-us',
  },

  // === Other Agencies ===
  {
    id: 'streetlink',
    name: 'StreetLink',
    type: 'streetlink',
    websiteUrl: 'https://www.streetlink.org.uk',
    deepLinkUrl: 'https://www.streetlink.org.uk/rough-sleeping',
  },
  {
    id: 'rspca',
    name: 'RSPCA',
    type: 'rspca',
    websiteUrl: 'https://www.rspca.org.uk',
    deepLinkUrl: 'https://www.rspca.org.uk/utilities/contactus/reportcruelty',
  },
  {
    id: 'environment-agency',
    name: 'Environment Agency',
    type: 'environment-agency',
    websiteUrl: 'https://www.gov.uk/government/organisations/environment-agency',
    deepLinkUrl: 'https://www.gov.uk/report-an-environmental-incident',
  },
  {
    id: 'port-of-london',
    name: 'Port of London Authority',
    type: 'port-of-london',
    contactEmail: 'info@pla.co.uk',
    websiteUrl: 'https://www.pla.co.uk',
    deepLinkUrl: 'https://www.pla.co.uk/Contact',
  },
  {
    id: 'hse',
    name: 'Health and Safety Executive',
    type: 'hse',
    websiteUrl: 'https://www.hse.gov.uk',
    deepLinkUrl: 'https://www.hse.gov.uk/contact/concerns.htm',
  },
  {
    id: 'national-highways',
    name: 'National Highways',
    type: 'national-highways',
    websiteUrl: 'https://nationalhighways.co.uk',
    deepLinkUrl: 'https://nationalhighways.co.uk/report-an-issue/',
  },

  // === Micromobility Operators ===
  {
    id: 'lime',
    name: 'Lime',
    type: 'lime',
    websiteUrl: 'https://www.li.me',
    deepLinkUrl: 'https://help.li.me/hc/en-us/requests/new',
  },
  {
    id: 'tier',
    name: 'TIER',
    type: 'tier',
    websiteUrl: 'https://www.tier.app',
    deepLinkUrl: 'https://www.tier.app/en/contact',
  },
  {
    id: 'dott',
    name: 'Dott',
    type: 'dott',
    websiteUrl: 'https://ridedott.com',
    deepLinkUrl: 'https://ridedott.com/contact',
  },
  {
    id: 'voi',
    name: 'Voi',
    type: 'voi',
    websiteUrl: 'https://www.voi.com',
    deepLinkUrl: 'https://www.voi.com/contact',
  },

  // === Rail ===
  {
    id: 'network-rail',
    name: 'Network Rail',
    type: 'network-rail',
    contactEmail: 'nationalfacilities@networkrail.co.uk',
    websiteUrl: 'https://www.networkrail.co.uk',
    deepLinkUrl: 'https://www.networkrail.co.uk/communities/contact-us/',
  },
];

export function getAuthorityById(id: string): Authority | undefined {
  return AUTHORITIES.find((a) => a.id === id);
}

export function getBoroughAuthority(boroughId: string): Authority | undefined {
  return AUTHORITIES.find((a) => a.id === boroughId && a.type === 'borough');
}
