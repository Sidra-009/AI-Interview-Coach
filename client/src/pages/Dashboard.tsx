import { Link } from "wouter";
import { format } from "date-fns";
import { useInterviews } from "@/hooks/use-interviews";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Calendar, ChevronRight, Plus, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: interviews, isLoading } = useInterviews();

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight text-foreground mb-2">
            Your Interviews
          </h1>
          <p className="text-muted-foreground text-lg">
            Practice and perfect your interview skills with AI.
          </p>
        </div>
        <Link href="/interviews/new" className="block w-full md:w-auto">
          <Button size="lg" className="w-full md:w-auto gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5 rounded-xl h-12">
            <Plus className="w-5 h-5" />
            <span className="font-semibold">New Interview</span>
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 rounded-2xl border-border/50">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2 mb-6" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </Card>
          ))}
        </div>
      ) : interviews?.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/50 border border-dashed border-border rounded-3xl p-12 text-center flex flex-col items-center justify-center max-w-2xl mx-auto mt-12"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Briefcase className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-3">No interviews yet</h2>
          <p className="text-muted-foreground mb-8 max-w-md">
            Create your first practice interview by providing a job title and description. Our AI will generate tailored questions for you.
          </p>
          <Link href="/interviews/new">
            <Button size="lg" className="gap-2 rounded-xl">
              <Plus className="w-5 h-5" /> Create First Interview
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {interviews?.map((interview, index) => (
            <motion.div
              key={interview.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/interviews/${interview.id}`} className="block h-full">
                <Card className="h-full p-6 flex flex-col rounded-2xl border-border/60 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group cursor-pointer bg-card/60 backdrop-blur-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-xl group-hover:scale-110 transition-transform">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <Badge variant={interview.status === 'completed' ? 'default' : 'secondary'} className="rounded-md font-medium px-2.5 py-1 capitalize">
                      {interview.status === 'completed' ? 'Completed' : interview.status === 'setup' ? 'Draft' : 'In Progress'}
                    </Badge>
                  </div>
                  
                  <h3 className="font-display font-bold text-xl mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {interview.jobTitle}
                  </h3>
                  
                  <div className="flex items-center text-sm text-muted-foreground mb-6 gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{interview.createdAt ? format(new Date(interview.createdAt), 'MMM d, yyyy') : 'Recently'}</span>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    <span>{interview.status === 'setup' ? 'Continue Setup' : 'View Session'}</span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </Layout>
  );
}
