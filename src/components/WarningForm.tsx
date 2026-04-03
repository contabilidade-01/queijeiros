import { useState } from "react";
import { Plus, X, Download, CalendarIcon, User, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { downloadWarningDoc, type WarningData } from "@/lib/generateWarningDoc";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function WarningForm() {
  const [employeeName, setEmployeeName] = useState("");
  const [pis, setPis] = useState("");
  const [cpf, setCpf] = useState("");
  const [companyName, setCompanyName] = useState("RESTAURANTE DO QUEIJEIRO 3 LIMITADA");
  const [cnpj, setCnpj] = useState("52.191.264/0001-73");
  const [warningDate, setWarningDate] = useState<Date>();
  const [reason, setReason] = useState("");
  
  const [previousWarnings, setPreviousWarnings] = useState<string[]>([]);
  const [unjustifiedAbsences, setUnjustifiedAbsences] = useState<string[]>([]);

  const [newWarning, setNewWarning] = useState("");
  const [newAbsence, setNewAbsence] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const addItem = (list: string[], setList: (v: string[]) => void, value: string, setValue: (v: string) => void) => {
    if (value.trim()) {
      setList([...list, value.trim()]);
      setValue("");
    }
  };

  const removeItem = (list: string[], setList: (v: string[]) => void, index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!employeeName || !warningDate || !cpf || !reason) {
      toast.error("Preencha os campos obrigatórios: Nome, CPF, Data e Motivo");
      return;
    }

    setIsGenerating(true);

    const data: WarningData = {
      employeeName, pis, cpf, companyName, cnpj,
      warningDate, reason, previousWarnings, unjustifiedAbsences,
    };

    try {
      await downloadWarningDoc(data);

      await supabase.from("issued_documents").insert({
        document_type: "warning",
        employee_name: employeeName,
        employee_cpf: cpf,
        employee_pis: pis || null,
        company_name: companyName,
        company_cnpj: cnpj,
        start_date: format(warningDate, "yyyy-MM-dd"),
        description: reason.substring(0, 200),
      });

      toast.success("Advertência gerada e salva no histórico!");
    } catch (error) {
      toast.error("Erro ao gerar documento");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDateBR = (date: Date) => format(date, "dd/MM/yyyy", { locale: ptBR });

  return (
    <div className="space-y-4">
      {/* Employee Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-primary" />
            Dados do Funcionário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="w-name">Nome Completo *</Label>
            <Input id="w-name" placeholder="Ex: João da Silva" value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="w-cpf">CPF *</Label>
              <Input id="w-cpf" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="w-pis">PIS <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Input id="w-pis" placeholder="000.00000.00-0" value={pis} onChange={(e) => setPis(e.target.value)} className="mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-primary" />
            Dados da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="w-company">Razão Social</Label>
            <Input id="w-company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="w-cnpj">CNPJ</Label>
            <Input id="w-cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} className="mt-1" />
          </div>
        </CardContent>
      </Card>

      {/* Warning Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarIcon className="h-4 w-4 text-primary" />
            Detalhes da Advertência
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Data da Advertência *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("mt-1 w-full justify-start text-left font-normal", !warningDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {warningDate ? formatDateBR(warningDate) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={warningDate} onSelect={setWarningDate} locale={ptBR} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label htmlFor="w-reason">Motivo da Advertência *</Label>
            <Textarea
              id="w-reason"
              placeholder="Descreva o motivo da advertência..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Previous Warnings & Absences */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            Histórico
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label className="text-sm font-medium">Advertências Anteriores</Label>
            <div className="mt-2 flex gap-2">
              <Input placeholder="Ex: Advertência em 04/03/2025" value={newWarning} onChange={(e) => setNewWarning(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem(previousWarnings, setPreviousWarnings, newWarning, setNewWarning)} className="flex-1" />
              <Button size="icon" variant="outline" onClick={() => addItem(previousWarnings, setPreviousWarnings, newWarning, setNewWarning)}><Plus className="h-4 w-4" /></Button>
            </div>
            {previousWarnings.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {previousWarnings.map((item, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 pr-1">{item}<button onClick={() => removeItem(previousWarnings, setPreviousWarnings, i)} className="ml-1 rounded-full hover:bg-muted p-0.5"><X className="h-3 w-3" /></button></Badge>
                ))}
              </div>
            )}
          </div>
          <Separator />
          <div>
            <Label className="text-sm font-medium">Faltas sem Justificativa</Label>
            <div className="mt-2 flex gap-2">
              <Input placeholder="Ex: 09/11/2024" value={newAbsence} onChange={(e) => setNewAbsence(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem(unjustifiedAbsences, setUnjustifiedAbsences, newAbsence, setNewAbsence)} className="flex-1" />
              <Button size="icon" variant="outline" onClick={() => addItem(unjustifiedAbsences, setUnjustifiedAbsences, newAbsence, setNewAbsence)}><Plus className="h-4 w-4" /></Button>
            </div>
            {unjustifiedAbsences.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {unjustifiedAbsences.map((item, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 pr-1">{item}<button onClick={() => removeItem(unjustifiedAbsences, setUnjustifiedAbsences, i)} className="ml-1 rounded-full hover:bg-muted p-0.5"><X className="h-3 w-3" /></button></Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-card/95 backdrop-blur-sm p-4 md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <Button onClick={handleGenerate} disabled={isGenerating} className="w-full gap-2 h-12 text-base font-semibold" size="lg">
          <Download className="h-5 w-5" />
          {isGenerating ? "Gerando..." : "Gerar Documento de Advertência"}
        </Button>
      </div>
    </div>
  );
}
