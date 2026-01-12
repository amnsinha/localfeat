import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const dailyQuestionResponses = pgTable("daily_question_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  response: text("response").notNull(),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  location: text("location").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDailyQuestionResponseSchema = createInsertSchema(dailyQuestionResponses).omit({
  id: true,
  createdAt: true,
});

export type DailyQuestionResponse = typeof dailyQuestionResponses.$inferSelect;
export type InsertDailyQuestionResponse = typeof dailyQuestionResponses.$inferInsert;