import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { toast } from "sonner";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token || token.length < 32) {
        setTokenValid(false);
        setChecking(false);
        return;
      }
      try {
        const { valid } = await api.auth.checkResetToken(token);
        if (!cancelled) {
          setTokenValid(valid);
        }
      } catch {
        if (!cancelled) setTokenValid(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres");
      return;
    }
    if (password !== password2) {
      toast.error("As senhas não coincidem");
      return;
    }

    setLoading(true);
    try {
      const data = await api.auth.resetPassword(token, password);
      toast.success(data.message);
      navigate("/login", { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao redefinir senha";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">Verificando link...</p>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Link inválido ou expirado</CardTitle>
            <p className="text-sm text-muted-foreground">
              Solicite uma nova recuperação de senha na tela de login.
            </p>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full gap-2" asChild>
              <Link to="/forgot-password">
                <ArrowLeft className="h-4 w-4" />
                Pedir novo link
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Building2 className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">Nova senha</CardTitle>
          <p className="text-sm text-muted-foreground">Escolha uma senha com pelo menos 8 caracteres.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Nova senha</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="password2">Confirmar senha</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password2"
                  type="password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  className="pl-10"
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold">
              {loading ? "Guardando..." : "Guardar nova senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
