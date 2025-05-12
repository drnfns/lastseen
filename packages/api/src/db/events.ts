import { int, sqliteTable } from 'drizzle-orm/sqlite-core';
import { devicesTable } from './devices';

export const eventsTable = sqliteTable("events", {
  id: int().primaryKey({ autoIncrement: true }),
  ts: int({ mode: "timestamp_ms" }).notNull(),
  device: int().notNull().references(() => devicesTable.id)
});
