# Instalação local (repositório queben-a)

Este projeto está disponível em: **https://github.com/jbapex/queben-a**

## Pré-requisitos

- Node.js 18+
- npm ou pnpm
- Conta Supabase (para backend)

## Passos

### 1. Clonar o repositório

```bash
git clone https://github.com/jbapex/queben-a.git
cd queben-a
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

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse em `http://localhost:3000`.

### 5. (Opcional) Supabase local

Para rodar migrações e Edge Functions localmente:

```bash
npx supabase start
npx supabase db push
```

## Scripts

- `npm run dev` – servidor de desenvolvimento
- `npm run build` – build de produção
- `npm run preview` – visualizar build de produção
