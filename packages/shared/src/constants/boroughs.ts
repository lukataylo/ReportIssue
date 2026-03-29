import { BoroughInfo } from '../types';

export const LONDON_BOROUGHS: BoroughInfo[] = [
  { id: 'barking-dagenham', name: 'Barking and Dagenham', gssCode: 'E09000002' },
  { id: 'barnet', name: 'Barnet', gssCode: 'E09000003' },
  { id: 'bexley', name: 'Bexley', gssCode: 'E09000004' },
  { id: 'brent', name: 'Brent', gssCode: 'E09000005' },
  { id: 'bromley', name: 'Bromley', gssCode: 'E09000006' },
  { id: 'camden', name: 'Camden', gssCode: 'E09000007' },
  { id: 'city-of-london', name: 'City of London', gssCode: 'E09000001' },
  { id: 'croydon', name: 'Croydon', gssCode: 'E09000008' },
  { id: 'ealing', name: 'Ealing', gssCode: 'E09000009' },
  { id: 'enfield', name: 'Enfield', gssCode: 'E09000010' },
  { id: 'greenwich', name: 'Greenwich', gssCode: 'E09000011' },
  { id: 'hackney', name: 'Hackney', gssCode: 'E09000012' },
  { id: 'hammersmith-fulham', name: 'Hammersmith and Fulham', gssCode: 'E09000013' },
  { id: 'haringey', name: 'Haringey', gssCode: 'E09000014' },
  { id: 'harrow', name: 'Harrow', gssCode: 'E09000015' },
  { id: 'havering', name: 'Havering', gssCode: 'E09000016' },
  { id: 'hillingdon', name: 'Hillingdon', gssCode: 'E09000017' },
  { id: 'hounslow', name: 'Hounslow', gssCode: 'E09000018' },
  { id: 'islington', name: 'Islington', gssCode: 'E09000019' },
  { id: 'kensington-chelsea', name: 'Kensington and Chelsea', gssCode: 'E09000020' },
  { id: 'kingston', name: 'Kingston upon Thames', gssCode: 'E09000021' },
  { id: 'lambeth', name: 'Lambeth', gssCode: 'E09000022' },
  { id: 'lewisham', name: 'Lewisham', gssCode: 'E09000023' },
  { id: 'merton', name: 'Merton', gssCode: 'E09000024' },
  { id: 'newham', name: 'Newham', gssCode: 'E09000025' },
  { id: 'redbridge', name: 'Redbridge', gssCode: 'E09000026' },
  { id: 'richmond', name: 'Richmond upon Thames', gssCode: 'E09000027' },
  { id: 'southwark', name: 'Southwark', gssCode: 'E09000028' },
  { id: 'sutton', name: 'Sutton', gssCode: 'E09000029' },
  { id: 'tower-hamlets', name: 'Tower Hamlets', gssCode: 'E09000030' },
  { id: 'waltham-forest', name: 'Waltham Forest', gssCode: 'E09000031' },
  { id: 'wandsworth', name: 'Wandsworth', gssCode: 'E09000032' },
  { id: 'westminster', name: 'Westminster', gssCode: 'E09000033' },
];

export function findBoroughByName(name: string): BoroughInfo | undefined {
  const lower = name.toLowerCase();
  return LONDON_BOROUGHS.find(
    (b) =>
      b.name.toLowerCase() === lower ||
      b.name.toLowerCase().includes(lower) ||
      lower.includes(b.name.toLowerCase())
  );
}

export function findBoroughById(id: string): BoroughInfo | undefined {
  return LONDON_BOROUGHS.find((b) => b.id === id);
}
