import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildPrompt(config: Record<string, unknown>): string {
  const parts: string[] = [];
  const gender = config.subject_gender === "masculino" ? "homem" : config.subject_gender === "feminino" ? "mulher" : "";
  const subjectDesc = (config.subject_description as string)?.trim() || "";
  if (gender || subjectDesc) parts.push(`Sujeito principal: ${[gender, subjectDesc].filter(Boolean).join(", ")}.`);
  const niche = (config.niche_project as string)?.trim();
  if (niche) parts.push(`Contexto/nicho: ${niche}. Objetivo: criativo de marca/ads.`);
  const env = (config.environment as string)?.trim();
  if (env) parts.push(`Ambiente: ${env}.`);
  const colors = [config.ambient_color, config.rim_light_color, config.fill_light_color].filter(Boolean) as string[];
  if (colors.length) parts.push(`Iluminação e cores: ${colors.join(", ")}.`);
  const shot = config.shot_type as string;
  const layoutPos = config.layout_position as string;
  if (shot) parts.push(`Enquadramento: ${shot}.`);
  if (layoutPos) parts.push(`Posição do sujeito: ${layoutPos}.`);
  if (config.text_enabled) parts.push("Espaço reservado para texto.");
  const attrs = (config.visual_attributes as Record<string, unknown>) || {};
  const tags = Array.isArray(attrs.style_tags) ? attrs.style_tags : [];
  if (tags.length) parts.push(`Estilo: ${tags.join(", ")}.`);
  if (attrs.sobriety != null) parts.push(`Tom visual: ${Number(attrs.sobriety) <= 50 ? "mais criativo" : "mais profissional"}.`);
  if (attrs.ultra_realistic) parts.push("Ultra realista.");
  if (attrs.blur_enabled) parts.push("Blur de fundo suave.");
  if (attrs.lateral_gradient_enabled) parts.push("Degradê lateral.");
  if (config.floating_elements_enabled && (config.floating_elements_text as string)?.trim()) {
    parts.push(`Elementos flutuantes: ${(config.floating_elements_text as string).trim()}.`);
  }
  const styleRefs = Array.isArray(config.style_reference_urls) ? config.style_reference_urls : [];
  const styleInstructions = Array.isArray(config.style_reference_instructions) ? config.style_reference_instructions as string[] : [];
  if (styleRefs.length > 0) {
    const perRef: string[] = [];
    for (let i = 0; i < styleRefs.length; i++) {
      const t = styleInstructions[i] != null ? String(styleInstructions[i]).trim() : "";
      if (t) perRef.push(`Referência ${i + 1}: copie ${t}.`);
      else perRef.push(`Referência ${i + 1}: reproduza o estilo visual geral.`);
    }
    if (perRef.length) parts.push("Das imagens de referência anexas: " + perRef.join(" ") + " A imagem gerada deve ser semelhante ao estilo enviado.");
    else parts.push("Copie e reproduza o estilo visual das imagens de referência anexas: cores, iluminação, composição e estética. A imagem gerada deve ser semelhante ao estilo que foi enviado.");
  }
  const logoUrl = (config.logo_url as string)?.trim();
  if (logoUrl) parts.push("Inclua a logo anexa na arte, em posição visível e adequada (ex.: canto inferior, junto ao texto ou à marca).");
  const dims = (config.dimensions as string) || "1:1";
  parts.push(`Formato: ${dims}. Safe area para texto.`);
  if ((config.additional_prompt as string)?.trim()) parts.push((config.additional_prompt as string).trim());
  return parts.filter(Boolean).join(" ");
}

const SUBJECT_FACE_INSTRUCTION =
  "Obrigatório: use sempre o rosto e a identidade da pessoa da(s) imagem(ns) de sujeito principal como rosto na imagem gerada. Mantenha a mesma pessoa. ";

const PLACEHOLDER_IMAGE = "https://placehold.co/1024x1024/1a1a2e/eee?text=NeuroDesign";

async function mockGenerate(_config: Record<string, unknown>, quantity: number): Promise<{ url: string }[]> {
  return Array.from({ length: Math.min(quantity, 5) }, () => ({ url: PLACEHOLDER_IMAGE }));
}

type Conn = { id: number; user_id: string; provider: string; api_key: string; api_url: string; default_model: string | null };

function getAspectRatio(dimensions: string): string {
  const d = (dimensions || "1:1").trim();
  if (d === "4:5" || d === "9:16" || d === "16:9") return d;
  return "1:1";
}

const STYLE_REFERENCE_INSTRUCTION =
  "Copie o estilo das imagens de referência anexas. A imagem gerada deve ser semelhante ao estilo enviado: reproduza cores, iluminação, composição e estética visual. ";

