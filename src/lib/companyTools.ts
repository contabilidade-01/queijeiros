export const COMPANY_TOOL_KEYS = [
  "suspension",
  "warning",
  "chatbot",
  "salary_adhoc",
  "employees",
  "certificates",
  "history",
] as const;

export type CompanyToolKey = (typeof COMPANY_TOOL_KEYS)[number];

export type CompanyToolAccess = Record<CompanyToolKey, boolean>;

export const COMPANY_TOOL_LABELS: Record<CompanyToolKey, { title: string; description: string }> = {
  suspension: { title: "Suspensão", description: "Gerar termo de suspensão" },
  warning: { title: "Advertência", description: "Gerar termo de advertência" },
  chatbot: { title: "Assistente", description: "Gerar documentos via chatbot" },
  salary_adhoc: { title: "Salário avulso", description: "Cálculo proporcional (experiência / treino)" },
  employees: { title: "Funcionários", description: "Cadastro de funcionários" },
  certificates: { title: "Atestados", description: "Gestão de atestados médicos" },
  history: { title: "Histórico", description: "Documentos emitidos" },
};

export function defaultToolAccess(): CompanyToolAccess {
  return {
    suspension: true,
    warning: true,
    chatbot: true,
    salary_adhoc: true,
    employees: true,
    certificates: true,
    history: true,
  };
}

export function mergeClientToolAccess(raw: unknown): CompanyToolAccess {
  const base = defaultToolAccess();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const o = raw as Record<string, unknown>;
  for (const k of COMPANY_TOOL_KEYS) {
    if (Object.prototype.hasOwnProperty.call(o, k)) {
      base[k] = Boolean(o[k]);
    }
  }
  return base;
}

export function isToolAllowed(access: CompanyToolAccess | undefined, key: CompanyToolKey): boolean {
  if (!access) return true;
  return Boolean(access[key]);
}
