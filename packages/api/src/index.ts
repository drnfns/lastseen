import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { pinoLogger } from 'hono-pino';
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

export default app;
