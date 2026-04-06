import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import SuspensionPage from "./pages/SuspensionPage.tsx";
import WarningPage from "./pages/WarningPage.tsx";
import HistoryPage from "./pages/HistoryPage.tsx";
import EmployeesPage from "./pages/EmployeesPage.tsx";
import ChatbotPage from "./pages/ChatbotPage.tsx";
import CertificatesPage from "./pages/CertificatesPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
    <Route path="/suspensao" element={<ProtectedRoute><SuspensionPage /></ProtectedRoute>} />
    <Route path="/advertencia" element={<ProtectedRoute><WarningPage /></ProtectedRoute>} />
    <Route path="/historico" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
    <Route path="/funcionarios" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
    <Route path="/chatbot" element={<ProtectedRoute><ChatbotPage /></ProtectedRoute>} />
    <Route path="/atestados" element={<ProtectedRoute><CertificatesPage /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
