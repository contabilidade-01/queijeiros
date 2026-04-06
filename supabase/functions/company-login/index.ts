import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { cnpj, password } = await req.json();

    if (!cnpj || typeof cnpj !== "string" || !password || typeof password !== "string") {
      return new Response(
        JSON.stringify({ error: "CNPJ e senha são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (cnpj.length > 20 || password.length > 100) {
      return new Response(
        JSON.stringify({ error: "Dados inválidos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Normalize CNPJ: try raw input and formatted version
    const digits = cnpj.replace(/\D/g, "");
    const formatted = digits.length === 14
      ? `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
      : cnpj;

    // Try exact match first, then formatted
    let { data } = await supabaseAdmin
      .from("companies")
      .select("id, name, cnpj, password_hash")
      .eq("cnpj", cnpj)
      .single();

    if (!data && formatted !== cnpj) {
      const result = await supabaseAdmin
        .from("companies")
        .select("id, name, cnpj, password_hash")
        .eq("cnpj", formatted)
        .single();
      data = result.data;
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: "Empresa não encontrada" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify password using pgcrypto via RPC
    const { data: match } = await supabaseAdmin.rpc("verify_password", {
      _password: password,
      _hash: data.password_hash,
    });

    if (!match) {
      return new Response(
        JSON.stringify({ error: "Senha incorreta" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        company: { id: data.id, name: data.name, cnpj: data.cnpj },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Login error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
