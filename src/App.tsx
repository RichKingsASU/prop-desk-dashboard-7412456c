import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LayoutProvider } from "./contexts/LayoutContext";
import { AuthProvider } from "./contexts/AuthContext";
import { MainLayout } from "./layouts/MainLayout";
import { RequireAuth } from "@/components/RequireAuth";
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
import SupabaseDashboard from "./pages/test/SupabaseDashboard";
import OpsLayout from "./pages/ops/OpsLayout";
import OpsOverview from "./pages/ops/OpsOverview";
import OptionsExplorer from "./pages/ops/OptionsExplorer";
import NewsViewer from "./pages/ops/NewsViewer";
import JobHealth from "./pages/ops/JobHealth";
import MissionControl from "./pages/MissionControl";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LayoutProvider>
        <BrowserRouter>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/auth" element={<Auth />} />

                <Route element={<RequireAuth />}>
                  <Route
                    element={
                      <MainLayout>
                        <Outlet />
                      </MainLayout>
                    }
                  >
                    <Route path="/" element={<F1Dashboard />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/legacy" element={<Index />} />
                    <Route path="/console/:symbol" element={<Console />} />
                    <Route path="/options" element={<Options />} />
                    <Route path="/options-dashboard" element={<OptionsDashboard />} />
                    <Route path="/developer" element={<Developer />} />
                    <Route path="/mission-control" element={<MissionControl />} />
                    <Route path="/ops" element={<OpsLayout />}>
                      <Route index element={<OpsOverview />} />
                      <Route path="options" element={<OptionsExplorer />} />
                      <Route path="news" element={<NewsViewer />} />
                      <Route path="jobs" element={<JobHealth />} />
                    </Route>
                    <Route path="/test" element={<TestHub />} />
                    <Route path="/test/supabase-dashboard" element={<SupabaseDashboard />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Route>
              </Routes>
            </TooltipProvider>
          </AuthProvider>
        </BrowserRouter>
      </LayoutProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
