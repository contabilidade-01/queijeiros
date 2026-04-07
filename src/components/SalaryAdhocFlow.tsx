import { useState, useEffect, useRef } from "react";
import { CalendarIcon, Check, X, RefreshCw } from "lucide-react";
import { format, startOfMonth, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  calculateAdhocSalary,
  formatBRL,
  parseMoneyBR,
  type PeriodMode,
  type AdhocSalaryResult,
} from "@/lib/calculateAdhocSalary";
import { toast } from "sonner";

type Step =
  | "employee_name"
  | "base_salary"
  | "period_mode"
  | "ref_month"
  | "worked_days_input"
  | "start_date_pick"
  | "absences"
  | "vale"
  | "outros"
  | "result";

interface Message {
  from: "bot" | "user";
  text: string;
}

export function SalaryAdhocFlow() {
  const { company } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<Step>("employee_name");

  const [employeeName, setEmployeeName] = useState("");
  const [baseSalaryRaw, setBaseSalaryRaw] = useState("");
  const [periodMode, setPeriodMode] = useState<PeriodMode | null>(null);
  const [refMonthStr, setRefMonthStr] = useState("");
  const [workedDays, setWorkedDays] = useState(1);
  const [startDateInMonth, setStartDateInMonth] = useState<Date | undefined>();
  const [faltaDates, setFaltaDates] = useState<Date[]>([]);
  const [valeRaw, setValeRaw] = useState("");
  const [outrosRaw, setOutrosRaw] = useState("");
  const [result, setResult] = useState<AdhocSalaryResult | null>(null);

  const addBot = (text: string) => setMessages((m) => [...m, { from: "bot", text }]);
  const addUser = (text: string) => setMessages((m) => [...m, { from: "user", text }]);

  useEffect(() => {
    addBot(
      "Cálculo de salário avulso (experiência / treino, sem cadastro obrigatório).\n\n" +
        "Indique o nome do funcionário para começar."
    );
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, step, result]);

  const refMonthDate = refMonthStr
    ? startOfMonth(parse(`${refMonthStr}-01`, "yyyy-MM-dd", new Date()))
    : undefined;

  const monthBounds = refMonthDate
    ? {
        start: startOfMonth(refMonthDate),
        end: new Date(refMonthDate.getFullYear(), refMonthDate.getMonth() + 1, 0),
      }
    : null;

  const submitName = () => {
    const n = employeeName.trim();
    if (n.length < 2) {
      toast.error("Nome muito curto");
      return;
    }
    addUser(n);
    addBot("Qual o salário base mensal (contratual), em reais?");
    setStep("base_salary");
  };

  const submitBaseSalary = () => {
    const v = parseMoneyBR(baseSalaryRaw);
    if (v == null || v <= 0) {
      toast.error("Informe um valor válido (ex.: 3000 ou 3.000,50)");
      return;
    }
    addUser(formatBRL(v));
    addBot(
      "Como calcular os dias do período?\n\n" +
        "• Dias trabalhados: você informa quantos dias pagar\n" +
        "• Início no mês: entrou em exercício no meio do mês de referência\n" +
        "• Mês fechado: 30 dias (descontando só as faltas marcadas)"
    );
    setStep("period_mode");
  };

  const selectMode = (mode: PeriodMode) => {
    setPeriodMode(mode);
    if (mode === "worked_days") {
      addUser("Dias trabalhados (informo a quantidade)");
    } else if (mode === "start_in_month") {
      addUser("Data de início no mês de referência");
    } else {
      addUser("Mês fechado (30 dias)");
    }
    addBot("Qual o mês de referência da folha? (ano-mês)");
    setStep("ref_month");
  };

  const submitRefMonth = () => {
    if (!refMonthStr || refMonthStr.length < 7) {
      toast.error("Selecione o mês de referência");
      return;
    }
    const label = format(parse(`${refMonthStr}-01`, "yyyy-MM-dd", new Date()), "MMMM/yyyy", { locale: ptBR });
    addUser(label.charAt(0).toUpperCase() + label.slice(1));
    if (periodMode === "worked_days") {
      addBot("Quantos dias de salário devem ser pagos nesse período? (1 a 31)");
      setStep("worked_days_input");
    } else if (periodMode === "start_in_month") {
      addBot("Em que dia o funcionário começou a trabalhar nesse mês?");
      setStep("start_date_pick");
    } else {
      addBot(
        "Marque os dias de falta (sem remuneração), se houver. Se não houver faltas, clique em Continuar."
      );
      setStep("absences");
    }
  };

  const submitWorkedDays = () => {
    const d = Math.min(31, Math.max(1, Math.floor(workedDays)));
    setWorkedDays(d);
    addUser(`${d} dia(s)`);
    addBot(
      "Marque no calendário os dias de falta a descontar (cada dia reduz um dia pago). Pode avançar sem marcar."
    );
    setStep("absences");
  };

  const submitStartDate = () => {
    if (!startDateInMonth) {
      toast.error("Escolha a data de início");
      return;
    }
    addUser(format(startDateInMonth, "dd/MM/yyyy", { locale: ptBR }));
    addBot("Marque os dias de falta a descontar, se houver. Pode avançar sem marcar.");
    setStep("absences");
  };

  const submitAbsences = () => {
    if (faltaDates.length > 0) {
      const txt = [...faltaDates]
        .sort((a, b) => a.getTime() - b.getTime())
        .map((d) => format(d, "dd/MM/yyyy", { locale: ptBR }))
        .join(", ");
      addUser(`Faltas: ${txt}`);
    } else {
      addUser("Sem faltas");
    }
    addBot(
      "Valor do desconto de vale transporte/alimentação (R$). Use 0 se não houver — digite 0 e confirme."
    );
    setStep("vale");
  };

  const submitVale = () => {
    const parsed = parseMoneyBR(valeRaw || "0");
    if (parsed == null) {
      toast.error("Valor de vale inválido");
      return;
    }
    addUser(formatBRL(parsed));
    addBot("Outros descontos (R$)? 0 se não houver.");
    setStep("outros");
  };

  const submitOutros = () => {
    const o = parseMoneyBR(outrosRaw || "0");
    if (o == null) {
      toast.error("Valor de outros descontos inválido");
      return;
    }
    addUser(formatBRL(o));

    if (!periodMode || !refMonthDate) {
      toast.error("Dados incompletos");
      return;
    }
    const base = parseMoneyBR(baseSalaryRaw);
    if (base == null) {
      toast.error("Salário base inválido");
      return;
    }

    const wd = Math.min(31, Math.max(1, Math.floor(workedDays)));
    const out = calculateAdhocSalary({
      salarioBase: base,
      modo: periodMode,
      diasTrabalhadosInformado: periodMode === "worked_days" ? wd : null,
      refMonth: refMonthDate,
      dataInicioNoMes: periodMode === "start_in_month" ? startDateInMonth ?? null : null,
      faltas: faltaDates,
      descontoVale: parseMoneyBR(valeRaw || "0") ?? 0,
      descontosOutros: o,
    });

    if (!out.ok) {
      toast.error(out.error);
      return;
    }
    setResult(out.data);
    const r = out.data;
    addBot(
      `**Resultado**\n` +
        `• Funcionário: ${employeeName.trim()}\n` +
        `• Valor/dia (base÷30): ${formatBRL(r.valorDia)}\n` +
        `• Dias brutos: ${r.diasBrutos}\n` +
        `• Faltas contadas: ${r.faltasCount}\n` +
        `• Dias líquidos: ${r.diasLiquidos}\n` +
        `• Bruto: ${formatBRL(r.bruto)}\n` +
        `• Vale: ${formatBRL(r.descontoVale)}\n` +
        `• Outros: ${formatBRL(r.descontosOutros)}\n` +
        `• **Líquido: ${formatBRL(r.liquido)}**\n\n` +
        `_Cálculo simplificado; confira com DP / contabilidade._`
    );
    if (company) {
      addBot(`Empresa: ${company.name}`);
    }
    setStep("result");
  };

  const resetNewCalculation = () => {
    setEmployeeName("");
    setBaseSalaryRaw("");
    setPeriodMode(null);
    setRefMonthStr("");
    setWorkedDays(1);
    setStartDateInMonth(undefined);
    setFaltaDates([]);
    setValeRaw("");
    setOutrosRaw("");
    setResult(null);
    setStep("employee_name");
    setMessages([{ from: "bot", text: "Novo cálculo. Indique o nome do funcionário." }]);
  };

  const isDateInRefMonth = (d: Date) =>
    monthBounds
      ? d >= monthBounds.start && d <= monthBounds.end
      : true;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.from === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line",
                msg.from === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              )}
            >
              {msg.text}
            </div>
          </div>
        ))}

        <div className="pt-2 pb-6">
          {step === "employee_name" && (
            <div className="flex gap-2">
              <Input
                placeholder="Nome completo do funcionário"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && submitName()}
              />
              <Button onClick={submitName}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === "base_salary" && (
            <div className="space-y-2">
              <Input
                placeholder="Ex.: 3000 ou 3.000,50"
                value={baseSalaryRaw}
                onChange={(e) => setBaseSalaryRaw(e.target.value)}
                inputMode="decimal"
              />
              <Button onClick={submitBaseSalary} className="w-full">
                Continuar
              </Button>
            </div>
          )}

          {step === "period_mode" && (
            <div className="flex flex-col gap-2">
              <Button onClick={() => selectMode("worked_days")} className="w-full">
                3.1 · Quantidade de dias trabalhados
              </Button>
              <Button onClick={() => selectMode("start_in_month")} variant="secondary" className="w-full">
                3.2 · Data de início no mês de referência
              </Button>
              <Button onClick={() => selectMode("closed_month")} variant="outline" className="w-full">
                3.3 · Mês fechado (30 dias)
              </Button>
            </div>
          )}

          {step === "ref_month" && (
            <div className="space-y-2">
              <Label className="text-xs">Mês de referência</Label>
              <Input
                type="month"
                value={refMonthStr}
                onChange={(e) => setRefMonthStr(e.target.value)}
              />
              <Button onClick={submitRefMonth} disabled={!refMonthStr} className="w-full">
                Continuar
              </Button>
            </div>
          )}

          {step === "worked_days_input" && (
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                max={31}
                value={workedDays}
                onChange={(e) => setWorkedDays(parseInt(e.target.value, 10) || 1)}
                className="flex-1"
              />
              <Button onClick={submitWorkedDays}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === "start_date_pick" && monthBounds && (
            <div className="space-y-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start", !startDateInMonth && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDateInMonth
                      ? format(startDateInMonth, "dd/MM/yyyy", { locale: ptBR })
                      : "Data de início no mês"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    defaultMonth={refMonthDate}
                    selected={startDateInMonth}
                    onSelect={(d) => d && isDateInRefMonth(d) && setStartDateInMonth(d)}
                    disabled={(d) => !isDateInRefMonth(d)}
                    locale={ptBR}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <Button onClick={submitStartDate} disabled={!startDateInMonth} className="w-full">
                Continuar
              </Button>
            </div>
          )}

          {step === "absences" && refMonthDate && (
            <div className="space-y-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {faltaDates.length > 0
                      ? `${faltaDates.length} falta(s) marcada(s)`
                      : "Marcar dias de falta (opcional)"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="multiple"
                    defaultMonth={refMonthDate}
                    selected={faltaDates}
                    onSelect={(dates) => setFaltaDates(dates || [])}
                    locale={ptBR}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {faltaDates.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {[...faltaDates]
                    .sort((a, b) => a.getTime() - b.getTime())
                    .map((d, i) => (
                      <Badge key={`${d.getTime()}-${i}`} variant="secondary" className="text-xs">
                        {format(d, "dd/MM/yyyy", { locale: ptBR })}
                        <X
                          className="h-3 w-3 ml-1 cursor-pointer"
                          onClick={() =>
                            setFaltaDates((prev) => prev.filter((x) => x.getTime() !== d.getTime()))
                          }
                        />
                      </Badge>
                    ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Dias marcados:{" "}
                {[...faltaDates]
                  .sort((a, b) => a.getTime() - b.getTime())
                  .map((d) => format(d, "dd/MM/yyyy", { locale: ptBR }))
                  .join(", ") || "—"}
              </p>
              <Button onClick={submitAbsences} className="w-full">
                Continuar
              </Button>
            </div>
          )}

          {step === "vale" && (
            <div className="space-y-2">
              <Input
                placeholder="0,00"
                value={valeRaw}
                onChange={(e) => setValeRaw(e.target.value)}
                inputMode="decimal"
              />
              <Button onClick={submitVale} className="w-full">
                Confirmar
              </Button>
            </div>
          )}

          {step === "outros" && (
            <div className="space-y-2">
              <Input
                placeholder="0,00"
                value={outrosRaw}
                onChange={(e) => setOutrosRaw(e.target.value)}
                inputMode="decimal"
              />
              <Button onClick={submitOutros} className="w-full">
                Calcular líquido
              </Button>
            </div>
          )}

          {step === "result" && result && (
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <p className="text-sm font-semibold">Resumo numérico</p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>Líquido: {formatBRL(result.liquido)}</li>
                <li>Bruto: {formatBRL(result.bruto)}</li>
              </ul>
              <Button variant="outline" className="w-full gap-2" onClick={resetNewCalculation}>
                <RefreshCw className="h-4 w-4" />
                Novo cálculo
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
