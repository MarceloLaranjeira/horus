# Horus SaaS

Aplicacao React + Vite + Supabase para operacao pessoal/profissional com assistente IA e fluxo comercial self-service.

## Rotas principais

- `/` landing comercial
- `/onboarding` formulario de onboarding com checkout Asaas
- `/auth` autenticacao
- `/app` painel principal (protegido)

## Stack

- React + TypeScript + Vite
- Tailwind + shadcn/ui
- Supabase (Auth, Postgres, Edge Functions)
- Asaas (checkout/pagamentos)

## Desenvolvimento local

```bash
npm install
npm run dev
```

## Variaveis importantes

Frontend (`.env`):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Supabase Edge Function `asaas-checkout` (secrets):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ASAAS_ACCESS_TOKEN`
- `ASAAS_ENV` (`sandbox` ou `production`)
- `ASAAS_PRICE_STARTER` (opcional, default 197)
- `ASAAS_PRICE_PRO` (opcional, default 397)
- `ASAAS_PRICE_SCALE` (opcional, default 997)

## Banco de dados

A migration `20260305141000_add_saas_onboarding_leads.sql` adiciona a tabela `saas_onboarding_leads` para:

- registrar origem de leads (UTM)
- armazenar status de checkout
- auditar erros de cobranca

## Validacao

```bash
npm run lint
npm run build
npm run test
```
