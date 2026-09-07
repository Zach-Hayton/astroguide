import { db, currentUser, sameOrigin, json } from '@/lib/account-server';
import type { Discovery } from '@/lib/astro/catalog';
export async function GET(request: Request) {
  const user = await currentUser(request);
  if (!user) return json({ error: 'Sign in to open this catalog.' }, 401);
  const rows = await db()
    .prepare(
      'SELECT record FROM account_catalog WHERE username = ? ORDER BY rowid DESC',
    )
    .bind(user)
    .all<{ record: string }>();
  return json({ records: rows.results.map((r) => JSON.parse(r.record)) });
}
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return json({ error: 'Request origin was rejected.' }, 403);
  const user = await currentUser(request);
  if (!user)
    return json({ error: 'Your session expired. Sign in again.' }, 401);
  const raw = await request.text();
  if (raw.length > 12000) return json({ error: 'Record is too large.' }, 413);
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return json({ error: 'Invalid record.' }, 400);
  }
  if (
    !input ||
    typeof input.id !== 'string' ||
    input.id.length > 100 ||
    !input.id
  )
    return json({ error: 'Invalid object.' }, 400);
  const old = await db()
    .prepare('SELECT record FROM account_catalog WHERE username = ? AND id = ?')
    .bind(user, input.id)
    .first<{ record: string }>();
  if (input.action === 'discover') {
    if (old) return json({ record: JSON.parse(old.record) });
    if (
      typeof input.name !== 'string' ||
      input.name.length > 200 ||
      typeof input.type !== 'string' ||
      input.type.length > 50
    )
      return json({ error: 'Invalid object details.' }, 400);
    const record: Discovery = {
      id: input.id,
      name: input.name,
      type: input.type,
      viewedAt: new Date().toISOString(),
      saved: false,
      note: '',
      observationStatus: 'none',
      observationDate: '',
    };
    await db()
      .prepare(
        'INSERT OR IGNORE INTO account_catalog (username,id,record) VALUES (?,?,?)',
      )
      .bind(user, input.id, JSON.stringify(record))
      .run();
    const stored = await db()
      .prepare(
        'SELECT record FROM account_catalog WHERE username = ? AND id = ?',
      )
      .bind(user, input.id)
      .first<{ record: string }>();
    return json({ record: JSON.parse(stored!.record) });
  }
  if (!old) return json({ error: 'Discovery not found.' }, 404);
  const patch = input.patch;
  if (!patch || typeof patch !== 'object')
    return json({ error: 'Invalid changes.' }, 400);
  const record = JSON.parse(old.record) as Discovery;
  if ('saved' in patch) {
    if (typeof patch.saved !== 'boolean')
      return json({ error: 'Invalid bookmark.' }, 400);
    record.saved = patch.saved;
  }
  if ('note' in patch) {
    if (typeof patch.note !== 'string' || patch.note.length > 4000)
      return json({ error: 'Notes must be under 4,000 characters.' }, 400);
    record.note = patch.note;
  }
  if ('observationStatus' in patch) {
    if (!['none', 'planned', 'observed'].includes(patch.observationStatus))
      return json({ error: 'Invalid observation status.' }, 400);
    record.observationStatus = patch.observationStatus;
  }
  if ('observationDate' in patch) {
    if (
      typeof patch.observationDate !== 'string' ||
      (patch.observationDate !== '' &&
        !/^\d{4}-\d{2}-\d{2}$/.test(patch.observationDate))
    )
      return json({ error: 'Invalid date.' }, 400);
    record.observationDate = patch.observationDate;
  }
  await db()
    .prepare(
      'UPDATE account_catalog SET record = ? WHERE username = ? AND id = ?',
    )
    .bind(JSON.stringify(record), user, input.id)
    .run();
  return json({ record });
}
