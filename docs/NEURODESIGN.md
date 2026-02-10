# NeuroDesign (Design Builder)

Módulo premium de criação de imagens com controle de composição: sujeito, cenário, texto, cores e estilo.

## Dependências

- **Conexões de Geração de Imagem**: o NeuroDesign usa as mesmas conexões configuradas em **Configurações > Minha IA > Conexões de Imagem** (Google, OpenRouter, etc.). O usuário escolhe uma conexão no builder; a Edge Function usa as credenciais no servidor para chamar a API. Se não houver conexão, é usado um **MockProvider** (imagens placeholder) para validar o fluxo.

## Configuração no Supabase

### 1. Tabelas e RLS

Execute o SQL em **Supabase > SQL Editor** (ou via CLI):

```bash
# Caminho do arquivo de migração
supabase/migrations/neurodesign_schema.sql
```

Isso cria as tabelas `neurodesign_projects`, `neurodesign_configs`, `neurodesign_generation_runs`, `neurodesign_generated_images` e as políticas RLS.

### 2. Storage bucket

Crie um bucket no **Supabase > Storage**:

- Nome: `neurodesign`
- Público: sim (para URLs públicas das imagens) ou use signed URLs se preferir
- Políticas: permitir `INSERT` e `SELECT` para usuários autenticados no prefixo `{user_id}/`

Exemplo de política (Storage > Policies):

- **INSERT**: `auth.uid()::text = (storage.foldername())[1]`
- **SELECT**: `auth.uid()::text = (storage.foldername())[1]`

### 3. Edge Functions

Implante as funções:

```bash
supabase functions deploy neurodesign-generate
supabase functions deploy neurodesign-refine
```

As funções usam `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (já definidos no projeto). O JWT do usuário é enviado pelo client no header `Authorization`.

## Permissão de acesso

O módulo usa `permissionKey: 'neurodesign'`, que corresponde a `has_neurodesign_access` no perfil do usuário (herdado do plano).

1. **Coluna no plano**: a tabela `plans` deve ter a coluna `has_neurodesign_access` (boolean). Execute a migração `supabase/migrations/plans_add_neurodesign_access.sql` no SQL Editor se ainda não existir.
2. **Super Admin > Planos**: em Gerenciamento de Planos, ao criar ou editar um plano, marque **NeuroDesign** na seção "Suíte de Ferramentas". Os usuários desse plano passarão a ter acesso ao NeuroDesign na página de Ferramentas.
3. Se a RPC `get_or_create_profile` (ou a view que alimenta o perfil) retornar os campos do plano, inclua `has_neurodesign_access` no retorno para que `hasPermission('neurodesign')` funcione corretamente.

Usuários sem a permissão verão o card na página de Ferramentas mas receberão "Acesso Restrito" ao clicar.

## Rotas

- **Página**: `/ferramentas/neurodesign` (protegida por `ProtectedRoute` e `permissionKey="neurodesign"`).

## Fluxo

1. Usuário cria/seleciona um projeto na sidebar.
2. Em "Criar", preenche o builder (sujeito, dimensões, texto, cenário, cores, estilo, etc.) e escolhe uma conexão de imagem (opcional).
3. Clica em "Gerar Imagem". A Edge Function `neurodesign-generate` monta o prompt, chama o provider (conexão do usuário ou Mock) e persiste a run e as imagens.
4. As imagens aparecem no preview e na galeria. O usuário pode "Refinar" com uma instrução de ajuste (Edge Function `neurodesign-refine`).
5. "Minha Galeria" lista as imagens do projeto com seleção múltipla e download.

## Provider real (Conexões de Imagem)

Na Edge Function `neurodesign-generate`, quando `userAiConnectionId` é enviado e a conexão existe e pertence ao usuário, está preparado para chamar a API real:

- **Google**: usar `api_url` e `default_model` da conexão; chamar a API de geração de imagem do Gemini (mesmo fluxo do Gerador de Imagens do sistema).
- **OpenRouter**: usar `api_url` (https://openrouter.ai/api/v1), endpoint `chat/completions` com `modalities: ["image","text"]`, modelo `default_model`, prompt no conteúdo da mensagem.

Atualmente a função usa o MockProvider (placeholder) para todas as requisições; a integração com as APIs reais pode ser concluída conforme a documentação de cada provedor.
