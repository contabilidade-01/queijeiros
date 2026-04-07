import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, ClipboardList, FileText, LayoutDashboard, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const AdminPage = () => {
  const navigate = useNavigate();
  const { admin, logout } = useAuth();

  const { data: summary } = useQuery({
    queryKey: ["admin-summary"],
    queryFn: () => api.admin.summary(),
  });

  const { data: companies } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: () => api.admin.companies(),
  });

  const { data: documents, isLoading: loadingDocs } = useQuery({
    queryKey: ["issued-documents", "all"],
    queryFn: () => api.documents.list(),
  });

  const { data: employees, isLoading: loadingEmp } = useQuery({
    queryKey: ["employees", "all"],
    queryFn: () => api.employees.list(),
  });

  const { data: certificates, isLoading: loadingCert } = useQuery({
    queryKey: ["certificates", "all"],
    queryFn: () => api.certificates.list(),
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/login")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              Painel administrador
            </h1>
            <p className="text-xs text-muted-foreground">
              CPF: {admin?.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Empresas</p>
                <p className="text-2xl font-bold">{summary.companies}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Documentos</p>
                <p className="text-2xl font-bold">{summary.documents}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Funcionários</p>
                <p className="text-2xl font-bold">{summary.employees}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Atestados</p>
                <p className="text-2xl font-bold">{summary.certificates}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Empresas
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-48 overflow-y-auto space-y-2 text-sm">
            {companies?.length ? (
              companies.map((c) => (
                <div key={c.id} className="flex justify-between gap-2 border-b border-border/50 pb-2 last:border-0">
                  <span className="font-medium truncate">{c.name}</span>
                  <span className="text-muted-foreground shrink-0 text-xs">{c.cnpj}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">Nenhuma empresa</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> Documentos emitidos (todas as empresas)
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-72 overflow-y-auto space-y-2">
            {loadingDocs ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : documents?.length ? (
              documents.map((doc) => (
                <div key={doc.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={doc.document_type === "suspension" ? "default" : "secondary"}>
                      {doc.document_type === "suspension" ? "Suspensão" : "Advertência"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{doc.company_name}</span>
                  </div>
                  <p className="font-medium mt-1">{doc.employee_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(doc.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })} · CNPJ {doc.company_cnpj}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum documento</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> Funcionários (todas as empresas)
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-72 overflow-y-auto space-y-2 text-sm">
            {loadingEmp ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : employees?.length ? (
              employees.map((e) => (
                <div key={e.id} className="flex flex-col border-b border-border/50 pb-2 last:border-0">
                  <span className="font-medium">{e.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {e.company_name ?? "—"} · CPF {e.cpf}
                    {!e.active ? " · inativo" : ""}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Nenhum funcionário</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Atestados (todas as empresas)
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-72 overflow-y-auto space-y-2 text-sm">
            {loadingCert ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : certificates?.length ? (
              certificates.map((c) => (
                <div key={c.id} className="flex flex-col border-b border-border/50 pb-2 last:border-0">
                  <span className="font-medium">{c.employee_name ?? "—"}</span>
                  <span className="text-xs text-muted-foreground">
                    {c.company_name ?? "—"} · {c.file_name} ·{" "}
                    {format(new Date(c.certificate_date), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                  <a
                    className="text-xs text-primary underline mt-1"
                    href={api.certificates.fileUrl(c.file_path)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir arquivo
                  </a>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Nenhum atestado</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminPage;
