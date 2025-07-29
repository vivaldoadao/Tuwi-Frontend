# 📋 Instruções de Migração SQL - Dados Mock para Supabase

## 🎯 Objetivo
Este documento fornece instruções completas para migrar todos os dados mock da aplicação **Wilnara Tranças** para o banco de dados Supabase usando SQL puro.

## 📊 Análise dos Dados Mock

### Estrutura Atual dos Dados Mock:
- **6 Produtos** (tranças, extensões, etc.)
- **7 Trancistas** (com diferentes status de aprovação)
- **13 Serviços** (distribuídos entre as trancistas)
- **2 Agendamentos** de exemplo
- **Disponibilidades** geradas automaticamente

### Mapeamento Mock → Supabase:

| Tipo Mock | Campo Mock | Tabela Supabase | Campo Supabase | Observações |
|-----------|------------|-----------------|----------------|-------------|
| Product | id | products | id (UUID) | Convertido para UUID |
| Product | imageUrl | products | images (array) | String → Array |
| Braider | id | braiders | id (UUID) | Novo ID gerado |
| Braider | name | users | name | Separado em tabela users |
| Braider | contactEmail | users | email | Referência user_id |
| Service | braiderId | services | braider_id | FK para braiders |
| Booking | status | bookings | status | Enum convertido |

## 🔧 Pré-requisitos

### 1. Configuração do Supabase
```bash
# Variáveis de ambiente necessárias
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

### 2. Schema Criado
Certifique-se de que o schema principal foi executado:
```sql
-- Execute primeiro: supabase/schema.sql
-- Execute também: supabase/add-messages-tables.sql (para sistema de chat)
```

## 📋 Passo a Passo da Migração

### Passo 1: Backup dos Dados Atuais (Opcional)
```sql
-- Fazer backup das tabelas existentes
CREATE TABLE users_backup AS SELECT * FROM public.users;
CREATE TABLE braiders_backup AS SELECT * FROM public.braiders;
CREATE TABLE products_backup AS SELECT * FROM public.products;
```

### Passo 2: Executar o Script de Migração
1. **Via Dashboard Supabase:**
   - Acesse: [Dashboard Supabase](https://supabase.com/dashboard)
   - Vá para: **SQL Editor**
   - Copie e cole o conteúdo de: `supabase/migrate-mock-data.sql`
   - Execute o script

2. **Via CLI Supabase:**
```bash
# Conectar ao projeto
supabase link --project-ref seu-project-ref

# Executar migração
supabase db reset --linked
psql -h db.seu-projeto.supabase.co -U postgres -d postgres -f supabase/migrate-mock-data.sql
```

### Passo 3: Verificar Resultados

**Via Dashboard Supabase (Recomendado):**
```sql
-- Execute o script de verificação simples:
-- Copie e cole: supabase/verify-migration-simple.sql
```

**Via psql (se usando CLI):**
```sql
-- Execute o script completo:
-- psql -f supabase/verify-migration.sql
```

**Verificação Rápida Manual:**
```sql
-- Contagem básica de todas as tabelas
SELECT 'users' as tabela, COUNT(*) as total FROM public.users
UNION ALL SELECT 'braiders', COUNT(*) FROM public.braiders  
UNION ALL SELECT 'products', COUNT(*) FROM public.products
UNION ALL SELECT 'services', COUNT(*) FROM public.services
UNION ALL SELECT 'conversations', COUNT(*) FROM public.conversations
UNION ALL SELECT 'messages', COUNT(*) FROM public.messages;
```

## 📊 Resultados Esperados

### Contagens Finais:
- ✅ **11 usuários** (1 admin + 7 trancistas + 3 clientes)
- ✅ **7 trancistas** (6 aprovados + 1 pendente)
- ✅ **6 produtos** (categorias variadas)
- ✅ **13 serviços** (distribuídos entre trancistas)
- ✅ **2 agendamentos** de exemplo
- ✅ **~1260 slots** de disponibilidade (30 dias × 6 trancistas × 9 horários/dia)
- ✅ **3 conversas** entre clientes e trancistas
- ✅ **12 mensagens** distribuídas nas conversas

### Estrutura de IDs:
```
Usuários:
├── 11111111-1111-1111-1111-111111111111 (Admin)
├── 22222222-2222-2222-2222-222222222222 (Ana Trancista)
├── 33333333-3333-3333-3333-333333333333 (Bia Cachos)
├── 44444444-4444-4444-4444-444444444444 (Carla Estilos - Pendente)
└── ... (outros usuários)
```

## 🔍 Validação da Migração

### 1. Teste de Integridade Referencial
```sql
-- Verificar FKs válidas
SELECT COUNT(*) as orphaned_services 
FROM public.services s 
LEFT JOIN public.braiders b ON s.braider_id = b.id 
WHERE b.id IS NULL;

