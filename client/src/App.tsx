import { Component, type ReactNode } from "react";
import { Route, Switch, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { RankPage } from "@/pages/RankPage";
import { MealsPage } from "@/pages/MealsPage";
import { MealDetailPage } from "@/pages/MealDetailPage";
import { EditMealPage } from "@/pages/EditMealPage";
import { LeaderboardPage } from "@/pages/LeaderboardPage";
import { StatsPage } from "@/pages/StatsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
    },
  },
});

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  state = { hasError: false, error: undefined as Error | undefined };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "42rem" }}>
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Something went wrong</h1>
          <pre style={{ overflow: "auto", fontSize: "0.875rem", color: "#ef4444" }}>
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Layout>
          <Switch>
            <Route path="/" component={RankPage} />
            <Route path="/meals" component={MealsPage} />
            <Route path="/meals/new" component={EditMealPage} />
            <Route path="/meals/:id/edit" component={EditMealPage} />
            <Route path="/meals/:id" component={MealDetailPage} />
            <Route path="/leaderboard" component={LeaderboardPage} />
            <Route path="/stats" component={StatsPage} />
            <Route path="*">
              <Redirect to="/" />
            </Route>
          </Switch>
        </Layout>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
