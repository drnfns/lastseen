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
  c.set("drizzle", drizzle(c.env.DB));
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
  name: v.string(),
});

app.post('/register-device', async (c) => {
  const authorization = c.req.header('Authorization');
  if (authorization !== c.env.TOKEN) return c.json({ success: false }, 403);

  const form = v.safeParse(RegisterSchema, await c.req.json());
  if (!form.success) return c.json({ success: false, issues: form.issues }, 400);

  const token = cuid2();
  const result = await c.var.drizzle.insert(schema.devicesTable).values({
    id: token,
    name: form.output.name,
  });
  if (!result.success) return c.json({ success: false, issues: result.error }, 500);

  return c.json({
    success: true,
    token: token
  });
});

export default app;
