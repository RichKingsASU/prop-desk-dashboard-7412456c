import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LayoutProvider } from "./contexts/LayoutContext";
import Index from "./pages/Index";
import F1Dashboard from "./pages/F1Dashboard";
import Console from "./pages/Console";
import Options from "./pages/Options";
import Developer from "./pages/Developer";
import NotFound from "./pages/NotFound";
import TestHub from "./pages/test/TestHub";
import SupabaseDashboard from "./pages/test/SupabaseDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LayoutProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<F1Dashboard />} />
            <Route path="/legacy" element={<Index />} />
            <Route path="/console/:symbol" element={<Console />} />
            <Route path="/options" element={<Options />} />
            <Route path="/developer" element={<Developer />} />
            <Route path="/test" element={<TestHub />} />
            <Route path="/test/supabase-dashboard" element={<SupabaseDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LayoutProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
