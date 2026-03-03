import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { useInterview, useGenerateQuestions, useQuestions } from "@/hooks/use-interviews";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BrainCircuit, PlayCircle, Loader2, CheckCircle2, ListChecks } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InterviewSetup() {
  const params = useParams<{ id: string }>();
  const interviewId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  
  const { data: interview, isLoading: isLoadingInterview } = useInterview(interviewId);
  const { data: questions, isLoading: isLoadingQuestions } = useQuestions(interviewId);
  const generateMutation = useGenerateQuestions();

  const handleGenerate = async () => {
    await generateMutation.mutateAsync({ id: interviewId, count: 5 });
  };

  const handleStart = () => {
    setLocation(`/interviews/${interviewId}/session`);
  };

  const hasQuestions = questions && questions.length > 0;
  const isGenerating = generateMutation.isPending;

  if (isLoadingInterview) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto mt-10">
          <Skeleton className="h-10 w-1/3 mb-4" />
          <Skeleton className="h-24 w-full mb-8 rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </Layout>
    );
  }

  if (!interview) {
    return (
      <Layout>
        <div className="text-center mt-20">
          <h2 className="text-2xl font-bold">Interview not found</h2>
          <Button onClick={() => setLocation("/")} className="mt-4">Back to Dashboard</Button>
        </div>
      </Layout>
    );
  }

  // Auto-redirect if status is already beyond setup and we have questions
  if (interview.status === 'completed') {
    // Could build a results page, but redirecting to session handles review for now
     setLocation(`/interviews/${interviewId}/session`);
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold mb-4">
            Setup Phase
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">
            {interview.jobTitle}
          </h1>
          <p className="text-muted-foreground line-clamp-2">
            {interview.jobDescription}
          </p>
        </div>

        <Card className="p-8 rounded-[2rem] border-border/50 shadow-xl shadow-black/5 bg-card relative overflow-hidden">
          {/* Decorative element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none" />

          <AnimatePresence mode="wait">
            {!hasQuestions && !isGenerating && (
              <motion.div 
                key="initial"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BrainCircuit className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-2xl font-display font-bold mb-4">Generate Interview Plan</h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-8 text-lg">
                  Based on the job description, our AI will generate 5 targeted behavioral and technical questions.
                </p>
                <Button 
                  size="lg" 
                  onClick={handleGenerate}
                  className="h-14 px-8 text-lg rounded-xl font-semibold shadow-lg shadow-primary/25 hover:-translate-y-1 transition-all"
                >
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  Generate Questions
                </Button>
              </motion.div>
            )}

            {isGenerating && (
              <motion.div 
                key="generating"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center py-16"
              >
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BrainCircuit className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                </div>
                <h2 className="text-2xl font-display font-bold mb-2">Analyzing Job Description</h2>
                <p className="text-muted-foreground animate-pulse">Crafting the perfect interview questions...</p>
              </motion.div>
            )}

            {hasQuestions && !isGenerating && (
              <motion.div 
                key="ready"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="relative z-10"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold">Plan Ready</h2>
                    <p className="text-muted-foreground">Generated {questions.length} questions for your session.</p>
                  </div>
                </div>

                <div className="space-y-4 mb-10">
                  {questions.map((q, i) => (
                    <div key={q.id} className="p-4 rounded-xl bg-secondary/50 border border-border/50 flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0 border border-border">
                        {i + 1}
                      </div>
                      <p className="text-foreground pt-1 font-medium">{q.question}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end border-t border-border pt-6">
                  <Button 
                    size="lg" 
                    onClick={handleStart}
                    className="h-14 px-10 text-lg rounded-xl font-bold bg-gradient-to-r from-primary to-accent hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
                  >
                    <PlayCircle className="w-6 h-6 mr-2" />
                    Start Interview Session
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </Layout>
  );
}

// Simple spark icon component since we used it above
function SparklesIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  );
}
