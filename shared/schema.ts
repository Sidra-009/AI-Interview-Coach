import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const interviews = pgTable("interviews", {
  id: serial("id").primaryKey(),
  jobTitle: text("job_title").notNull(),
  jobDescription: text("job_description").notNull(),
  status: text("status").notNull().default("setup"), // setup, interviewing, completed
  createdAt: timestamp("created_at").defaultNow(),
});

export const interviewQuestions = pgTable("interview_questions", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id").notNull(),
  question: text("question").notNull(),
  answerTranscript: text("answer_transcript"),
  feedback: text("feedback"),
  score: integer("score"), // 1-10
  status: text("status").notNull().default("pending"), // pending, answered
});

export const insertInterviewSchema = createInsertSchema(interviews).omit({ id: true, createdAt: true, status: true });
export const insertQuestionSchema = createInsertSchema(interviewQuestions).omit({ id: true, answerTranscript: true, feedback: true, score: true, status: true });

// Base types
export type Interview = typeof interviews.$inferSelect;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type InterviewQuestion = typeof interviewQuestions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

// Request types
export type CreateInterviewRequest = InsertInterview;
export type UpdateInterviewRequest = Partial<InsertInterview> & { status?: string };
export type CreateQuestionRequest = InsertQuestion;
export type UpdateQuestionRequest = Partial<InsertQuestion> & {
  answerTranscript?: string;
  feedback?: string;
  score?: number;
  status?: string;
};
export type GenerateQuestionsRequest = { jobTitle: string; jobDescription: string; count?: number };
export type EvaluateAnswerRequest = { questionId: number; answerTranscript: string };

// Response types
export type InterviewResponse = Interview;
export type QuestionResponse = InterviewQuestion;
export type InterviewsListResponse = Interview[];
export type QuestionsListResponse = InterviewQuestion[];


