import { Link, useLocation } from "wouter";
import { ReactNode } from "react";
import { Trophy, LayoutGrid, ListOrdered, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/", label: "Rank", icon: Trophy },
  { path: "/meals", label: "Meals", icon: LayoutGrid },
  { path: "/leaderboard", label: "Leaderboard", icon: ListOrdered },
  { path: "/stats", label: "Stats", icon: BarChart3 },
] as const;

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [loc] = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pb-20 md:pb-6 md:pl-24">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
        aria-label="Main"
      >
        <div className="flex justify-around h-16">
          {tabs.map(({ path, label, icon: Icon }) => {
            const active = loc === path || (path !== "/" && loc.startsWith(path));
            return (
              <Link
                key={path}
                href={path}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 gap-0.5 text-sm transition-colors",
                  active
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop side nav */}
      <aside
        className="fixed left-0 top-0 bottom-0 w-20 hidden md:flex flex-col border-r bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 z-40"
        aria-label="Main"
      >
        <div className="p-3 flex justify-center border-b">
          <span className="font-bold text-primary text-lg">MR</span>
        </div>
        <nav className="flex-1 flex flex-col py-4 gap-1">
          {tabs.map(({ path, label, icon: Icon }) => {
            const active = loc === path || (path !== "/" && loc.startsWith(path));
            return (
              <Link
                key={path}
                href={path}
                title={label}
                className={cn(
                  "flex flex-col items-center justify-center py-3 gap-1 text-xs transition-colors",
                  active
                    ? "text-primary font-medium bg-primary/10 border-l-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="size-6" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
