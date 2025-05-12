import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const devicesTable = sqliteTable("devices", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  token: text().unique().notNull()
});
