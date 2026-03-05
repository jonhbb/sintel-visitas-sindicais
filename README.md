# SINTEL - Sistema de Visitas Sindicais

Sistema de gerenciamento de visitas sindicais a empresas.

## Funcionalidades

- **Autenticação** — Login e cadastro de usuários
- **Dashboard** — Visão geral com métricas, gráficos e próximas visitas
- **Gestão de Visitas** — Criar, editar, excluir e filtrar visitas
- **Relatórios** — Visualização de dados com exportação CSV

## Tecnologias

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Auth + PostgreSQL com Row Level Security)
- **Gráficos:** Recharts
- **Formulários:** React Hook Form + Zod

## Como rodar localmente

Requisitos: Node.js 18+ e npm instalados.

```sh
# 1. Clone o repositório
git clone <URL_DO_REPOSITORIO>

# 2. Entre na pasta do projeto
cd union-visit-manager-main

# 3. Instale as dependências
npm install

# 4. Configure as variáveis de ambiente
# Copie o .env.example e preencha com suas credenciais do Supabase
cp .env.example .env

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

O app estará disponível em `http://localhost:8080`.

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run lint` | Verificação de lint |
| `npm run test` | Rodar testes |

## Variáveis de ambiente

Crie um arquivo `.env` na raiz com:

```
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_anon_aqui
```

## Deploy

O frontend é uma SPA estática. Após `npm run build`, a pasta `dist/` pode ser hospedada em qualquer serviço (Vercel, Netlify, etc.). Configure as variáveis de ambiente no serviço de hosting.
