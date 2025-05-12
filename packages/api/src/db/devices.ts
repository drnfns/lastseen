import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const devicesTable = sqliteTable("devices", {
  id: text().primaryKey(),
  name: text().notNull(),
});
