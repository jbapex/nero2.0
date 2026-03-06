# Instalação local (repositório nero2.0)

Este projeto está disponível em: **https://github.com/jbapex/nero2.0**

## Pré-requisitos

- Node.js 18+
- npm ou pnpm
- Conta Supabase (para backend)

## Passos

### 1. Clonar o repositório

```bash
git clone https://github.com/jbapex/nero2.0.git
cd nero2.0
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais Supabase e outras chaves (OpenAI, etc.), conforme o README principal.

### 4. Banco de dados (Supabase local)

O repositório já inclui `supabase/migrations/` e `supabase/functions/`. Para rodar o Supabase localmente (Docker necessário):

```bash
# Inicializar Supabase no projeto (cria config.toml se não existir)
npx supabase init

# Subir containers locais (Postgres, Auth, etc.)
npx supabase start

# Aplicar todas as migrações
npx supabase db push
```

Depois use as URL/keys que o `supabase start` mostrar no `.env.local` (API URL e anon key do projeto local).

**Supabase hospedado:** no dashboard do projeto, rode as migrações manualmente ou link com `supabase link` e use `supabase db push`.

### 5. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse em `http://localhost:3000`.

## Conteúdo essencial incluído

- Código fonte (React, Vite, componentes, páginas)
- Migrações do banco (`supabase/migrations/`)
- Edge Functions (`supabase/functions/`)
- Configurações (Vite, Tailwind, etc.)
- `.env.example` para variáveis de ambiente

## Scripts

- `npm run dev` – servidor de desenvolvimento
- `npm run build` – build de produção
- `npm run preview` – visualizar build de produção
