import { useNavigate } from "react-router-dom";
import { FileText, AlertTriangle, History, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const menuItems = [
  {
    title: "Suspensão",
    description: "Gerar termo de suspensão",
    icon: FileText,
    path: "/suspensao",
    color: "bg-primary text-primary-foreground",
  },
  {
    title: "Advertência",
    description: "Gerar termo de advertência",
    icon: AlertTriangle,
    path: "/advertencia",
    color: "bg-accent text-accent-foreground",
  },
  {
    title: "Histórico",
    description: "Documentos emitidos",
    icon: History,
    path: "/historico",
    color: "bg-secondary text-secondary-foreground",
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto max-w-2xl px-4 py-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <FileText className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Documentos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Suspensões, advertências e histórico</p>
        </div>
      </header>

      {/* Menu */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <div className="space-y-3">
          {menuItems.map((item) => (
            <Card
              key={item.path}
              className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
              onClick={() => navigate(item.path)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-foreground">{item.title}</h2>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
