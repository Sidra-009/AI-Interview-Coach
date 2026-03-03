import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api, buildUrl } from "@shared/routes";
import {
  type InterviewResponse,
  type InterviewsListResponse,
  type CreateInterviewRequest,
  type GenerateQuestionsRequest,
  type QuestionResponse,
  type QuestionsListResponse,
  type EvaluateAnswerRequest,
  type UpdateInterviewRequest
} from "@shared/schema";

// Zod error logging helper
function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useInterviews() {
  return useQuery({
    queryKey: [api.interviews.list.path],
    queryFn: async () => {
      const res = await fetch(api.interviews.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch interviews");
      const data = await res.json();
      return parseWithLogging(api.interviews.list.responses[200], data, "interviews.list");
    },
  });
}

export function useInterview(id: number) {
  return useQuery({
    queryKey: [api.interviews.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.interviews.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch interview");
      const data = await res.json();
      return parseWithLogging(api.interviews.get.responses[200], data, "interviews.get");
    },
    enabled: !!id,
  });
}

export function useCreateInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateInterviewRequest) => {
      const validated = api.interviews.create.input.parse(data);
      const res = await fetch(api.interviews.create.path, {
        method: api.interviews.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create interview");
      const json = await res.json();
      return parseWithLogging(api.interviews.create.responses[201], json, "interviews.create");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.interviews.list.path] });
    },
  });
}

export function useGenerateQuestions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, count = 5 }: { id: number; count?: number }) => {
      const url = buildUrl(api.interviews.generateQuestions.path, { id });
      const res = await fetch(url, {
        method: api.interviews.generateQuestions.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate questions");
      const json = await res.json();
      return parseWithLogging(api.interviews.generateQuestions.responses[201], json, "interviews.generateQuestions");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.interviews.questions.list.path, variables.id] });
    },
  });
}

export function useQuestions(interviewId: number) {
  return useQuery({
    queryKey: [api.interviews.questions.list.path, interviewId],
    queryFn: async () => {
      if (!interviewId) return [];
      const url = buildUrl(api.interviews.questions.list.path, { id: interviewId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch questions");
      const data = await res.json();
      return parseWithLogging(api.interviews.questions.list.responses[200], data, "questions.list");
    },
    enabled: !!interviewId,
  });
}

export function useEvaluateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ questionId, answerTranscript }: EvaluateAnswerRequest) => {
      const url = buildUrl(api.interviews.questions.evaluate.path, { questionId });
      const res = await fetch(url, {
        method: api.interviews.questions.evaluate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answerTranscript }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to evaluate answer");
      const json = await res.json();
      return parseWithLogging(api.interviews.questions.evaluate.responses[200], json, "questions.evaluate");
    },
    onSuccess: (data) => {
      // Invalidate the questions list for the related interview
      queryClient.invalidateQueries({ queryKey: [api.interviews.questions.list.path, data.interviewId] });
    },
  });
}
