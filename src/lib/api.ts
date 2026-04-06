const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro de rede" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  auth: {
    login: (cnpj: string, password: string) =>
      request<{ company: { id: string; name: string; cnpj: string } }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ cnpj, password }),
      }),
  },

  employees: {
    list: (companyId: string) =>
      request<Array<{ id: string; name: string; cpf: string; pis: string | null; active: boolean; company_id: string; created_at: string }>>(
        `/employees?company_id=${companyId}`
      ),
    create: (data: { company_id: string; name: string; cpf: string; pis?: string | null }) =>
      request("/employees", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: { name?: string; cpf?: string; pis?: string | null; active?: boolean }) =>
      request(`/employees/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request(`/employees/${id}`, { method: "DELETE" }),
  },

  documents: {
    list: (companyId: string) =>
      request<Array<{
        id: string; document_type: string; employee_name: string; employee_cpf: string;
        employee_pis: string | null; company_name: string; company_cnpj: string; company_id: string | null;
        start_date: string | null; suspension_days: number | null; return_date: string | null;
        description: string | null; created_at: string;
      }>>(`/documents?company_id=${companyId}`),
    create: (data: Record<string, unknown>) =>
      request("/documents", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request(`/documents/${id}`, { method: "DELETE" }),
  },

  certificates: {
    list: (companyId: string, startDate?: string, endDate?: string) => {
      let url = `/certificates?company_id=${companyId}`;
      if (startDate) url += `&start_date=${startDate}`;
      if (endDate) url += `&end_date=${endDate}`;
      return request<Array<{
        id: string; company_id: string; employee_id: string; file_path: string;
        file_name: string; certificate_date: string; notes: string | null;
        created_at: string; employee_name?: string;
      }>>(url);
    },
    upload: async (formData: FormData) => {
      const res = await fetch(`${API_BASE}/certificates`, {
        method: "POST",
        body: formData,
      });
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
