import { useState, useCallback } from "react";

interface CompanySession {
  id: string;
  name: string;
  cnpj: string;
  token: string;
}

const STORAGE_KEY = "company_session";

export function useAuth() {
  const [company, setCompany] = useState<CompanySession | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((companyData: CompanySession) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(companyData));
    setCompany(companyData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCompany(null);
  }, []);

  return { company, isLoggedIn: !!company, login, logout };
}
