import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Mail, ArrowLeft } from "lucide-react";
import { maskCNPJ, maskCPF } from "@/lib/masks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { toast } from "sonner";

const ForgotPasswordPage = () => {
  const [loginField, setLoginField] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLoginField = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    setLoginField(digits.length <= 11 ? maskCPF(digits) : maskCNPJ(digits));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginField.trim() || !email.trim()) {
      toast.error("Preencha login e e-mail");
      return;
    }

    setLoading(true);
    try {
      const data = await api.auth.forgotPassword(loginField, email.trim());
      toast.success(data.message);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao enviar pedido";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Building2 className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">Recuperar senha</CardTitle>
          <p className="text-sm text-muted-foreground text-balance">
            Informe o mesmo CNPJ ou CPF do login e o e-mail cadastrado para esta conta. Se os dados
            coincidirem, você receberá um link para definir uma nova senha.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="login">CNPJ ou CPF (login)</Label>
              <div className="relative mt-1">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login"
                  placeholder="CNPJ ou CPF"
                  value={loginField}
                  onChange={(e) => handleLoginField(e.target.value)}
                  className="pl-10"
                  autoComplete="username"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">E-mail cadastrado</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  autoComplete="email"
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold">
              {loading ? "Enviando..." : "Enviar link"}
            </Button>
          </form>
          <Button variant="ghost" className="w-full gap-2" asChild>
            <Link to="/login">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao login
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
