# Queijeiros (RH / documentos)

Frontend React (Vite) + API Express + PostgreSQL. O front chama a API em `/api` (proxy Nginx) ou em `VITE_API_URL` quando o build aponta para outro domínio.

## O que o projeto diz hoje sobre deploy

- **`docker-compose.yml`**: sobe `postgres`, `api` (porta interna 3001) e **`web`** (Nginx na **80**, com proxy `/api` → `api:3001`).
- **`Dockerfile` (raiz)**: só constrói o **frontend** estático + Nginx — útil isoladamente, mas **não** inclui API nem banco.
- **Variáveis**: copia `.env.example` para `.env` em local (não commitar) ou define as mesmas chaves no Easypanel.

Para produção na VPS com os três serviços, o caminho alinhado ao repo é **Docker Compose na raiz**, não só o `Dockerfile` da raiz.

**Repositório:** `https://github.com/contabilidade-01/queijeiros` (clone SSH: `git@github.com:contabilidade-01/queijeiros.git`).

### Checklist rápido (Easypanel na VPS)

1. Novo **projeto** → serviço **Docker Compose** → fonte **Git**, branch `main`, raiz do repo (ficheiro `docker-compose.yml` no topo).
2. Variáveis de ambiente: `DB_PASSWORD`, `JWT_SECRET` (obrigatórias em produção); `VITE_API_URL` vazio se usares o Nginx do stack (proxy interno `/api`).
3. Garantir volumes persistentes para **`pgdata`** e **`uploads`** (o painel mapeia para disco do servidor).
4. **Domínio** (ex.: `app.gestaoempresa.com`): DNS com registo **A** para o IP da VPS; no Easypanel em **Serviço Compose** usa **`web`** (Nginx) e **porta 80**, e ativa **HTTPS**.
5. **Auto Deploy**: nas definições da fonte Git no Easypanel, ativar para redeploy a cada push (webhook no GitHub).

### Postgres `rhapp` vs `DB_PASSWORD` (Erro "password authentication failed")

Se mudares `DB_PASSWORD` no painel **depois** do volume `pgdata` já existir, o utilizador `rhapp` no Postgres **mantém a palavra-passe antiga**. A API passa a falhar (`/api/health` com `database: "down"`).

**Opção rápida:** na consola do contentor **postgres**, executa o SQL em **`db/fix-rhapp-password.sql`** (altera `ALTER USER` para a mesma string que `DB_PASSWORD`). **Ou** apaga o volume `pgdata` e volta a implantar (perdes dados dessa BD; o `db/init.sql` corre outra vez).

### Login inicial (após `init.sql`)

| Empresa (exemplo) | CNPJ (só números) | Senha |
|-------------------|-------------------|--------|
| Gestão Empresa | `35736034000123` | `35736034000123` |
| Checkar Segurança do App | `26786637000149` | `26786637000149` |

Se a BD já tinha sido criada antes deste seed, corre também **`db/seed-company-35736034000123.sql`** uma vez no Postgres.

---

## Deploy no Easypanel

Documentação oficial útil: [App Service](https://easypanel.io/docs/services/app), [GitHub / tokens e webhooks](https://easypanel.io/docs/code-sources/github).

### Opção recomendada: serviço **Compose**

1. Criar **projeto** no Easypanel → adicionar serviço do tipo **Docker Compose** (ou equivalente que aplique o `docker-compose.yml` do repositório).
2. **Fonte**: repositório Git (SSH ou GitHub), **branch** correta, **caminho** na raiz onde está o `docker-compose.yml`.
3. **Domínio / proxy**: apontar para o serviço **`web`** na **porta 80** (Nginx: SPA + proxy `/api`).
4. **Volumes persistentes** (importante no Easypanel): mapear volumes nomeados para não perder dados ao redeploy:
   - `pgdata` — base PostgreSQL  
   - `uploads` — ficheiros enviados pela API (certificados, etc.)
5. **Variáveis de ambiente** (no Compose ou no painel, conforme o Easypanel injectar no `.env` do compose):

| Variável | Onde | Notas |
|----------|------|--------|
| `DB_PASSWORD` | compose | Palavra-passe do Postgres (`POSTGRES_PASSWORD` / API). |
| `JWT_SECRET` | compose | Segredo forte em produção. |
| `VITE_API_URL` | build do serviço `web` | Deixar vazio se front e API ficam no mesmo host com proxy `/api`. Se o front for servido noutro domínio, usar URL absoluta da API, ex.: `https://api.teudominio.com/api`. |

6. **SSH / clone**: repositório privado requer chave ou token configurado no Easypanel (no passado, URL/branch vazios ou clone incompleto geram erros tipo “api not found”).

### Opção alternativa: três **Apps** separados

Possível, mas exige reproduzir rede, variáveis e proxy manualmente (Postgres como serviço de base de dados do Easypanel, API com `DB_HOST` apontando para esse serviço, front com Nginx a apontar para o hostname interno da API). O **`docker-compose.yml`** já modela isso; por isso o Compose costuma ser mais simples.

---

## Deploy automático — opções

1. **Auto Deploy (Easypanel + GitHub)**  
   Nos definições do serviço (origem Git), ativar **Auto Deploy**. O Easypanel regista um **webhook** no GitHub: cada **push** na branch configurada dispara build e deploy.  
   - Token GitHub: para webhooks automáticos, o token precisa de permissão de **Webhooks** (fine-grained) ou `admin:repo_hook` (classic). Ver [documentação GitHub do Easypanel](https://easypanel.io/docs/code-sources/github).

2. **Deploy Webhook (URL manual)**  
   Cada app/serviço pode ter uma **URL de deploy** que, quando chamada (ex.: `curl`), inicia um novo deploy. Útil para integrações, bots ou pipelines externos.

3. **GitHub Actions → webhook do Easypanel**  
   Workflow opcional `.github/workflows/trigger-easypanel-deploy.yml`: em cada push em `main`, faz `POST` para a URL do **Deploy Webhook** do Easypanel. Cria o secret `EASYPANEL_DEPLOY_WEBHOOK` no repositório GitHub com essa URL; se o secret não existir, o job ignora (não falha). Útil se preferires disparar o painel a partir do GitHub em vez (ou além) do webhook direto GitHub↔Easypanel.

4. **Notificações**  
   O Easypanel pode avisar (Discord, Slack, Telegram, e-mail) quando um deploy termina, entre outros eventos — ver [Notifications](https://easypanel.io/docs/guides/notifications).

---

## Desenvolvimento local

- Frontend: `npm install` && `npm run dev` (porta padrão do Vite no `vite.config.ts`).
- API com Postgres: `docker compose up` na raiz, ou API à parte com `VITE_API_URL=http://localhost:3001/api` no `.env` do front.

---

## Testes e lint

```bash
npm run build
npm run lint
npm test
```
