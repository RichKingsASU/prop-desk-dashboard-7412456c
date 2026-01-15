import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LayoutProvider } from "./contexts/LayoutContext";
import { AuthProvider, useAuth } from "@/auth/useAuth";
import { MainLayout } from "./layouts/MainLayout";
import Index from "./pages/Index";
import F1Dashboard from "./pages/F1Dashboard";
import Console from "./pages/Console";
import Options from "./pages/Options";
import OptionsDashboard from "./components/OptionsDashboard";
import Developer from "./pages/Developer";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import TestHub from "./pages/test/TestHub";
import DataDashboard from "./pages/test/DataDashboard";
import OpsLayout from "./pages/ops/OpsLayout";
import OpsOverview from "./pages/ops/OpsOverview";
import OptionsExplorer from "./pages/ops/OptionsExplorer";
import NewsViewer from "./pages/ops/NewsViewer";
import JobHealth from "./pages/ops/JobHealth";
import MissionControl from "./pages/MissionControl";

const queryClient = new QueryClient();

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LayoutProvider>
        <BrowserRouter>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <MainLayout>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route
                    path="/"
                    element={
                      <Protected>
                        <F1Dashboard />
                      </Protected>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <Protected>
                        <Settings />
                      </Protected>
                    }
                  />
                  <Route
                    path="/legacy"
                    element={
                      <Protected>
                        <Index />
                      </Protected>
                    }
                  />
                  <Route
                    path="/console/:symbol"
                    element={
                      <Protected>
                        <Console />
                      </Protected>
                    }
                  />
                  <Route
                    path="/options"
                    element={
                      <Protected>
                        <Options />
                      </Protected>
                    }
                  />
                  <Route
                    path="/options-dashboard"
                    element={
                      <Protected>
                        <OptionsDashboard />
                      </Protected>
                    }
                  />
                  <Route
                    path="/developer"
                    element={
                      <Protected>
                        <Developer />
                      </Protected>
                    }
                  />
                  <Route
                    path="/mission-control"
                    element={
                      <Protected>
                        <MissionControl />
                      </Protected>
                    }
                  />
                  <Route
                    path="/ops"
                    element={
                      <Protected>
                        <OpsLayout />
                      </Protected>
                    }
                  >
                    <Route index element={<OpsOverview />} />
                    <Route path="options" element={<OptionsExplorer />} />
                    <Route path="news" element={<NewsViewer />} />
                    <Route path="jobs" element={<JobHealth />} />
                  </Route>
                  <Route
                    path="/test"
                    element={
                      <Protected>
                        <TestHub />
                      </Protected>
                    }
                  />
                  <Route
                    path="/test/data-dashboard"
                    element={
                      <Protected>
                        <DataDashboard />
                      </Protected>
                    }
                  />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </MainLayout>
            </TooltipProvider>
          </AuthProvider>
        </BrowserRouter>
      </LayoutProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
