import { drizzle } from 'drizzle-orm/d1';
import { Hono } from 'hono';
import { pinoLogger } from 'hono-pino';

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
};

type Variables = {
  drizzle: unknown;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables; }>();
app.use(pinoLogger());
app.use((c, next) => {
  c.set("drizzle", drizzle(c.env.DB));
  return next();
});

app.get('/', (c) => c.text("it works!"));

export default app;
