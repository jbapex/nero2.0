/**
 * Config padrão do Neuro Designer.
 * Usado pelo BuilderPanel, Gerador de Imagem (fluxo) e Carrossel para enviar
 * uma config completa à API e obter o mesmo prompt estruturado (sujeito, nicho,
 * ambiente, cores, enquadramento, estilo, referências, logo, formato).
 */
export function neuroDesignDefaultConfig() {
  return {
    user_ai_connection_id: null,
    subject_gender: 'feminino',
    subject_description: '',
    subject_image_urls: [],
    quantity: 1,
    layout_position: 'centro',
    dimensions: '1:1',
    text_enabled: false,
    headline_h1: '',
    subheadline_h2: '',
    cta_button_text: '',
    text_position: 'centro',
    text_gradient: false,
    logo_url: '',
    niche_project: '',
    environment: '',
    use_scenario_photos: false,
    scenario_photo_urls: [],
    ambient_color: '',
    rim_light_color: '',
    fill_light_color: '',
    shot_type: 'medio busto',
    floating_elements_enabled: false,
    floating_elements_text: '',
    style_reference_urls: [],
    style_reference_instructions: [],
    visual_attributes: {
      sobriety: 50,
      style_tags: [],
      ultra_realistic: false,
      blur_enabled: false,
      lateral_gradient_enabled: false,
    },
    additional_prompt: '',
    image_size: '1K',
  };
}
