import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SalaryAdhocFlow } from "@/components/SalaryAdhocFlow";

const SalaryAdhocPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Calculator className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Salário avulso</h1>
              <p className="text-xs text-muted-foreground">Cálculo guiado (experiência / treino)</p>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-2xl">
        <SalaryAdhocFlow />
      </main>
    </div>
  );
};

export default SalaryAdhocPage;
