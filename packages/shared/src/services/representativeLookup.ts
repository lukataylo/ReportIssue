import { Representative } from '../types';

// UK Parliament Members API — free, no key required
const PARLIAMENT_API = 'https://members-api.parliament.uk/api';

export async function lookupMP(postcode: string): Promise<Representative | null> {
  try {
    // Step 1: Find constituency from postcode
    const searchRes = await fetch(
      `${PARLIAMENT_API}/Location/Constituency/Search?searchText=${encodeURIComponent(postcode)}&skip=0&take=1`
    );
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    const constituency = searchData?.items?.[0]?.value?.name;
    if (!constituency) return null;

    // Step 2: Find current MP for that constituency
    const memberRes = await fetch(
      `${PARLIAMENT_API}/Members/Search?House=1&IsCurrentMember=true&skip=0&take=1&ConstituencyName=${encodeURIComponent(constituency)}`
    );
    if (!memberRes.ok) return null;

    const memberData = await memberRes.json();
    const member = memberData?.items?.[0]?.value;
    if (!member) return null;

    // Step 3: Get contact details
    let email: string | undefined;
    try {
      const contactRes = await fetch(
        `${PARLIAMENT_API}/Members/${member.id}/Contact`
      );
      if (contactRes.ok) {
        const contactData = await contactRes.json();
        const contacts = contactData?.value;
        if (Array.isArray(contacts)) {
          const parliamentary = contacts.find(
            (c: { type: string; email?: string }) => c.type === 'Parliamentary'
          );
          email = parliamentary?.email;
          if (!email) {
            const any = contacts.find(
              (c: { email?: string }) => c.email
            );
            email = any?.email;
          }
        }
      }
    } catch {
      // Contact lookup is best-effort
    }

    return {
      name: member.nameDisplayAs || member.nameFullTitle,
      role: 'MP',
      email,
      party: member.latestParty?.name,
      constituency,
    };
  } catch {
    return null;
  }
}

export function getWriteToThemUrl(postcode: string): string {
  return `https://www.writetothem.com/?pc=${encodeURIComponent(postcode)}`;
}
