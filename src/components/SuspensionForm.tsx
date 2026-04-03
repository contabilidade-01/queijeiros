import { useState } from "react";
import { Plus, X, Download, CalendarIcon, User, Building2, AlertTriangle } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { downloadSuspensionDoc, type SuspensionData } from "@/lib/generateSuspensionDoc";
import { toast } from "sonner";

export function SuspensionForm() {
  const [employeeName, setEmployeeName] = useState("");
  const [pis, setPis] = useState("");
  const [cpf, setCpf] = useState("");
  const [companyName, setCompanyName] = useState("RESTAURANTE DO QUEIJEIRO 3 LIMITADA");
  const [cnpj, setCnpj] = useState("52.191.264/0001-73");
  const [startDate, setStartDate] = useState<Date>();
  const [suspensionDays, setSuspensionDays] = useState(1);
  const [recentAbsenceDate, setRecentAbsenceDate] = useState("");
  
  // Dynamic lists
  const [previousWarnings, setPreviousWarnings] = useState<string[]>([]);
  const [previousSuspensions, setPreviousSuspensions] = useState<string[]>([]);
  const [unjustifiedAbsences, setUnjustifiedAbsences] = useState<string[]>([]);
  
  // Temp inputs for adding items
  const [newWarning, setNewWarning] = useState("");
  const [newSuspension, setNewSuspension] = useState("");
  const [newAbsence, setNewAbsence] = useState("");

  const endDate = startDate ? addDays(startDate, suspensionDays - 1) : null;
  const returnDate = endDate ? addDays(endDate, 1) : null;

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
    if (!employeeName || !startDate || !pis || !cpf) {
      toast.error("Preencha os campos obrigatórios: Nome, Data de início, PIS e CPF");
      return;
    }

    const data: SuspensionData = {
      employeeName,
      pis,
      cpf,
      companyName,
      cnpj,
      startDate,
      suspensionDays,
      previousWarnings,
      previousSuspensions,
      recentAbsenceDate,
      unjustifiedAbsences,
    };

    try {
      await downloadSuspensionDoc(data);
      toast.success("Documento gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar documento");
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
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              placeholder="Ex: João da Silva"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pis">PIS *</Label>
              <Input
                id="pis"
                placeholder="000.00000.00-0"
                value={pis}
                onChange={(e) => setPis(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                className="mt-1"
              />
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
            <Label htmlFor="company">Razão Social</Label>
            <Input
              id="company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Suspension Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarIcon className="h-4 w-4 text-primary" />
            Detalhes da Suspensão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data de Início *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "mt-1 w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? formatDateBR(startDate) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    locale={ptBR}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="days">Dias de Suspensão *</Label>
              <Input
                id="days"
                type="number"
                min={1}
                max={30}
                value={suspensionDays}
                onChange={(e) => setSuspensionDays(Math.max(1, parseInt(e.target.value) || 1))}
                className="mt-1"
              />
            </div>
          </div>

          {/* Auto-calculated fields */}
          {startDate && (
            <div className="rounded-lg bg-muted p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Período:</span>
                <span className="font-medium">{formatDateBR(startDate)} a {endDate && formatDateBR(endDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total de dias:</span>
                <span className="font-medium">{suspensionDays} dia{suspensionDays > 1 ? "s" : ""}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Retorno ao trabalho:</span>
                <span className="font-semibold text-primary">{returnDate && formatDateBR(returnDate)}</span>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="recent">Data da falta mais recente</Label>
            <Input
              id="recent"
              placeholder="Ex: 29 de maio de 2025"
              value={recentAbsenceDate}
              onChange={(e) => setRecentAbsenceDate(e.target.value)}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Warnings & Suspensions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-accent" />
            Histórico de Advertências
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Previous Suspensions */}
          <div>
            <Label className="text-sm font-medium">Suspensões Anteriores</Label>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Ex: 04/03/2025"
                value={newSuspension}
                onChange={(e) => setNewSuspension(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem(previousSuspensions, setPreviousSuspensions, newSuspension, setNewSuspension)}
                className="flex-1"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => addItem(previousSuspensions, setPreviousSuspensions, newSuspension, setNewSuspension)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {previousSuspensions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {previousSuspensions.map((item, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 pr-1">
                    {item}
                    <button onClick={() => removeItem(previousSuspensions, setPreviousSuspensions, i)} className="ml-1 rounded-full hover:bg-muted p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Previous Warnings */}
          <div>
            <Label className="text-sm font-medium">Advertências Anteriores</Label>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Ex: Advertência verbal"
                value={newWarning}
                onChange={(e) => setNewWarning(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem(previousWarnings, setPreviousWarnings, newWarning, setNewWarning)}
                className="flex-1"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => addItem(previousWarnings, setPreviousWarnings, newWarning, setNewWarning)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {previousWarnings.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {previousWarnings.map((item, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 pr-1">
                    {item}
                    <button onClick={() => removeItem(previousWarnings, setPreviousWarnings, i)} className="ml-1 rounded-full hover:bg-muted p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Unjustified Absences */}
          <div>
            <Label className="text-sm font-medium">Faltas sem Justificativa</Label>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Ex: 09/11/2024"
                value={newAbsence}
                onChange={(e) => setNewAbsence(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem(unjustifiedAbsences, setUnjustifiedAbsences, newAbsence, setNewAbsence)}
                className="flex-1"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => addItem(unjustifiedAbsences, setUnjustifiedAbsences, newAbsence, setNewAbsence)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {unjustifiedAbsences.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {unjustifiedAbsences.map((item, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 pr-1">
                    {item}
                    <button onClick={() => removeItem(unjustifiedAbsences, setUnjustifiedAbsences, i)} className="ml-1 rounded-full hover:bg-muted p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generate Button - Fixed at bottom on mobile */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-card/95 backdrop-blur-sm p-4 md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <Button
          onClick={handleGenerate}
          className="w-full gap-2 h-12 text-base font-semibold"
          size="lg"
        >
          <Download className="h-5 w-5" />
          Gerar Documento de Suspensão
        </Button>
      </div>
    </div>
  );
}