-- Deve retornar 0
```

### 2. Teste de Constraints
```sql
-- Verificar preços válidos
SELECT COUNT(*) as invalid_prices 
FROM public.products 
WHERE price < 0;

-- Deve retornar 0
```

### 3. Teste de Enums
```sql
-- Verificar status válidos
SELECT DISTINCT status FROM public.braiders;
-- Deve retornar: approved, pending

SELECT DISTINCT status FROM public.bookings;
-- Deve retornar: confirmed, pending
```

## 🚨 Solução de Problemas

### Erro: "relation does not exist"
```sql
-- Verificar se schema foi criado
\dt public.*

-- Recriar schema se necessário
\i supabase/schema.sql
```

### Erro: "foreign key violation"
```sql
-- Limpar dados em ordem correta
TRUNCATE public.bookings CASCADE;
TRUNCATE public.services CASCADE;
TRUNCATE public.braiders CASCADE;
TRUNCATE public.products CASCADE;
TRUNCATE public.users CASCADE;
```

### Erro: "duplicate key value"
```sql
-- Limpar dados antes de reinserir
DELETE FROM public.users WHERE email LIKE '%example.com';
```

## 🔄 Rollback (se necessário)

### Restaurar Backup:
```sql
-- Restaurar dados originais
TRUNCATE public.users CASCADE;
INSERT INTO public.users SELECT * FROM users_backup;

-- Repetir para outras tabelas...
```

### Dados Mock Originais:
```sql
-- Reverter para dados em memória
-- (necessário alterar lib/data.ts para usar dados mock)
```

## ✅ Checklist Final

- [ ] Schema do Supabase criado
- [ ] Variáveis de ambiente configuradas
- [ ] Script de migração executado
- [ ] Contagens verificadas
- [ ] Relacionamentos validados
- [ ] Constraints testadas
- [ ] Aplicação testada com novos dados

## 🚀 Próximos Passos

Após migração bem-sucedida:

1. **Atualizar lib/data.ts:**
   ```bash
   # Usar funções do Supabase
   mv lib/data-supabase.ts lib/data.ts
   ```

2. **Testar aplicação:**
   ```bash
   npm run dev
   ```

3. **Configurar RLS (Row Level Security):**
   ```sql
   -- Ver arquivo: supabase/rls-policies.sql
   ```

4. **Implementar uploads de imagem real**

## 📞 Suporte

### Logs Úteis:
```sql
-- Ver logs de erro
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Ver constraints violadas
SELECT conname, conrelid::regclass FROM pg_constraint WHERE NOT convalidated;
```

### Verificações Rápidas:
```sql
-- Teste rápido de conectividade
SELECT NOW() as current_time, version() as pg_version;

-- Listar todas as tabelas
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

---

**⚠️ Importante:** 
- Execute sempre em ambiente de desenvolvimento primeiro
- Faça backup antes de executar em produção
- Teste todas as funcionalidades após migração
- Monitore logs durante execução do script