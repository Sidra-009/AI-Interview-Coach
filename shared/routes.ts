import { z } from 'zod';
import { insertInterviewSchema, insertQuestionSchema, interviews, interviewQuestions } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  interviews: {
    list: {
      method: 'GET' as const,
      path: '/api/interviews' as const,
      responses: {
        200: z.array(z.custom<typeof interviews.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/interviews/:id' as const,
      responses: {
        200: z.custom<typeof interviews.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/interviews' as const,
      input: insertInterviewSchema,
      responses: {
        201: z.custom<typeof interviews.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    generateQuestions: {
      method: 'POST' as const,
      path: '/api/interviews/:id/generate-questions' as const,
      input: z.object({
        count: z.number().optional()
      }),
      responses: {
        201: z.array(z.custom<typeof interviewQuestions.$inferSelect>()),
        404: errorSchemas.notFound,
      }
    },
    questions: {
      list: {
        method: 'GET' as const,
        path: '/api/interviews/:id/questions' as const,
        responses: {
          200: z.array(z.custom<typeof interviewQuestions.$inferSelect>()),
        },
      },
      evaluate: {
        method: 'POST' as const,
        path: '/api/questions/:questionId/evaluate' as const,
        input: z.object({
          answerTranscript: z.string(),
        }),
        responses: {
          200: z.custom<typeof interviewQuestions.$inferSelect>(),
          404: errorSchemas.notFound,
        }
      }
    },
    voiceMessage: {
      method: 'POST' as const,
      path: '/api/interviews/:id/messages' as const,
      input: z.object({
        audio: z.string(),
        voice: z.string().optional()
      }),
      responses: {
        200: z.any(), // Streams SSE
      }
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
