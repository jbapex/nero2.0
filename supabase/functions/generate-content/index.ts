/**
 * Edge Function: generate-content
 * Geração de conteúdo por módulo (fallback quando generic-ai-chat não está disponível).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();
    if (!user) {
      const message = !authHeader
        ? "Authorization header required"
        : userError?.message?.toLowerCase().includes("jwt")
          ? "Token inválido ou expirado. Faça login novamente."
          : "Não autorizado. Faça login novamente.";
      return new Response(
        JSON.stringify({ error: message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const moduleId = body.module_id;
    const clientId = body.client_id ?? null;
    const campaignData = body.campaign_data ?? null;
    const userText = (body.user_text as string) || "Gerar conteúdo.";

    if (!moduleId) {
      return new Response(
        JSON.stringify({ error: "module_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: module, error: modError } = await supabase
      .from("modules")
      .select("id, name, base_prompt")
      .eq("id", moduleId)
      .single();

    if (modError || !module) {
      return new Response(
        JSON.stringify({ error: "Módulo não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: connList } = await supabase
      .from("user_ai_connections")
      .select("id, api_key, api_url, default_model")
      .eq("user_id", user.id);
    let conn = Array.isArray(connList) && connList.length > 0 ? connList[0] : null;
    if (!conn) {
      const { data: globalList } = await supabase
        .from("llm_integrations")
        .select("id, api_key, api_url, default_model")
        .limit(1);
      conn = Array.isArray(globalList) && globalList.length > 0 ? globalList[0] : null;
    }

    if (!conn?.api_key || !conn?.api_url) {
      return new Response(
        JSON.stringify({
          error: "Nenhuma conexão de IA configurada. Configure em Minha IA.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiUrl = (conn.api_url as string).trim().replace(/\/$/, "");
    const model = (conn.default_model as string) || "gpt-4o-mini";
    const chatUrl = apiUrl.includes("/v1") ? `${apiUrl}/chat/completions` : `${apiUrl}/v1/chat/completions`;

    const contextParts: string[] = [];
    if (module.name) contextParts.push(`Módulo: ${module.name}`);
    if (campaignData) contextParts.push(`Campanha: ${JSON.stringify(campaignData)}`);
    const contextHeader = contextParts.length ? `[CONTEXTO]\n${contextParts.join("\n")}\n\n` : "";
    const userMessage = `${contextHeader}${userText}`;

    const messages: { role: string; content: string }[] = [];
    if (module.base_prompt) {
      messages.push({ role: "system", content: module.base_prompt });
    }
    messages.push({ role: "user", content: userMessage });

    const res = await fetch(chatUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${conn.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, stream: false }),
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(
        JSON.stringify({
          error: `API de IA retornou erro: ${res.status}`,
          details: text.slice(0, 500),
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const generatedText = data?.choices?.[0]?.message?.content ?? "";

    let outputId: number | null = null;
    if (generatedText) {
      const { data: insertData } = await supabase
        .from("agent_outputs")
        .insert({
          user_id: user.id,
          module_id: parseInt(String(moduleId), 10),
          campaign_id: campaignData?.id ?? null,
          generated_text: generatedText,
          is_favorited: false,
        })
        .select("id")
        .single();
      if (insertData?.id) outputId = insertData.id;
    }

    return new Response(
      JSON.stringify({ generatedText, outputId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
