import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Users, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { maskCPF, maskPIS } from "@/lib/masks";

const EmployeesPage = () => {
  const navigate = useNavigate();
  const { company } = useAuth();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [pis, setPis] = useState("");

  const { data: employees, isLoading } = useQuery({
    queryKey: ["employees", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("company_id", company!.id)
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!company,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("employees").insert({
        company_id: company!.id,
        name: name.trim().toUpperCase(),
        cpf: cpf.trim(),
        pis: pis.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setShowAdd(false);
      setName("");
      setCpf("");
      setPis("");
      toast.success("Funcionário adicionado");
    },
    onError: () => toast.error("Erro ao adicionar"),
  });

  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("employees")
        .update({ name: name.trim().toUpperCase(), cpf: cpf.trim(), pis: pis.trim() || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setEditingId(null);
      setName("");
      setCpf("");
      setPis("");
      toast.success("Funcionário atualizado");
    },
    onError: () => toast.error("Erro ao atualizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Funcionário removido");
    },
  });

  const startEdit = (emp: { id: string; name: string; cpf: string; pis: string | null }) => {
    setEditingId(emp.id);
    setName(emp.name);
    setCpf(emp.cpf);
    setPis(emp.pis || "");
    setShowAdd(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAdd(false);
    setName("");
    setCpf("");
    setPis("");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Funcionários</h1>
            <p className="text-xs text-muted-foreground">{company?.name}</p>
          </div>
          {!showAdd && !editingId && (
            <Button size="sm" onClick={() => { setShowAdd(true); setName(""); setCpf(""); setPis(""); }}>
              <Plus className="h-4 w-4 mr-1" /> Novo
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-3">
        {(showAdd || editingId) && (
          <Card className="border-primary/50">
            <CardContent className="p-4 space-y-3">
              <div>
                <Label>Nome Completo *</Label>
                <Input placeholder="Ex: João da Silva" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>CPF *</Label>
                  <Input placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>PIS <span className="text-xs text-muted-foreground">(opcional)</span></Label>
                  <Input placeholder="000.00000.00-0" value={pis} onChange={(e) => setPis(e.target.value)} className="mt-1" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 gap-1"
                  onClick={() => editingId ? updateMutation.mutate(editingId) : addMutation.mutate()}
                  disabled={!name.trim() || !cpf.trim()}
                >
                  <Save className="h-4 w-4" /> {editingId ? "Salvar" : "Adicionar"}
                </Button>
                <Button variant="outline" onClick={cancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Carregando...</div>
        ) : !employees?.length ? (
          <div className="py-12 text-center text-muted-foreground">
            <Users className="mx-auto mb-3 h-12 w-12 opacity-30" />
            <p>Nenhum funcionário cadastrado</p>
          </div>
        ) : (
          employees.map((emp) => (
            <Card key={emp.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{emp.name}</p>
                  <p className="text-xs text-muted-foreground">
                    CPF: {emp.cpf}
                    {emp.pis && ` • PIS: ${emp.pis}`}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(emp)} className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate(emp.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  );
};

export default EmployeesPage;
