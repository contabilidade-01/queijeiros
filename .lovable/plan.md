

# Sistema Multi-Empresa com Cadastro de Funcionários e Chatbot

## Visão Geral

Criar um sistema com login por CNPJ, cadastro de funcionários por empresa, e um modo chatbot para gerar documentos de suspensão/advertência de forma conversacional.

## Estrutura do Banco de Dados

### Novas tabelas:

1. **companies** — Armazena as 3 empresas
   - `id`, `name`, `cnpj` (unique), `password` (texto simples por enquanto)

2. **employees** — Funcionários vinculados a cada empresa
   - `id`, `company_id` (FK → companies), `name`, `cpf`, `active` (boolean), `dismissal_date`

3. **Alteração em issued_documents** — Adicionar `company_id` (FK → companies)

### Dados iniciais:
- Inserir as 3 empresas com senha padrão = CNPJ (sem pontuação)
- Importar todos os funcionários dos CSVs (apenas ativos, sem data de demissão)

## Fluxo de Autenticação

- Tela de login simples: campo CNPJ + Senha
- Sem Supabase Auth — consulta direta na tabela `companies`
- Sessão armazenada em localStorage (company_id + company_name + cnpj)
- Toda navegação protegida: se não logado, redireciona ao login

## Páginas e Navegação

```text
Login (/login)
  ↓
Menu Principal (/)
  ├── Suspensão (/suspensao)
  ├── Advertência (/advertencia)
  ├── Chatbot (/chatbot)
  ├── Funcionários (/funcionarios)
  └── Histórico (/historico)
```

## Cadastro de Funcionários (/funcionarios)

- Lista de funcionários da empresa logada
- Adicionar novo (Nome + CPF)
- Editar / Excluir
- Interface mobile-friendly com cards

## Chatbot para Documentos (/chatbot)

Interface conversacional step-by-step:

1. "Qual tipo de documento?" → Suspensão / Advertência
2. "Qual funcionário?" → Lista dropdown com funcionários cadastrados
3. Se suspensão: "Quantos dias?" → Input numérico
4. "Data de início?" → Seletor de data
5. "Houve advertências anteriores?" → Sim/Não → Se sim, adicionar datas
6. "Descreva o motivo:" → Textarea
7. Resumo final → Confirmar e gerar DOCX

Cada etapa aparece como uma mensagem de chat, com a resposta do usuário abaixo. O formulário completo fica pré-preenchido automaticamente com os dados do funcionário e da empresa logada.

## Alterações nos Formulários Existentes

- SuspensionForm e WarningForm: pré-preencher dados da empresa logada
- Campo de funcionário vira um select/autocomplete buscando da tabela `employees`
- CPF preenchido automaticamente ao selecionar funcionário

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---|---|
| Migration SQL | Criar tabelas `companies`, `employees`, alterar `issued_documents` |
| Insert SQL | Importar empresas e funcionários |
| `src/pages/LoginPage.tsx` | Nova página de login |
| `src/pages/EmployeesPage.tsx` | CRUD de funcionários |
| `src/pages/ChatbotPage.tsx` | Interface chatbot |
| `src/components/ChatbotFlow.tsx` | Lógica do chatbot step-by-step |
| `src/hooks/useAuth.ts` | Hook de autenticação/sessão |
| `src/App.tsx` | Novas rotas + proteção |
| `src/pages/Index.tsx` | Menu atualizado |
| `src/components/SuspensionForm.tsx` | Select de funcionário, dados auto |
| `src/components/WarningForm.tsx` | Select de funcionário, dados auto |

## Segurança (RLS)

- Companies: leitura pública (para login)
- Employees: leitura/escrita pública (simplificado, sem Supabase Auth)
- Issued_documents: manter políticas atuais

