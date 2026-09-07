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
export function readCatalog(): Discovery[] {
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
export function discover(id: string, name: string, type: string) {
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
export function updateDiscovery(
  id: string,
  patch: Partial<
    Pick<Discovery, 'saved' | 'note' | 'observationStatus' | 'observationDate'>
  >,
) {
  writeCatalog(
    readCatalog().map((o) => (o.id === id ? { ...o, ...patch } : o)),
  );
}
