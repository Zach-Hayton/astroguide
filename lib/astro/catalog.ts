export type Discovery = {
  id: string;
  name: string;
  type: string;
  viewedAt: string;
  saved: boolean;
  note: string;
  observationStatus?: 'none' | 'planned' | 'observed';
  observationDate?: string;
};
const KEY = 'astroguide.guest-catalog.v1';
let account: string | null = null;
let accountRecords: Discovery[] = [];
export const accountName = () => account;
export async function initializeAccount() {
  const response = await fetch('/api/account', { cache: 'no-store' });
  if (!response.ok) throw Error('Could not check your sign-in.');
  const result = (await response.json()) as { username: string | null };
  account = result.username;
  accountRecords = [];
  if (account) {
    const response = await fetch('/api/catalog', { cache: 'no-store' });
    if (!response.ok) throw Error('Could not load your saved catalog.');
    accountRecords = ((await response.json()) as { records: Discovery[] })
      .records;
  }
}
async function accountWrite(input: unknown) {
  const response = await fetch('/api/catalog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const result = (await response.json()) as {
    record: Discovery;
    error?: string;
  };
  if (!response.ok)
    throw Error(result.error || 'Could not save. Please try again.');
  const record = result.record as Discovery;
  accountRecords = [
    record,
    ...accountRecords.filter((r) => r.id !== record.id),
  ];
  window.dispatchEvent(new Event('astroguide-catalog'));
}
export function readCatalog(): Discovery[] {
  if (account) return accountRecords;
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(value)) return [];
    return value
      .filter(
        (v) =>
          v &&
          typeof v.id === 'string' &&
          typeof v.name === 'string' &&
          typeof v.viewedAt === 'string',
      )
      .map((v) => ({
        ...v,
        saved: !!v.saved,
        note: typeof v.note === 'string' ? v.note : '',
        observationStatus: ['planned', 'observed'].includes(v.observationStatus)
          ? v.observationStatus
          : 'none',
        observationDate:
          typeof v.observationDate === 'string' ? v.observationDate : '',
      }));
  } catch {
    return [];
  }
}
export function writeCatalog(items: Discovery[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('astroguide-catalog'));
}
export async function discover(id: string, name: string, type: string) {
  if (account) {
    await accountWrite({ action: 'discover', id, name, type });
    return;
  }
  const all = readCatalog();
  if (!all.some((o) => o.id === id)) {
    writeCatalog([
      {
        id,
        name,
        type,
        viewedAt: new Date().toISOString(),
        saved: false,
        note: '',
      },
      ...all,
    ]);
  }
}
export async function updateDiscovery(
  id: string,
  patch: Partial<
    Pick<Discovery, 'saved' | 'note' | 'observationStatus' | 'observationDate'>
  >,
) {
  if (account) {
    await accountWrite({ action: 'update', id, patch });
    return;
  }
  writeCatalog(
    readCatalog().map((o) => (o.id === id ? { ...o, ...patch } : o)),
  );
}
