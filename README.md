# Marques Strategic Advisor — Next.js SaaS Upgrade

Migração do MVP em `index.html` para uma aplicação SaaS em Next.js + Supabase + Mercado Pago + Vercel + Gemini seguro no backend.

## O que foi implementado

- Landing page executiva responsiva.
- Catálogo de advisors executivos.
- Novos advisors: CEO, COO, Controller, Pricing, Supply Chain, Technology/AI, Risk & Compliance e PMO.
- Diagnóstico gratuito por advisor com captura de lead no Supabase.
- Login/cadastro via Supabase Auth.
- Cadastro de fornecedores/homologação inicial.
- Painel de advisors contratados.
- Chat com IA via API backend `/api/chat`, sem expor chave do Gemini no navegador.
- Checkout Mercado Pago em `/api/checkout/mercadopago`.
- Webhook Mercado Pago em `/api/webhooks/mercadopago` para liberar acesso ao advisor.
- Schema SQL completo do Supabase em `supabase/schema.sql`.

## Arquitetura

```txt
Vercel
└── Next.js App Router
    ├── app/page.tsx
    ├── app/api/chat/route.ts
    ├── app/api/checkout/mercadopago/route.ts
    ├── app/api/webhooks/mercadopago/route.ts
    ├── app/api/leads/route.ts
    ├── app/api/suppliers/route.ts
    └── app/api/contact/route.ts

Supabase
├── Auth
├── profiles
├── leads
├── suppliers
├── subscriptions
├── advisor_access
├── diagnostics
└── chat_messages
```

## Passo a passo para publicar

### 1. Substituir ou criar branch no GitHub

Copie os arquivos deste pacote para a raiz do repositório `6xfkrz24bb-sys/Marques_strategic_advisor`.

Recomendado:

```bash
git checkout -b nextjs-saas-upgrade
cp -R marques-strategic-advisor-next/* .
git add .
git commit -m "feat: migrate Marques Advisor to Next.js SaaS architecture"
git push origin nextjs-saas-upgrade
```

Depois abra um Pull Request para `main`.

### 2. Criar projeto no Supabase

1. Crie um projeto no Supabase.
2. Vá em SQL Editor.
3. Execute `supabase/schema.sql`.
4. Vá em Auth > Providers e configure e-mail/senha. Google/Apple podem ser ligados depois.
5. Copie a Project URL, Publishable Key e Secret Key.

### 3. Criar aplicação no Mercado Pago

1. Acesse Mercado Pago Developers.
2. Crie uma aplicação para Online Payments / Checkout Pro.
3. Copie o Access Token.
4. Configure o webhook apontando para:

```txt
https://SEU-DOMINIO/api/webhooks/mercadopago
```

### 4. Configurar variáveis na Vercel

No projeto da Vercel, configure:

```env
NEXT_PUBLIC_SITE_URL=https://seu-dominio.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SECRET_KEY=sb_secret_xxx
MERCADOPAGO_ACCESS_TOKEN=APP_USR_xxx
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.5-flash
NEXT_PUBLIC_DEMO_MODE=false
```

Caso sua conta Supabase ainda use chaves legadas, use:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```


### 4.1. Configurar autenticação Supabase

No painel do Supabase, em Authentication > URL Configuration, configure:

- **Site URL**: o mesmo valor de `NEXT_PUBLIC_SITE_URL`.
- **Redirect URLs**: inclua `https://seu-dominio.vercel.app/api/auth/callback` e os domínios customizados usados em produção.

O cadastro usa `NEXT_PUBLIC_SITE_URL` para montar o callback `/api/auth/callback`. Não coloque chaves reais ou `service_role` em variáveis públicas (`NEXT_PUBLIC_*`).

### 5. Rodar localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Observações importantes

- O pagamento Mercado Pago aqui libera acesso por 30 dias após pagamento aprovado. Para cobrança recorrente automática, a próxima etapa é integrar Mercado Pago Subscriptions/Preapproval ou Stripe Billing.
- O PayPal não foi ativado neste pacote porque Mercado Pago é mais adequado para Pix/cartão/boleto no Brasil. A arquitetura aceita incluir PayPal em uma nova rota `/api/checkout/paypal`.
- Upload real de PDF/Excel ainda exige etapa adicional: salvar no Supabase Storage, extrair texto/tabelas no backend e enviar conteúdo estruturado ao modelo de IA.
- E-mail real pode ser incluído via Resend, Gmail API ou outro provedor. O contato atualmente grava lead no banco.

## Principais diferenças do MVP antigo

- O MVP antigo simulava login e pagamento no front-end.
- Agora as chaves ficam no backend/env vars.
- O acesso ao advisor depende de `advisor_access` no banco.
- Webhook de pagamento aprova e libera acesso.
- Leads e fornecedores passam a ficar persistidos no Supabase.
