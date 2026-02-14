# Neuro Apice

Sistema de gestão e automação de marketing digital com inteligência artificial.

## 🚀 Funcionalidades

- **Chat com IA**: Interface de conversação com modelos de linguagem
- **Análise de Dados**: Upload e análise de arquivos CSV com visualizações
- **Construtor de Campanhas**: Criação de campanhas de marketing estruturadas
- **Construtor de Fluxos**: Editor visual para fluxos de trabalho
- **Calendário de Publicações**: Planejamento e agendamento de conteúdo
- **Centro de Mídia**: Download e transcrição de vídeos
- **Construtor de Sites**: Criação de sites com IA
- **Planejador Estratégico**: Ferramentas de planejamento estratégico
- **Gestão de Clientes**: Sistema completo de CRM

## 🛠️ Tecnologias

- **Frontend**: React 18, Vite
- **UI**: Tailwind CSS, Radix UI
- **Backend**: Supabase
- **IA**: OpenAI, Google Generative AI
- **Outros**: React Router, Framer Motion, React Flow

## 📦 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/neuro-apice.git
cd neuro-apice
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
# Edite o arquivo .env.local com suas credenciais
```

4. Execute o projeto:
```bash
npm run dev
```

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Visualiza o build de produção

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ai-chat/        # Chat com IA
│   ├── analyzer/       # Análise de dados
│   ├── campaign-builder/ # Construtor de campanhas
│   ├── flow-builder/   # Construtor de fluxos
│   ├── publication-calendar/ # Calendário
│   ├── media-center/   # Centro de mídia
│   ├── site-builder/   # Construtor de sites
│   ├── strategic-planner/ # Planejador estratégico
│   └── ui/             # Componentes de UI base
├── contexts/           # Contextos React
├── hooks/              # Hooks customizados
├── lib/                # Utilitários e configurações
└── pages/              # Páginas da aplicação
```

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env.local` com as seguintes variáveis:

```env
# Produção: Neuro em neuro.jbapex.com.br, Supabase em dados.jbapex.com.br
VITE_SUPABASE_URL=https://dados.jbapex.com.br
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
VITE_OPENAI_API_KEY=sua_chave_da_openai
VITE_GOOGLE_AI_API_KEY=sua_chave_do_google_ai
```

**Auth (login):** No Supabase (dados.jbapex.com.br), adicione `https://neuro.jbapex.com.br/**` em *Redirect URLs* (Auth → URL Configuration) para o login funcionar.

## 📄 Licença

Este projeto é privado e proprietário.

## 🤝 Contribuição

Para contribuir com o projeto, entre em contato com a equipe de desenvolvimento.

---

Desenvolvido com ❤️ pela equipe Neuro Apice
