import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { pinoLogger } from 'hono-pino';
import * as v from 'valibot';
import { createId as cuid2 } from '@paralleldrive/cuid2';

const app = new Hono<{ Bindings: Env; }>();
app.use(pinoLogger());
app.use('*', async (c, next) => cors({
  origin: c.env.CORS_ORIGIN,
  credentials: true
})(c, next));

app.onError((err, c) => {
  console.error(err);
  return c.json({ success: false }, 500);
});

// returns the token from an `Authorization: Bearer <token>` header
const bearer = (header: string | undefined) => {
  const [scheme, token] = header?.split(' ') ?? [];
  return scheme === 'Bearer' && token ? token : undefined;
};

app.get('/stats', async (c) => {
  const count = await c.env.DB
    .prepare('SELECT COUNT(*) AS n FROM events')
    .first<{ n: number; }>();

  return c.json({
    total_events: count?.n ?? 0,
    longest_absence: await c.env.KV.get('longest_absence'),
    last_seen: await c.env.KV.get('last_seen')
  }, 200, { 'Cache-Control': 'max-age=15, stale-while-revalidate=59' });
});

const RegisterSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty()),
});

// admin only: creates a device and returns its token
app.post('/register-device', async (c) => {
  const auth = bearer(c.req.header('Authorization'));
  if (!c.env.TOKEN || auth !== c.env.TOKEN) return c.json({ success: false }, 403);

  let form: v.InferOutput<typeof RegisterSchema>;
  try {
    form = v.parse(RegisterSchema, await c.req.json());
  } catch (e) {
    return c.json({ success: false, error: (e as Error).toString() }, 400);
  }

  const token = cuid2();
  await c.env.DB
    .prepare('INSERT INTO devices (name, token) VALUES (?, ?)')
    .bind(form.name, token)
    .run();

  return c.json({ success: true, token });
});

// any registered device: records a heartbeat
app.post('/ping', async (c) => {
  const token = bearer(c.req.header('Authorization'));
  if (!token) return c.json({ success: false }, 403);

  const device = await c.env.DB
    .prepare('SELECT id FROM devices WHERE token = ?')
    .bind(token)
    .first<{ id: number; }>();
  if (!device) return c.json({ success: false }, 403);

  // read the previous heartbeat and insert the new one in one transaction,
  // so the gap is always measured against the event right before this one
  const now = Date.now();
  const [prev] = await c.env.DB.batch<{ ts: number; }>([
    c.env.DB.prepare('SELECT ts FROM events ORDER BY id DESC LIMIT 1'),
    c.env.DB.prepare('INSERT INTO events (ts, device) VALUES (?, ?)').bind(now, device.id),
  ]);

  await c.env.KV.put('last_seen', new Date(now).toISOString());

  const prevTs = prev?.results[0]?.ts;
  if (prevTs !== undefined) {
    const gap = Math.round((now - prevTs) / 1000);
    const longest = Number(await c.env.KV.get('longest_absence') ?? 0);
    if (gap > longest) await c.env.KV.put('longest_absence', gap.toString());
  }

  return c.json({ success: true });
});

export default app;
