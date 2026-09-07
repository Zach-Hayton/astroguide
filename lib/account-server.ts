import { env } from 'cloudflare:workers';
const bindings = () =>
  env as unknown as { DB: D1Database; DEMO_PASSWORD_HASHES?: string };
export const db = () => bindings().DB;
const hex = (b: ArrayBuffer) =>
  Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join(
    '',
  );
export async function digest(s: string) {
  return hex(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)),
  );
}
export async function passwordMatches(username: string, password: string) {
  const users = JSON.parse(bindings().DEMO_PASSWORD_HASHES || '{}') as Record<
    string,
    { salt: string; hash: string }
  >;
  const entry = users[username] ?? users.user1;
  if (!entry) throw Error('Account setup is unavailable.');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const salt = Uint8Array.from(entry.salt.match(/../g)!, (x) =>
    parseInt(x, 16),
  );
  const actual = hex(
    await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      key,
      256,
    ),
  );
  let diff = actual.length ^ entry.hash.length;
  for (let i = 0; i < actual.length; i++)
    diff |= actual.charCodeAt(i) ^ entry.hash.charCodeAt(i);
  return (
    diff === 0 &&
    (username === 'user1' || username === 'user2') &&
    !!users[username]
  );
}
export function sameOrigin(request: Request) {
  return request.headers.get('origin') === new URL(request.url).origin;
}
export function sessionCookie(request: Request, token: string, age: number) {
  return `astroguide_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
}
export function cookieToken(request: Request) {
  return (
    request.headers
      .get('cookie')
      ?.split(';')
      .map((s) => s.trim())
      .find((s) => s.startsWith('astroguide_session='))
      ?.slice(19) ?? ''
  );
}
export async function currentUser(request: Request) {
  const token = cookieToken(request);
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const row = await db()
    .prepare(
      'SELECT username FROM demo_sessions WHERE token_hash = ? AND expires > ?',
    )
    .bind(await digest(token), Date.now())
    .first<{ username: string }>();
  return row?.username ?? null;
}
export function json(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  });
}
