import type { Express } from "express";
import type { Server } from "http";
import express from "express";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { openai, speechToText, ensureCompatibleFormat } from "./replit_integrations/audio/client";

const audioBodyParser = express.json({ limit: "50mb" });

async function seedDatabase() {
  const existing = await storage.getInterviews();
  if (existing.length === 0) {
    const interview = await storage.createInterview({
      jobTitle: "Senior React Developer",
      jobDescription: "We are looking for a senior React developer with deep expertise in hooks, state management, and modern web APIs."
    });
    
    await storage.createQuestion({
      interviewId: interview.id,
      question: "Can you explain the difference between useMemo and useCallback, and when you would use each?",
    });
    
    await storage.createQuestion({
      interviewId: interview.id,
      question: "How do you handle complex state management in a large React application?",
    });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Seed db initially
  seedDatabase().catch(console.error);

  app.get(api.interviews.list.path, async (req, res) => {
    const items = await storage.getInterviews();
    res.json(items);
  });

  app.get(api.interviews.get.path, async (req, res) => {
    const item = await storage.getInterview(Number(req.params.id));
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  });

  app.post(api.interviews.create.path, async (req, res) => {
    try {
      const input = api.interviews.create.input.parse(req.body);
      const item = await storage.createInterview(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.post(api.interviews.generateQuestions.path, async (req, res) => {
    const interviewId = Number(req.params.id);
    const interview = await storage.getInterview(interviewId);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: "You are an expert technical interviewer. Generate 3 specific interview questions based on the job title and description. Output JSON exactly like: { \"questions\": [\"q1\", \"q2\", \"q3\"] }" },
          { role: "user", content: `Job Title: ${interview.jobTitle}\nJob Description: ${interview.jobDescription}` }
        ],
        response_format: { type: "json_object" }
      });
      
      const parsed = JSON.parse(response.choices[0].message?.content || '{"questions":[]}');
      const generatedQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];

      const createdQuestions = [];
      for (const q of generatedQuestions) {
        const newQ = await storage.createQuestion({ interviewId, question: q });
        createdQuestions.push(newQ);
      }
      
      await storage.updateInterview(interviewId, { status: "interviewing" });

      res.status(201).json(createdQuestions);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to generate questions" });
    }
  });

  app.get(api.interviews.questions.list.path, async (req, res) => {
    const items = await storage.getQuestionsByInterview(Number(req.params.id));
    res.json(items);
  });

  app.post(api.interviews.questions.evaluate.path, async (req, res) => {
    const questionId = Number(req.params.questionId);
    const question = await storage.getQuestion(questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const answerTranscript = req.body.answerTranscript;
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: "You are an expert technical interviewer. Evaluate the candidate's answer to the question. Output JSON exactly like: { \"feedback\": \"detailed constructive feedback\", \"score\": 8 } where score is out of 10." },
          { role: "user", content: `Question: ${question.question}\nAnswer: ${answerTranscript}` }
        ],
        response_format: { type: "json_object" }
      });

      const parsed = JSON.parse(response.choices[0].message?.content || '{"feedback":"No feedback", "score":0}');

      const updated = await storage.updateQuestion(questionId, {
        answerTranscript,
        feedback: parsed.feedback,
        score: parsed.score,
        status: "answered"
      });

      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to evaluate answer" });
    }
  });

  // Voice message stream endpoint matching the AI Integration audio module pattern
  app.post(api.interviews.voiceMessage.path, audioBodyParser, async (req, res) => {
    const interviewId = Number(req.params.id);
    const { audio, voice = "alloy" } = req.body;
    
    if (!audio) return res.status(400).json({ message: "Audio data (base64) required" });

    try {
      const rawBuffer = Buffer.from(audio, "base64");
      const { buffer: audioBuffer, format: inputFormat } = await ensureCompatibleFormat(rawBuffer);

      // Transcribe user audio
      const userTranscript = await speechToText(audioBuffer, inputFormat);
      
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      res.write(`data: ${JSON.stringify({ type: "user_transcript", data: userTranscript })}\n\n`);

      // Provide AI response audio stream using voiceChatStream logic
      const stream = await openai.chat.completions.create({
        model: "gpt-audio",
        modalities: ["text", "audio"],
        audio: { voice: voice as any, format: "pcm16" },
        messages: [
          { role: "system", content: "You are a professional technical interviewer. Please briefly acknowledge and respond to the candidate's answer like you would in a real interview, be conversational." },
          { role: "user", content: userTranscript }
        ],
        stream: true,
      });

      let assistantTranscript = "";

      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta as any;
        if (!delta) continue;

        if (delta?.audio?.transcript) {
          assistantTranscript += delta.audio.transcript;
          res.write(`data: ${JSON.stringify({ type: "transcript", data: delta.audio.transcript })}\n\n`);
        }

        if (delta?.audio?.data) {
          res.write(`data: ${JSON.stringify({ type: "audio", data: delta.audio.data })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ type: "done", transcript: assistantTranscript })}\n\n`);
      res.end();
      
    } catch (err) {
      console.error("Voice processing error", err);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: "error", error: "Failed to process voice" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: "Failed to process voice" });
      }
    }
  });

  return httpServer;
}
