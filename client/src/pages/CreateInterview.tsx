import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { useCreateInterview } from "@/hooks/use-interviews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowRight, Briefcase, FileText, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function CreateInterview() {
  const [, setLocation] = useLocation();
  const createMutation = useCreateInterview();
  
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !jobDescription.trim()) {
      setError("Please provide both a job title and description.");
      return;
    }
    
    setError("");
    try {
      const result = await createMutation.mutateAsync({
        jobTitle,
        jobDescription,
      });
      // Redirect to the interview setup/generation page
      setLocation(`/interviews/${result.id}`);
    } catch (err) {
      setError("Failed to create interview. Please try again.");
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4"
          >
            <Sparkles className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-3">
            Tailor Your Practice
          </h1>
          <p className="text-muted-foreground text-lg">
            Paste the job description and our AI will generate realistic interview questions for this specific role.
          </p>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 md:p-8 rounded-3xl border-border/60 shadow-xl shadow-black/5 bg-card/80 backdrop-blur-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <Label htmlFor="jobTitle" className="text-base font-semibold flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  Target Role / Job Title
                </Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="h-14 text-lg px-4 rounded-xl bg-background/50 border-border focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobDescription" className="text-base font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Job Description
                </Label>
                <Textarea
                  id="jobDescription"
                  placeholder="Paste the full job description here. The more detail, the better the questions."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[250px] text-base p-4 rounded-xl bg-background/50 border-border focus:ring-primary/20 transition-all resize-y"
                />
              </div>

              {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm font-medium border border-destructive/20">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                size="lg" 
                className="w-full h-14 text-lg rounded-xl font-semibold bg-gradient-to-r from-primary to-primary/80 hover:to-primary hover:shadow-xl hover:shadow-primary/25 transition-all duration-300"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Preparing Setup...
                  </>
                ) : (
                  <>
                    Generate Questions <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
