# Criador de Site

Ferramenta para criar e editar landing pages por **conversa com a IA** (Horizons) e/ou **edição direta de HTML**, com preview em tempo real.

## Onde acessar

- **Menu:** Ferramentas → Criador de Site
- **URL (usuário):** `/ferramentas/criador-de-site` (lista de projetos) e `/ferramentas/criador-de-site/:projectId` (editor)
- **Dados:** tabela `site_projects` (campos principais: `user_id`, `name`, `html_content`, `chat_history`, `page_structure`, `updated_at`)
- **Preview público:** `/site-preview/:projectId` — exibe o site final. Usa `page_structure` quando existir (projetos criados no Fluxo Criativo); caso contrário usa `html_content` (projetos criados em Ferramentas → Criador de Site).

## Fluxo

1. **Chat com IA (aba "Chat com IA")**
   - O usuário vê o histórico de mensagens (`chat_history`) e digita novas mensagens.
   - Ao enviar, o sistema chama a Edge Function `generic-ai-chat` com contexto `site_builder_chat` e um system prompt que identifica a IA como "Horizons", assistente de criação de sites.
   - A IA pode responder em texto e/ou devolver HTML em um bloco marcado (ex.: ` ```html ... ``` `). O front extrai esse HTML e aplica em `html_content`, atualizando o **preview** à direita e persistindo no projeto (`html_content`, `chat_history`).

2. **Edição manual (aba "Editar HTML")**
   - Textarea com o HTML da página. Alterações refletem no preview em tempo real.
   - Botão **Salvar** persiste apenas o `html_content` no projeto (sem alterar `chat_history`).

3. **Preview**
   - O painel à direita exibe o documento gerado (Tailwind + `html_content` em iframe). Qualquer atualização em `htmlContent` (via chat ou edição) é refletida imediatamente.

## Dependências

- **Conexão de LLM:** para usar o chat, o usuário deve configurar pelo menos uma conexão de modelo de linguagem em **Configurações → Minha IA** (conexões com capacidade `text_generation`). Se não houver conexão, o chat fica desabilitado e é exibida mensagem com link para Minha IA.
- **Edge Function:** `generic-ai-chat` (já usada por outros módulos: NeuroDesign Preencher campos, Copilot, etc.).

## Observação

- Novos projetos são criados com uma mensagem inicial do assistente no `chat_history`: "Olá! Sou Horizons, seu assistente de criação de sites. O que vamos construir hoje?"

## Modelo de dados e preview

- **Ferramenta do usuário** (esta página): grava em `html_content` e `chat_history`. Não usa `page_structure`.
- **Modal no Fluxo Criativo** (nó "Criador de Site"): grava em `page_structure` e `chat_history` (lista de módulos arrastáveis).
- A rota **Preview** (`/site-preview/:projectId`) exibe o site usando `page_structure` quando houver módulos; senão usa `html_content`, para que projetos criados em Ferramentas → Criador de Site apareçam corretamente.
