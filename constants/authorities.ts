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

  // === Non-borough authorities ===
  {
    id: 'tfl',
    name: 'Transport for London',
    type: 'tfl',
    contactEmail: 'streetcare@tfl.gov.uk',
    websiteUrl: 'https://tfl.gov.uk',
    deepLinkUrlTemplate: 'https://streetcare.tfl.gov.uk/report/new?latitude={{lat}}&longitude={{lon}}',
  },
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
  {
    id: 'canary-wharf',
    name: 'Canary Wharf Group',
    type: 'canary-wharf',
    contactEmail: 'management@canarywharf.com',
    websiteUrl: 'https://canarywharf.com',
  },
  {
    id: 'thames-water',
    name: 'Thames Water',
    type: 'thames-water',
    websiteUrl: 'https://www.thameswater.co.uk',
    deepLinkUrl: 'https://www.thameswater.co.uk/help/report-a-problem',
  },
  {
    id: 'streetlink',
    name: 'StreetLink',
    type: 'streetlink',
    websiteUrl: 'https://www.streetlink.org.uk',
    deepLinkUrl: 'https://www.streetlink.org.uk/rough-sleeping',
  },
  {
    id: 'lime',
    name: 'Lime',
    type: 'lime',
    websiteUrl: 'https://www.li.me',
    deepLinkUrl: 'https://help.li.me/hc/en-us/requests/new',
  },
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