const LOGO_INSTRUCTION = "Inclua a logo anexa na arte, em posição visível e adequada (ex.: canto inferior, junto ao texto ou à marca). ";

async function generateWithOpenRouter(
  conn: Conn,
  prompt: string,
  quantity: number,
  dimensions: string,
  subjectImageUrls: string[] = [],
  styleReferenceUrls: string[] = [],
  styleInstruction?: string,
  logoUrl?: string
): Promise<{ url: string }[]> {
  const baseUrl = conn.api_url.replace(/\/$/, "");
  const url = `${baseUrl}/chat/completions`;
  const model = conn.default_model || "google/gemini-2.0-flash-exp:free";
  let textPrompt = prompt;
  if (subjectImageUrls.length > 0) textPrompt = SUBJECT_FACE_INSTRUCTION + textPrompt;
  if (styleReferenceUrls.length > 0) textPrompt = (styleInstruction || STYLE_REFERENCE_INSTRUCTION) + textPrompt;
  if (logoUrl?.trim()) textPrompt = LOGO_INSTRUCTION + textPrompt;
  const hasSubject = subjectImageUrls.length > 0;
  const hasStyle = styleReferenceUrls.length > 0;
  const hasLogo = !!(logoUrl?.trim());
  const content: unknown =
    hasSubject || hasStyle || hasLogo
      ? [
          { type: "text", text: textPrompt },
          ...subjectImageUrls.slice(0, 2).map((subjectUrl) => ({ type: "image_url" as const, image_url: { url: subjectUrl }, imageUrl: { url: subjectUrl } })),
          ...styleReferenceUrls.slice(0, 3).map((styleUrl) => ({ type: "image_url" as const, image_url: { url: styleUrl }, imageUrl: { url: styleUrl } })),
          ...(hasLogo ? [{ type: "image_url" as const, image_url: { url: logoUrl!.trim() }, imageUrl: { url: logoUrl!.trim() } }] : []),
        ]
      : textPrompt;
  const body: Record<string, unknown> = {
    model,
    messages: [{ role: "user", content }],
    modalities: ["image", "text"],
    stream: false,
    image_config: { aspect_ratio: getAspectRatio(dimensions) },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${conn.api_key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { images?: Array<{ type?: string; image_url?: { url?: string }; imageUrl?: { url?: string } }> } }>;
  };
  const message = data?.choices?.[0]?.message;
  const images = message?.images;
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error("A API não retornou imagens. Pode ser filtro de conteúdo ou limite do modelo. Tente outro prompt ou conexão.");
  }
  const urls: { url: string }[] = [];
  for (const img of images.slice(0, Math.min(quantity, 5))) {
    const urlStr = img.image_url?.url ?? img.imageUrl?.url;
    if (urlStr) urls.push({ url: urlStr });
  }
  if (urls.length === 0) throw new Error("A API não retornou imagens. Tente outro prompt ou conexão.");
  return urls;
}

async function fetchImageAsBase64(imageUrl: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const data = btoa(binary);
    const contentType = res.headers.get("content-type") || "";
    const mimeType = contentType.includes("png") ? "image/png" : contentType.includes("webp") ? "image/webp" : "image/jpeg";
    return { data, mimeType };
  } catch {
    return null;
  }
}

const ALLOWED_IMAGE_SIZES = ["1K", "2K", "4K"] as const;
function normalizeImageSize(raw: unknown): "1K" | "2K" | "4K" {
  const s = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  return ALLOWED_IMAGE_SIZES.includes(s as "1K" | "2K" | "4K") ? (s as "1K" | "2K" | "4K") : "1K";
}

