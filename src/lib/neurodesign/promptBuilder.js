/**
 * Monta o prompt estruturado para geração de imagem a partir da DesignConfig.
 * Usado pela Edge Function; o client envia a config e a EF chama buildPrompt.
 * Não exibir o prompt final na UI (apenas salvar em provider_request_json para debug).
 *
 * @param {Object} config - DesignConfig do builder
 * @returns {string} prompt único para o provider
 */
export function buildPrompt(config) {
  if (!config) return '';

  const parts = [];
  const textBlockParts = [];

  // TEXTO NA IMAGEM: bloco prioritário no início (modelos de imagem precisam ver isso primeiro)
  if (config.text_enabled) {
    const h1 = (config.headline_h1 || '').trim();
    const h2 = (config.subheadline_h2 || '').trim();
    const cta = (config.cta_button_text || '').trim();
    const textPos = (config.text_position || '').trim() || 'centro';
    if (h1 || h2 || cta) {
      const textLines = [];
      if (h1) textLines.push(`Título em destaque: "${h1}"`);
      if (h2) textLines.push(`Subtítulo: "${h2}"`);
      if (cta) textLines.push(`Botão: "${cta}"`);
      textBlockParts.push(
        'OBRIGATÓRIO - TEXTO VISÍVEL NA IMAGEM: A arte deve exibir este texto de forma clara e legível, sem alterar uma letra: ' +
        textLines.join('. ') + '. Posição do texto: ' + textPos + '.'
      );
      if (config.text_gradient) textBlockParts.push('O texto deve ter efeito de gradiente (degradê nas letras).');
    } else {
      textBlockParts.push('Espaço reservado para texto na composição. Posição: ' + textPos + '.');
    }
  }

  // Subject block
  const gender = config.subject_gender === 'masculino' ? 'homem' : config.subject_gender === 'feminino' ? 'mulher' : '';
  const subjectDesc = config.subject_description?.trim() || '';
  if (gender || subjectDesc) {
    parts.push(`Sujeito principal: ${[gender, subjectDesc].filter(Boolean).join(', ')}.`);
  }

  // Context block
  const niche = config.niche_project?.trim();
  if (niche) {
    parts.push(`Contexto/nicho: ${niche}. Objetivo: criativo de marca/ads.`);
  }

  // Scene block
  const env = config.environment?.trim();
  if (env) {
    parts.push(`Ambiente: ${env}.`);
  }
  const colors = [config.ambient_color, config.rim_light_color, config.fill_light_color].filter(Boolean);
  if (colors.length) {
    parts.push(`Iluminação e cores: luz ambiente e de recorte; ${colors.join(', ')}.`);
  }

  // Composition block
  const shot = config.shot_type || '';
  const layoutPos = config.layout_position || '';
  if (shot) parts.push(`Enquadramento: ${shot}.`);
  if (layoutPos) parts.push(`Posição do sujeito: ${layoutPos}.`);
  if (config.text_enabled) {
    parts.push('Espaço reservado para texto na composição.');
    const h1 = (config.headline_h1 || '').trim();
    const h2 = (config.subheadline_h2 || '').trim();
    const cta = (config.cta_button_text || '').trim();
    if (h1 || h2 || cta) {
      parts.push('O texto exibido na imagem deve ser exatamente: ' + [h1, h2, cta].filter(Boolean).map(t => `"${t}"`).join(', ') + '.');
      const textPos = (config.text_position || '').trim();
      if (textPos) parts.push(`Posição do texto na imagem: ${textPos}.`);
      if (config.text_gradient) parts.push('O texto na imagem deve ter efeito de gradiente (degradê nas letras), visível e aplicado ao título e subtítulo.');
    }
  }

  // Style block
  const attrs = config.visual_attributes || {};
  const tags = Array.isArray(attrs.style_tags) ? attrs.style_tags : [];
  if (tags.length) parts.push(`Estilo: ${tags.join(', ')}.`);
  if (attrs.sobriety != null) {
    parts.push(`Tom visual: ${attrs.sobriety <= 50 ? 'mais criativo' : 'mais profissional'} (${attrs.sobriety}%).`);
  }
  if (attrs.ultra_realistic) parts.push('Ultra realista.');
  if (attrs.blur_enabled) parts.push('Blur de fundo suave.');
  if (attrs.lateral_gradient_enabled) parts.push('Degradê lateral.');

  // Floating elements
  if (config.floating_elements_enabled && config.floating_elements_text?.trim()) {
    parts.push(`Elementos flutuantes: ${config.floating_elements_text.trim()}.`);
  }

  // Format block
  const dims = config.dimensions || '1:1';
  const dimMap = { '9:16': 'stories 9:16', '16:9': 'horizontal 16:9', '1:1': 'feed 1:1', '4:5': 'feed 4:5' };
  parts.push(`Formato: ${dimMap[dims] || dims}. Safe area para texto respeitada.`);

  // Additional prompt
  if (config.additional_prompt?.trim()) {
    parts.push(config.additional_prompt.trim());
  }

  const mainPrompt = parts.filter(Boolean).join(' ');
  const textBlock = textBlockParts.filter(Boolean).join(' ');
  return textBlock ? textBlock + ' ' + mainPrompt : mainPrompt;
}
