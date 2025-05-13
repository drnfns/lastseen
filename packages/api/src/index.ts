import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { pinoLogger } from 'hono-pino';
import * as v from 'valibot';
import { createId as cuid2 } from '@paralleldrive/cuid2';
import * as schema from './db/schema';

type Variables = {
  drizzle: DrizzleD1Database<typeof schema>;
};

const app = new Hono<{ Bindings: Env; Variables: Variables; }>();
app.use(pinoLogger());
app.use((c, next) => {
  c.set("drizzle", drizzle<typeof schema>(c.env.DB, { schema }));
  return next();
});
app.use('*', async (c, next) => cors({
  origin: c.env.CORS_ORIGIN,
  credentials: true
})(c, next));

app.get('/stats', async (c) => c.json({
  total_events: await c.var.drizzle.$count(schema.eventsTable),
  longest_absence: await c.env.KV.get("longest_absence"),
  last_seen: await c.env.KV.get("last_seen")
}));

const RegisterSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty()),
});

app.post('/register-device', async (c) => {
  const authorization = c.req.header('Authorization')?.split(' ')?.at(1);
  if (authorization !== c.env.TOKEN) return c.json({ success: false }, 403);

  const form = v.safeParse(RegisterSchema, await c.req.json());
  if (!form.success) return c.json({ success: false, issues: form.issues }, 400);

  const token = cuid2();
  const result = await c.var.drizzle.insert(schema.devicesTable).values({
    token,
    name: form.output.name,
  });
  if (!result.success) return c.json({ success: false, issues: result.error }, 500);

  return c.json({
    success: true,
    token: token
  });
});

app.get('/ping', async (c) => {
  const authorization = c.req.header('Authorization')?.split(' ')?.at(1);
  if (!authorization || !authorization.length) return c.json({ successs: false }, 403);

  const device = await c.var.drizzle.query.devicesTable.findFirst({
    where: (tb, { eq }) => eq(tb.token, authorization)
  });
  if (!device) return c.json({ success: false }, 403);

  const ts = new Date();
  const result = await c.var.drizzle.insert(schema.eventsTable).values({
    device: device.id,
    ts,
  });
  if (!result.success) return c.json({ success: false, issues: result.error }, 500);

  await c.env.KV.put("last_seen", ts.toISOString());
  const last = await c.var.drizzle.query.eventsTable.findFirst({
    orderBy: (tb, { desc }) => desc(tb.id)
  });
  if (!last) {
    await c.env.KV.put("longest_absence", "0");
  } else {
    await c.env.KV.put("longest_absence", Math.round((last.ts.getTime() - ts.getTime()) / 1000).toString());
  }

  return c.json({
    success: true,
  });
});

export default app;
