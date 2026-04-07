const API_BASE = import.meta.env.VITE_API_URL || "/api";

/** Rotas públicas (login, recuperação de senha): sem Bearer e sem redirecionar em 401 */
async function publicRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro de rede" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

function getToken(): string | null {
  try {
    const session = localStorage.getItem("company_session");
    if (!session) return null;
    const parsed = JSON.parse(session);
    return parsed.token || null;
  } catch {
    return null;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    // Token expired - clear session and redirect to login
    localStorage.removeItem("company_session");
    window.location.href = "/login";
    throw new Error("Sessão expirada");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro de rede" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export type LoginResponse =
  | { token: string; role: "admin"; admin: { id: string; cpf: string } }
  | { token: string; role: "company"; company: { id: string; name: string; cnpj: string } };

export const api = {
  auth: {
    login: (login: string, password: string) =>
      publicRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ login, password }),
      }),
    forgotPassword: (login: string, email: string) =>
      publicRequest<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ login, email }),
      }),
    checkResetToken: (token: string) =>
      publicRequest<{ valid: boolean }>(`/auth/reset-token?token=${encodeURIComponent(token)}`),
    resetPassword: (token: string, password: string) =>
      publicRequest<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      }),
  },

  admin: {
    summary: () =>
      request<{ companies: number; documents: number; employees: number; certificates: number }>(
        "/admin/summary"
      ),
    me: () =>
      request<{ id: string; cpf: string; contact_email: string | null }>("/admin/me"),
    updateMyContactEmail: (contact_email: string | null) =>
      request<{ ok: boolean; contact_email: string | null }>("/admin/me/contact-email", {
        method: "PATCH",
        body: JSON.stringify({ contact_email }),
      }),
    companies: () =>
      request<
        Array<{
          id: string;
          name: string;
          cnpj: string;
          contact_email: string | null;
          phone: string | null;
          created_at: string;
        }>
      >("/admin/companies"),
    createCompany: (data: {
      name: string;
      cnpj: string;
      contact_email?: string | null;
      phone?: string | null;
    }) =>
      request<{
        company: {
          id: string;
          name: string;
          cnpj: string;
          contact_email: string | null;
          phone: string | null;
          created_at: string;
        };
        message: string;
      }>("/admin/companies", { method: "POST", body: JSON.stringify(data) }),
    updateCompany: (
      companyId: string,
      data: { name?: string; contact_email?: string | null; phone?: string | null }
    ) =>
      request<{
        id: string;
        name: string;
        cnpj: string;
        contact_email: string | null;
        phone: string | null;
        created_at: string;
      }>(`/admin/companies/${companyId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  employees: {
    list: (opts?: { companyId?: string }) => {
      const q =
        opts?.companyId && opts.companyId.length
          ? `?company_id=${encodeURIComponent(opts.companyId)}`
          : "";
      return request<
        Array<{
          id: string;
          name: string;
          cpf: string;
          pis: string | null;
          active: boolean;
          company_id: string;
          created_at: string;
          company_name?: string;
          company_cnpj?: string;
        }>
      >(`/employees${q}`);
    },
    create: (data: { company_id?: string; name: string; cpf: string; pis?: string | null; active?: boolean }) =>
      request("/employees", { method: "POST", body: JSON.stringify(data) }),
    import: (rows: Array<{ name: string; cpf: string; pis?: string | null }>, fileCnpj: string) =>
      request<{ inserted: number; skipped: number; errors: Array<{ row: number; message: string }> }>("/employees/import", {
        method: "POST",
        body: JSON.stringify({ rows, fileCnpj }),
      }),
    update: (id: string, data: { name?: string; cpf?: string; pis?: string | null; active?: boolean }) =>
      request(`/employees/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request(`/employees/${id}`, { method: "DELETE" }),
  },

  documents: {
    list: (opts?: { companyId?: string }) => {
      const q =
        opts?.companyId && opts.companyId.length
          ? `?company_id=${encodeURIComponent(opts.companyId)}`
          : "";
      return request<Array<{
        id: string; document_type: string; employee_name: string; employee_cpf: string;
        employee_pis: string | null; company_name: string; company_cnpj: string; company_id: string | null;
        start_date: string | null; suspension_days: number | null; return_date: string | null;
        description: string | null; created_at: string;
      }>>(`/documents${q}`);
    },
    create: (data: Record<string, unknown>) =>
      request("/documents", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request(`/documents/${id}`, { method: "DELETE" }),
  },

  certificates: {
    list: (opts?: { companyId?: string; startDate?: string; endDate?: string }) => {
      let url = `/certificates`;
      const params: string[] = [];
      const companyId = opts?.companyId;
      if (companyId && companyId.length) params.push(`company_id=${encodeURIComponent(companyId)}`);
      if (opts?.startDate) params.push(`start_date=${opts.startDate}`);
      if (opts?.endDate) params.push(`end_date=${opts.endDate}`);
      if (params.length) url += `?${params.join("&")}`;
      return request<Array<{
        id: string; company_id: string; employee_id: string; file_path: string;
        file_name: string; certificate_date: string; notes: string | null;
        created_at: string; employee_name?: string; company_name?: string; company_cnpj?: string;
      }>>(url);
    },
    upload: async (formData: FormData) => {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/certificates`, {
        method: "POST",
        body: formData,
        headers,
      });
      if (res.status === 401) {
        localStorage.removeItem("company_session");
        window.location.href = "/login";
        throw new Error("Sessão expirada");
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro de rede" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return res.json();
    },
    delete: (id: string) =>
      request(`/certificates/${id}`, { method: "DELETE" }),
    fileUrl: (filePath: string) => `${API_BASE}/certificates/file/${filePath}`,
  },
};
