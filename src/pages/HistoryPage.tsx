import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const HistoryPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ["issued-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("issued_documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("issued_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issued-documents"] });
      toast.success("Documento removido");
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Histórico de Documentos</h1>
            <p className="text-xs text-muted-foreground">Documentos emitidos</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6">
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Carregando...</div>
        ) : !documents?.length ? (
          <div className="py-12 text-center text-muted-foreground">
            <FileText className="mx-auto mb-3 h-12 w-12 opacity-30" />
            <p>Nenhum documento emitido ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="flex items-start gap-3 p-4">
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    doc.document_type === "suspension"
                      ? "bg-primary/10 text-primary"
                      : "bg-accent/10 text-accent"
                  }`}>
                    {doc.document_type === "suspension" ? (
                      <FileText className="h-5 w-5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={doc.document_type === "suspension" ? "default" : "secondary"}>
                        {doc.document_type === "suspension" ? "Suspensão" : "Advertência"}
                      </Badge>
                      {doc.suspension_days && (
                        <span className="text-xs text-muted-foreground">
                          {doc.suspension_days} dia{doc.suspension_days > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-medium text-foreground truncate">{doc.employee_name}</p>
                    <p className="text-xs text-muted-foreground">
                      CPF: {doc.employee_cpf}
                      {doc.employee_pis && ` • PIS: ${doc.employee_pis}`}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Emitido em {format(new Date(doc.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default HistoryPage;
