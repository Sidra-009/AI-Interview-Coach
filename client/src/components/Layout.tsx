import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Briefcase, LayoutDashboard, PlusCircle, Settings, Mic2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/interviews/new", label: "New Interview", icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen flex w-full bg-background/50">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Mic2 className="text-white w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            Aura<span className="text-primary">Coach</span>
          </span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="block">
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 h-11 text-base ${
                    isActive ? "font-semibold bg-secondary/80 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border/50">
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-4 border border-primary/20">
            <h4 className="font-display font-semibold text-sm mb-1">Pro Tip</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Speak clearly and naturally. The AI evaluates both content and delivery structure.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none -z-10" />
        
        <header className="h-16 border-b border-border/50 flex items-center px-6 md:hidden bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-2">
             <Mic2 className="text-primary w-5 h-5" />
             <span className="font-display font-bold text-lg">AuraCoach</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-4 md:p-8 lg:p-10 w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
