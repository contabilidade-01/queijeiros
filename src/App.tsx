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
import AdminPage from "./pages/AdminPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Rotas do app empresarial: administrador é redirecionado ao painel /admin */
function CompanyOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isAdmin } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isAdmin } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/admin" element={<AdminOnlyRoute><AdminPage /></AdminOnlyRoute>} />
    <Route path="/" element={<CompanyOnlyRoute><Index /></CompanyOnlyRoute>} />
    <Route path="/suspensao" element={<CompanyOnlyRoute><SuspensionPage /></CompanyOnlyRoute>} />
    <Route path="/advertencia" element={<CompanyOnlyRoute><WarningPage /></CompanyOnlyRoute>} />
    <Route path="/historico" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
    <Route path="/funcionarios" element={<CompanyOnlyRoute><EmployeesPage /></CompanyOnlyRoute>} />
    <Route path="/chatbot" element={<CompanyOnlyRoute><ChatbotPage /></CompanyOnlyRoute>} />
    <Route path="/atestados" element={<CompanyOnlyRoute><CertificatesPage /></CompanyOnlyRoute>} />
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
