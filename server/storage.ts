import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import {
  interviews, interviewQuestions,
  type Interview, type InsertInterview, type UpdateInterviewRequest,
  type InterviewQuestion, type InsertQuestion, type UpdateQuestionRequest
} from "@shared/schema";

export interface IStorage {
  getInterviews(): Promise<Interview[]>;
  getInterview(id: number): Promise<Interview | undefined>;
  createInterview(interview: InsertInterview): Promise<Interview>;
  updateInterview(id: number, updates: UpdateInterviewRequest): Promise<Interview>;
  
  getQuestionsByInterview(interviewId: number): Promise<InterviewQuestion[]>;
  getQuestion(id: number): Promise<InterviewQuestion | undefined>;
  createQuestion(question: InsertQuestion): Promise<InterviewQuestion>;
  updateQuestion(id: number, updates: UpdateQuestionRequest): Promise<InterviewQuestion>;
}

export class DatabaseStorage implements IStorage {
  async getInterviews(): Promise<Interview[]> {
    return await db.select().from(interviews).orderBy(desc(interviews.createdAt));
  }

  async getInterview(id: number): Promise<Interview | undefined> {
    const [interview] = await db.select().from(interviews).where(eq(interviews.id, id));
    return interview;
  }

  async createInterview(interview: InsertInterview): Promise<Interview> {
    const [newInterview] = await db.insert(interviews).values(interview).returning();
    return newInterview;
  }

  async updateInterview(id: number, updates: UpdateInterviewRequest): Promise<Interview> {
    const [updated] = await db.update(interviews).set(updates).where(eq(interviews.id, id)).returning();
    return updated;
  }

  async getQuestionsByInterview(interviewId: number): Promise<InterviewQuestion[]> {
    return await db.select().from(interviewQuestions).where(eq(interviewQuestions.interviewId, interviewId));
  }

  async getQuestion(id: number): Promise<InterviewQuestion | undefined> {
    const [question] = await db.select().from(interviewQuestions).where(eq(interviewQuestions.id, id));
    return question;
  }

  async createQuestion(question: InsertQuestion): Promise<InterviewQuestion> {
    const [newQuestion] = await db.insert(interviewQuestions).values(question).returning();
    return newQuestion;
  }

  async updateQuestion(id: number, updates: UpdateQuestionRequest): Promise<InterviewQuestion> {
    const [updated] = await db.update(interviewQuestions).set(updates).where(eq(interviewQuestions.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
