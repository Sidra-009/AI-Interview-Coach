import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/Dashboard";
import CreateInterview from "@/pages/CreateInterview";
import InterviewSetup from "@/pages/InterviewSetup";
import InterviewSession from "@/pages/InterviewSession";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard}/>
      <Route path="/interviews/new" component={CreateInterview}/>
      <Route path="/interviews/:id" component={InterviewSetup}/>
      <Route path="/interviews/:id/session" component={InterviewSession}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
