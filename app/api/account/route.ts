import {
  db,
  digest,
  currentUser,
  passwordMatches,
  sameOrigin,
  sessionCookie,
  cookieToken,
  json,
} from '@/lib/account-server';
export async function GET(request: Request) {
  return json({ username: await currentUser(request) });
}
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return json({ error: 'Request origin was rejected.' }, 403);
  const text = await request.text();
  if (text.length > 1024) return json({ error: 'Request is too large.' }, 413);
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }
  const username =
    typeof body?.username === 'string'
      ? body.username.trim().toLowerCase()
      : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (username.length > 50 || password.length > 200)
    return json({ error: 'Invalid username or password.' }, 400);
  const now = Date.now(),
    bucket = Math.floor(now / 900000),
    ip = request.headers.get('cf-connecting-ip') ?? 'local';
  const key = await digest(ip + ':' + bucket);
  const attempt = await db()
    .prepare(
      'INSERT INTO login_attempts (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count',
    )
    .bind(key, now + 900000)
    .first<{ count: number }>();
  if ((attempt?.count ?? 100) > 20)
    return json({ error: 'Too many attempts. Try again in 15 minutes.' }, 429);
  if (!(await passwordMatches(username, password)))
    return json({ error: 'Invalid username or password.' }, 401);
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
  const previous = cookieToken(request);
  await db().batch([
    db()
      .prepare('DELETE FROM demo_sessions WHERE expires < ? OR token_hash = ?')
      .bind(now, await digest(previous)),
    db().prepare('DELETE FROM login_attempts WHERE expires < ?').bind(now),
    db()
      .prepare(
        'INSERT INTO demo_sessions (token_hash,username,expires) VALUES (?,?,?)',
      )
      .bind(await digest(token), username, now + 604800000),
  ]);
  return json({ username }, 200, {
    'Set-Cookie': sessionCookie(request, token, 604800),
  });
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request))
    return json({ error: 'Request origin was rejected.' }, 403);
  await db()
    .prepare('DELETE FROM demo_sessions WHERE token_hash = ?')
    .bind(await digest(cookieToken(request)))
    .run();
  return json({ ok: true }, 200, {
    'Set-Cookie': sessionCookie(request, '', 0),
  });
}
