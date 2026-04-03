import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Lock, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const LoginPage = () => {
  const [cnpj, setCnpj] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cnpj || !password) {
      toast.error("Preencha CNPJ e senha");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, cnpj, password")
        .eq("cnpj", cnpj)
        .single();

      if (error || !data) {
        toast.error("Empresa não encontrada");
        return;
      }

      if (data.password !== password) {
        toast.error("Senha incorreta");
        return;
      }

      login({ id: data.id, name: data.name, cnpj: data.cnpj });
      toast.success(`Bem-vindo! ${data.name}`);
      navigate("/");
    } catch {
      toast.error("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Building2 className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">Gestão de Documentos</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Acesse com o CNPJ da sua empresa
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <div className="relative mt-1">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite a senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full gap-2 h-12 text-base font-semibold">
              <LogIn className="h-5 w-5" />
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
