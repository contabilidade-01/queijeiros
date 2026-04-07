import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Building2, ClipboardList, FileText, LayoutDashboard, Mail, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const AdminPage = () => {
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const queryClient = useQueryClient();

  const { data: summary } = useQuery({
    queryKey: ["admin-summary"],
    queryFn: () => api.admin.summary(),
  });

  const { data: adminMe } = useQuery({
    queryKey: ["admin-me"],
    queryFn: () => api.admin.me(),
  });

  const [adminEmail, setAdminEmail] = useState("");
  useEffect(() => {
    setAdminEmail(adminMe?.contact_email ?? "");
  }, [adminMe?.contact_email]);

  const saveAdminEmail = useMutation({
    mutationFn: () =>
      api.admin.updateMyContactEmail(adminEmail.trim() ? adminEmail.trim().toLowerCase() : null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-me"] });
      toast.success("E-mail do administrador atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" /> Seu e-mail (recuperação de senha)
            </CardTitle>
            <p className="text-xs text-muted-foreground font-normal">
              Usado em &quot;Esqueci minha senha&quot; com o seu CPF de administrador. Sem e-mail
              cadastrado, a recuperação automática não funciona.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <div className="flex-1 space-y-1">
              <Label htmlFor="admin-contact-email" className="text-xs">
                E-mail
              </Label>
              <Input
                id="admin-contact-email"
                type="email"
                placeholder="admin@empresa.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <Button
              type="button"
              onClick={() => saveAdminEmail.mutate()}
              disabled={saveAdminEmail.isPending}
            >
              Guardar
            </Button>
          </CardContent>
        </Card>

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
          <CardContent className="max-h-96 overflow-y-auto space-y-4 text-sm">
            {companies?.length ? (
              companies.map((c) => (
                <CompanyEmailRow key={c.id} company={c} />
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

function CompanyEmailRow({
  company,
}: {
  company: {
    id: string;
    name: string;
    cnpj: string;
    contact_email: string | null;
  };
}) {
  const [email, setEmail] = useState(company.contact_email ?? "");
  useEffect(() => {
    setEmail(company.contact_email ?? "");
  }, [company.contact_email]);
  const queryClient = useQueryClient();

  const mut = useMutation({
    mutationFn: () =>
      api.admin.updateCompanyContactEmail(company.id, email.trim() ? email.trim().toLowerCase() : null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      toast.success(`E-mail de ${company.name} atualizado`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="border-b border-border/50 pb-3 last:border-0 space-y-2">
      <div className="flex flex-wrap justify-between gap-2">
        <span className="font-medium truncate">{company.name}</span>
        <span className="text-muted-foreground shrink-0 text-xs">{company.cnpj}</span>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <Input
          type="email"
          placeholder="E-mail para recuperação de senha"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="sm:max-w-md"
        />
        <Button type="button" size="sm" onClick={() => mut.mutate()} disabled={mut.isPending}>
          Guardar
        </Button>
      </div>
    </div>
  );
}

export default AdminPage;
