import { useState } from "react";
import { SuspensionForm } from "@/components/SuspensionForm";
import { FileText } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Gerador de Suspensão</h1>
            <p className="text-xs text-muted-foreground">Preencha os dados e gere o documento</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
        <SuspensionForm />
      </main>
    </div>
  );
};

export default Index;
