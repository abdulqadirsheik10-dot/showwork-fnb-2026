import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  created: integer("created").notNull(),
  expires: integer("expires").notNull(),
});
export const attempts = sqliteTable("attempts", {
  id: text("id").primaryKey(),
  owner: text("owner").notNull(),
  task: text("task").notNull(),
  response: text("response").notNull(),
  feedback: text("feedback").notNull(),
  created: integer("created").notNull(),
});
export const shares = sqliteTable("shares", {
  token: text("token").primaryKey(),
  owner: text("owner").notNull(),
  task: text("task").notNull(),
  created: integer("created").notNull(),
  revoked: integer("revoked").notNull().default(0),
});
export const limits = sqliteTable("limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  expires: integer("expires").notNull(),
});
