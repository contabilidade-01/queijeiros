const API_BASE = import.meta.env.VITE_API_URL || "/api";

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

export const api = {
  auth: {
    login: (cnpj: string, password: string) =>
      request<{ token: string; company: { id: string; name: string; cnpj: string } }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ cnpj, password }),
      }),
  },

  employees: {
    // No need for companyId param - server extracts from JWT
    list: (_companyId?: string) =>
      request<Array<{ id: string; name: string; cpf: string; pis: string | null; active: boolean; company_id: string; created_at: string }>>(
        `/employees`
      ),
    create: (data: { company_id?: string; name: string; cpf: string; pis?: string | null; active?: boolean }) =>
      request("/employees", { method: "POST", body: JSON.stringify(data) }),
    import: (
      rows: Array<{ name: string; cpf: string; pis?: string | null; active?: boolean }>,
      fileCnpj: string
    ) =>
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
    list: (_companyId?: string) =>
      request<Array<{
        id: string; document_type: string; employee_name: string; employee_cpf: string;
        employee_pis: string | null; company_name: string; company_cnpj: string; company_id: string | null;
        start_date: string | null; suspension_days: number | null; return_date: string | null;
        description: string | null; created_at: string;
      }>>(`/documents`),
    create: (data: Record<string, unknown>) =>
      request("/documents", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request(`/documents/${id}`, { method: "DELETE" }),
  },

  certificates: {
    list: (_companyId?: string, startDate?: string, endDate?: string) => {
      let url = `/certificates`;
      const params: string[] = [];
      if (startDate) params.push(`start_date=${startDate}`);
      if (endDate) params.push(`end_date=${endDate}`);
      if (params.length) url += `?${params.join("&")}`;
      return request<Array<{
        id: string; company_id: string; employee_id: string; file_path: string;
        file_name: string; certificate_date: string; notes: string | null;
        created_at: string; employee_name?: string;
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
