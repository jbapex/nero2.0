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

### 4. Banco de dados (Supabase)

As migrações em `supabase/migrations/` contêm todo o schema essencial. Para aplicar:

**Supabase hospedado:** no dashboard do projeto, use SQL ou link do Supabase CLI.

**Supabase local:**

```bash
npx supabase start
npx supabase db push
```

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
