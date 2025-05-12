import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { devicesTable } from './devices';

export const eventsTable = sqliteTable("events", {
  id: int().primaryKey({ autoIncrement: true }),
  ts: int({ mode: "timestamp_ms" }).$defaultFn(() => new Date()),
  device: text().notNull().references(() => devicesTable.id)
});
