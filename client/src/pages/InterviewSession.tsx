import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { useInterview, useQuestions, useEvaluateQuestion } from "@/hooks/use-interviews";
import { useVoiceRecorder, useVoiceStream } from "@/replit_integrations/audio";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, Square, Loader2, Sparkles, ChevronRight, User, Bot, Activity, BrainCircuit } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

export default function InterviewSession() {
  const params = useParams<{ id: string }>();
  const interviewId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();

  const { data: interview, isLoading: isLoadingInterview } = useInterview(interviewId);
  const { data: questions, isLoading: isLoadingQuestions } = useQuestions(interviewId);
  const evaluateMutation = useEvaluateQuestion();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionTranscript, setSessionTranscript] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Audio Hooks
  const recorder = useVoiceRecorder();
  const stream = useVoiceStream({
    onUserTranscript: (text) => {
      setSessionTranscript(prev => [...prev, { role: 'user', text }]);
    },
    onTranscript: (text, full) => {
      // Update the last AI message as it streams in
      setSessionTranscript(prev => {
        const newTranscript = [...prev];
        const lastMsg = newTranscript[newTranscript.length - 1];
        if (lastMsg && lastMsg.role === 'ai') {
          lastMsg.text = full;
        } else {
          newTranscript.push({ role: 'ai', text: full });
        }
        return newTranscript;
      });
    },
    onComplete: () => {
      setIsProcessingVoice(false);
    },
    onError: (err) => {
      console.error("Stream error:", err);
      setIsProcessingVoice(false);
    }
  });

  // Auto scroll to bottom of transcript
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessionTranscript]);

  const currentQuestion = questions?.[currentIndex];
  const isAnswered = currentQuestion?.status === 'answered';

  const toggleRecording = async () => {
    if (recorder.state === "recording") {
      setIsProcessingVoice(true);
      const blob = await recorder.stopRecording();
      try {
        // We use the generic message endpoint to converse. 
        // The context will be handled by the backend if modified, or just conversational response here.
        await stream.streamVoiceResponse(`/api/interviews/${interviewId}/messages`, blob);
      } catch (e) {
        setIsProcessingVoice(false);
      }
    } else {
      await recorder.startRecording();
    }
  };

  const handleEvaluate = async () => {
    if (!currentQuestion) return;
    
    // Combine user's transcripts for this question to evaluate
    const userAnswers = sessionTranscript.filter(t => t.role === 'user').map(t => t.text).join(" ");
    
    if (!userAnswers) {
      alert("Please provide an answer before evaluating.");
      return;
    }

    await evaluateMutation.mutateAsync({
      questionId: currentQuestion.id,
      answerTranscript: userAnswers,
    });
  };

  const handleNext = () => {
    if (questions && currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSessionTranscript([]); // Clear transcript for next question
    } else {
      // Finished
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => setLocation("/"), 3000);
    }
  };

  if (isLoadingInterview || isLoadingQuestions) {
    return <Layout><div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
  }

  if (!questions || questions.length === 0) {
    return <Layout><div className="text-center mt-20">No questions generated yet.</div></Layout>;
  }

  const isCompleted = currentIndex === questions.length - 1 && isAnswered;

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        
        {/* Header Progress */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Badge variant="outline" className="mb-2 font-display uppercase tracking-wider text-xs border-primary/20 text-primary bg-primary/5">
              Question {currentIndex + 1} of {questions.length}
            </Badge>
            <h1 className="text-xl font-display font-bold text-foreground">
              {interview?.jobTitle} Interview
            </h1>
          </div>
          
          <div className="flex gap-1">
            {questions.map((q, i) => (
              <div 
                key={q.id} 
                className={`h-2 rounded-full transition-all duration-300 ${
                  i < currentIndex ? 'w-8 bg-primary' : 
                  i === currentIndex ? 'w-12 bg-primary/60' : 'w-4 bg-border'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 pb-6">
          
          {/* Left Column: Question & Transcript */}
          <div className="lg:col-span-8 flex flex-col gap-6 min-h-0">
            {/* Current Question Card */}
            <Card className="p-6 md:p-8 rounded-3xl border-border/60 shadow-lg bg-card shrink-0">
              <h2 className="text-2xl md:text-3xl font-display font-semibold leading-tight mb-2">
                {currentQuestion?.question}
              </h2>
            </Card>

            {/* Live Conversation Transcript */}
            <Card className="flex-1 p-6 rounded-3xl border-border/60 bg-secondary/30 flex flex-col min-h-0 overflow-hidden relative">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border/50 shrink-0">
                <Activity className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">Live Transcript</span>
              </div>
              
              <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
                <div className="space-y-6 pb-4">
                  {sessionTranscript.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground pt-10">
                      <Mic className="w-12 h-12 mb-4 opacity-20" />
                      <p>Start recording to answer the question.</p>
                    </div>
                  ) : (
                    sessionTranscript.map((msg, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={idx} 
                        className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-accent/20 text-accent'
                        }`}>
                          {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className={`p-4 rounded-2xl max-w-[80%] ${
                          msg.role === 'user' 
                            ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                            : 'bg-card border border-border/50 shadow-sm rounded-tl-sm'
                        }`}>
                          <p className="leading-relaxed">{msg.text}</p>
                        </div>
                      </motion.div>
                    ))
                  )}
                  {isProcessingVoice && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                       <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm rounded-tl-sm flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          <span className="text-muted-foreground text-sm">AI is responding...</span>
                        </div>
                    </motion.div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>

          {/* Right Column: Actions & Feedback */}
          <div className="lg:col-span-4 flex flex-col gap-6 min-h-0">
            
            {/* Voice Control Card */}
            <Card className="p-6 rounded-3xl border-border/60 bg-card text-center shrink-0 flex flex-col items-center justify-center">
              {!isAnswered ? (
                <>
                  <div className="mb-6 relative">
                    {recorder.state === "recording" && (
                      <div className="absolute inset-0 recording-pulse rounded-full z-0" />
                    )}
                    <button
                      onClick={toggleRecording}
                      disabled={isProcessingVoice || evaluateMutation.isPending}
                      className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                        recorder.state === "recording" 
                          ? "bg-destructive text-white scale-110 shadow-destructive/50" 
                          : "bg-primary text-white hover:scale-105 hover:bg-primary/90 hover:shadow-primary/40"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {recorder.state === "recording" ? (
                         <Square className="w-8 h-8 fill-current" />
                      ) : (
                         <Mic className="w-10 h-10" />
                      )}
                    </button>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-1">
                    {recorder.state === "recording" ? "Listening..." : "Your Answer"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {recorder.state === "recording" 
                      ? "Click to stop recording" 
                      : "Click the mic to start speaking"}
                  </p>

                  <Button 
                    onClick={handleEvaluate} 
                    disabled={sessionTranscript.length === 0 || recorder.state === 'recording' || isProcessingVoice}
                    className="w-full h-12 rounded-xl bg-accent hover:bg-accent/90 text-white font-semibold"
                  >
                    {evaluateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit & Get Feedback"}
                  </Button>
                </>
              ) : (
                <div className="w-full text-left">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-accent/20 rounded-lg">
                      <Sparkles className="w-5 h-5 text-accent" />
                    </div>
                    <h3 className="font-display font-bold text-xl">Feedback Received</h3>
                  </div>
                  <Button 
                    onClick={handleNext}
                    className="w-full h-14 rounded-xl font-bold text-lg bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all"
                  >
                    {currentIndex < questions.length - 1 ? "Next Question" : "Complete Interview"} 
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              )}
            </Card>

            {/* Feedback Display Area */}
            {isAnswered && currentQuestion?.feedback && (
              <Card className="flex-1 p-6 rounded-3xl border-accent/20 bg-accent/5 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-accent" />
                    Evaluation
                  </h3>
                  {currentQuestion.score && (
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background border-2 border-accent font-bold text-accent">
                      {currentQuestion.score}
                    </div>
                  )}
                </div>
                <ScrollArea className="flex-1 pr-2">
                  <div className="prose prose-sm dark:prose-invert">
                    {currentQuestion.feedback.split('\n').map((para, i) => (
                      <p key={i} className="mb-2 leading-relaxed text-foreground/90">{para}</p>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