async function generateWithGoogleGemini(
  conn: Conn,
  prompt: string,
  quantity: number,
  dimensions: string,
  imageSize: "1K" | "2K" | "4K",
  subjectImageUrls: string[] = [],
  styleReferenceUrls: string[] = [],
  styleInstruction?: string,
  logoUrl?: string
): Promise<{ url: string }[]> {
  const baseUrl = conn.api_url.replace(/\/$/, "");
  const model = conn.default_model || "gemini-2.5-flash-image";
  const url = `${baseUrl}/models/${model}:generateContent`;
  const aspectRatio = getAspectRatio(dimensions);
  let textPrompt = prompt;
  if (subjectImageUrls.length > 0) textPrompt = SUBJECT_FACE_INSTRUCTION + textPrompt;
  if (styleReferenceUrls.length > 0) textPrompt = (styleInstruction || STYLE_REFERENCE_INSTRUCTION) + textPrompt;
  if (logoUrl?.trim()) textPrompt = LOGO_INSTRUCTION + textPrompt;
  const urlsToFetch: string[] = [
    ...subjectImageUrls.slice(0, 2),
    ...styleReferenceUrls.slice(0, 3),
    ...(logoUrl?.trim() ? [logoUrl.trim()] : []),
  ];
  const fetchResults = await Promise.all(urlsToFetch.map(fetchImageAsBase64));
  const contentParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
  for (const img of fetchResults) {
    if (img) contentParts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
  }
  contentParts.push({ text: textPrompt });
  const body = {
    contents: [{ parts: contentParts }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: { aspectRatio, imageSize },
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": conn.api_key,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    promptFeedback?: { blockReason?: string };
    candidates?: Array<{
      finishReason?: string;
      content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> };
    }>;
  };
  const blockReason = data?.promptFeedback?.blockReason;
  if (blockReason && blockReason !== "BLOCK_REASON_UNSPECIFIED") {
    throw new Error("O prompt foi bloqueado pelo filtro de segurança. Tente outro texto ou remova referências sensíveis.");
  }
  const candidates = data?.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("A geração foi bloqueada ou não retornou resultado. Tente outro prompt ou referência.");
  }
  const firstCandidate = candidates[0];
  const finishReason = firstCandidate?.finishReason;
  if (finishReason === "SAFETY" || finishReason === "RECITATION" || finishReason === "BLOCKED") {
    throw new Error("A geração foi bloqueada (conteúdo sensível). Tente outro prompt ou referência.");
  }
  const parts = firstCandidate?.content?.parts;
  if (!Array.isArray(parts)) throw new Error("A API não retornou conteúdo de imagem. Tente outro prompt ou conexão.");
  const urls: { url: string }[] = [];
  for (const part of parts) {
    const inline = part.inlineData;
    if (inline?.data) {
      const mime = inline.mimeType || "image/png";
      urls.push({ url: `data:${mime};base64,${inline.data}` });
      if (urls.length >= Math.min(quantity, 5)) break;
    }
  }
  if (urls.length === 0) throw new Error("A API não retornou imagens. Pode ser filtro de conteúdo ou limite. Tente outro prompt ou conexão.");
  return urls;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { projectId, configId, config, userAiConnectionId, style_reference_only } = body as { projectId: string; configId?: string; config: Record<string, unknown>; userAiConnectionId?: string; style_reference_only?: boolean };

    if (!projectId || !config) {
      return new Response(JSON.stringify({ error: "projectId e config são obrigatórios" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: project, error: projectError } = await supabase.from("neurodesign_projects").select("id, owner_user_id").eq("id", projectId).single();
    if (projectError || !project || project.owner_user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Projeto não encontrado ou acesso negado" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const quantity = Math.min(Math.max(Number(config.quantity) || 1, 1), 5);
    const prompt = buildPrompt(config);
    const subjectImageUrls: string[] = Array.isArray(config.subject_image_urls)
      ? (config.subject_image_urls as string[]).filter((u): u is string => typeof u === "string" && u.length > 0).slice(0, 2)
      : [];
    const styleReferenceUrls: string[] = Array.isArray(config.style_reference_urls)
      ? (config.style_reference_urls as string[]).filter((u): u is string => typeof u === "string" && u.length > 0).slice(0, 3)
      : [];
    const styleInstructionsArr = Array.isArray(config.style_reference_instructions) ? (config.style_reference_instructions as string[]).slice(0, styleReferenceUrls.length) : [];
    const perRefParts: string[] = [];
    for (let i = 0; i < styleReferenceUrls.length; i++) {
      const t = styleInstructionsArr[i] != null ? String(styleInstructionsArr[i]).trim() : "";
      if (t) perRefParts.push(`Referência ${i + 1}: copie ${t}.`);
      else perRefParts.push(`Referência ${i + 1}: reproduza o estilo visual geral.`);
    }
    let styleInstruction = perRefParts.length > 0
      ? "Das imagens de referência anexas (na ordem): " + perRefParts.join(" ") + " A imagem gerada deve ser semelhante ao estilo enviado. "
      : undefined;
    if (style_reference_only === true && (styleInstruction || styleReferenceUrls.length > 0)) {
      const base = styleInstruction ?? STYLE_REFERENCE_INSTRUCTION;
      styleInstruction = base + " Use a referência apenas para estilo visual. Os textos, slogans e logos a exibir são os descritos no prompt abaixo; não copie o texto ou a marca das imagens de referência.";
    }
    const hasRef = styleReferenceUrls.length > 0;
    const hasSubject = subjectImageUrls.length > 0;
    const hasColors = [config.ambient_color, config.rim_light_color, config.fill_light_color].some((c) => typeof c === "string" && c.trim());
    let promptToUse = prompt;
    if (style_reference_only === true && (hasRef || hasSubject || hasColors)) {
      const priority = "Prioridade: use obrigatoriamente a referência de estilo, o sujeito principal (se fornecido) e as cores indicadas na geração. A imagem deve refletir essas configurações. ";
      if (styleInstruction) styleInstruction = priority + styleInstruction;
      else promptToUse = priority + prompt;
    }
    const logoUrl = (config.logo_url && typeof config.logo_url === "string" && config.logo_url.trim()) ? config.logo_url.trim() : undefined;

    if (!promptToUse || !promptToUse.trim()) {
      return new Response(
        JSON.stringify({ error: "O prompt está vazio. Preencha a descrição da imagem ou conecte nós com contexto." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let providerLabel = "mock";
    const runInsert = {
      project_id: projectId,
      config_id: configId || null,
      type: "generate",
      status: "running",
      provider: providerLabel,
      provider_request_json: { prompt, config: { ...config, subject_image_urls: undefined, scenario_photo_urls: undefined, style_reference_urls: undefined, logo_url: undefined } },
    };
    const { data: run, error: runError } = await supabase.from("neurodesign_generation_runs").insert(runInsert).select("id").single();
    if (runError || !run) {
      return new Response(JSON.stringify({ error: runError?.message || "Erro ao criar run" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let images: { url: string }[] = [];
    try {
      if (userAiConnectionId) {
        const { data: conn } = await supabase.from("user_ai_connections").select("id, user_id, provider, api_key, api_url, default_model").eq("id", userAiConnectionId).single();
        if (conn && conn.user_id === user.id && conn.api_key) {
          const apiUrl = (conn.api_url || "").toLowerCase();
          try {
            if (apiUrl.includes("openrouter")) {
              providerLabel = "openrouter";
              images = await generateWithOpenRouter(conn as Conn, promptToUse, quantity, (config.dimensions as string) || "1:1", subjectImageUrls, styleReferenceUrls, styleInstruction, logoUrl);
            } else if (apiUrl.includes("generativelanguage") || conn.provider?.toLowerCase() === "google") {
              providerLabel = "google";
              const imageSize = normalizeImageSize(config.image_size);
              images = await generateWithGoogleGemini(conn as Conn, promptToUse, quantity, (config.dimensions as string) || "1:1", imageSize, subjectImageUrls, styleReferenceUrls, styleInstruction, logoUrl);
            }
          } catch (apiErr) {
            await supabase.from("neurodesign_generation_runs").update({ error_message: String(apiErr), completed_at: new Date().toISOString() }).eq("id", run.id);
            images = await mockGenerate(config, quantity);
            providerLabel = "mock_fallback";
          }
        }
      }
      if (images.length === 0) images = await mockGenerate(config, quantity);
    } catch (e) {
      await supabase.from("neurodesign_generation_runs").update({ status: "error", error_message: String(e), completed_at: new Date().toISOString() }).eq("id", run.id);
      return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const imageRows = images.map((img) => ({
      run_id: run.id,
      project_id: projectId,
      url: img.url,
      thumbnail_url: img.url,
      width: 1024,
      height: 1024,
    }));
    const { data: insertedImages, error: insertError } = await supabase
      .from("neurodesign_generated_images")
      .insert(imageRows)
      .select("id, run_id, project_id, url, thumbnail_url, width, height");

    if (insertError) {
      await supabase
        .from("neurodesign_generation_runs")
        .update({ status: "error", error_message: insertError.message, completed_at: new Date().toISOString() })
        .eq("id", run.id);
      return new Response(
        JSON.stringify({ error: "Erro ao salvar imagens: " + insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase.from("neurodesign_generation_runs").update({
      status: "success",
      provider: providerLabel,
      error_message: null,
      provider_response_json: { images: insertedImages },
      completed_at: new Date().toISOString(),
    }).eq("id", run.id);

    const { data: toKeep } = await supabase.from("neurodesign_generated_images").select("id").eq("project_id", projectId).order("created_at", { ascending: false }).range(0, 4);
    const keepSet = new Set((toKeep || []).map((r) => r.id));
    const { data: all } = await supabase.from("neurodesign_generated_images").select("id").eq("project_id", projectId);
    const idsToDelete = (all || []).filter((r) => !keepSet.has(r.id)).map((r) => r.id);
    if (idsToDelete.length > 0) await supabase.from("neurodesign_generated_images").delete().in("id", idsToDelete);

    const payload = insertedImages?.length
      ? insertedImages
      : imageRows.map((r) => ({ run_id: run.id, project_id: projectId, url: r.url, thumbnail_url: r.url, width: 1024, height: 1024 }));
    return new Response(JSON.stringify({ runId: run.id, images: payload }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
