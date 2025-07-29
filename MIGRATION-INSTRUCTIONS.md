# 🚀 Instruções de Migração para Supabase

Este documento contém as instruções completas para migrar a aplicação Wilnara Tranças dos dados mock para o backend real do Supabase.

## ⚠️ Pré-requisitos

### 1. Configuração do Supabase
Certifique-se de ter:
- Projeto Supabase criado
- Variáveis de ambiente configuradas
- CLI do Supabase instalado (opcional, mas recomendado)

### 2. Variáveis de Ambiente
Adicione as seguintes variáveis ao seu arquivo `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# NextAuth Configuration
NEXTAUTH_SECRET=seu_nextauth_secret_aqui
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
```

## 📋 Passos da Migração

### Passo 1: Executar as Migrações do Banco de Dados

#### Opção A: Usando o Dashboard do Supabase
1. Acesse o dashboard do seu projeto Supabase
2. Vá para **SQL Editor**
3. Copie e execute o conteúdo do arquivo `supabase/schema.sql`
4. Execute também os arquivos de migração adiccionais na ordem:
   - `supabase/functions.sql`
   - `supabase/add-password-field.sql`
   - `supabase/add-verification-fields.sql`

#### Opção B: Usando o CLI do Supabase (Recomendado)
```bash
# Inicializar o projeto Supabase localmente
supabase init

# Conectar ao projeto remoto
supabase link --project-ref seu-project-ref

# Executar migrações
supabase db reset
```

### Passo 2: Executar o Script de Migração de Dados

```bash
# Instalar dependências se necessário
npm install @supabase/supabase-js

# Executar o script de migração
node scripts/migrate-to-supabase.js
```

O script irá:
- ✅ Limpar dados existentes
- ✅ Inserir usuários de exemplo
- ✅ Inserir produtos
- ✅ Inserir perfis de trancistas
- ✅ Inserir serviços
- ✅ Criar disponibilidades para 30 dias
- ✅ Criar agendamentos de exemplo

### Passo 3: Atualizar as Funções de Dados

#### 3.1. Backup do Arquivo Atual
```bash
# Fazer backup do arquivo atual
mv lib/data.ts lib/data-mock.ts.backup
```

#### 3.2. Substituir pelas Funções do Supabase
```bash
# Renomear o novo arquivo
mv lib/data-supabase.ts lib/data.ts
```

### Passo 4: Atualizar Importações (se necessário)

Procure por arquivos que importam de `lib/data` e verifique se precisam de ajustes:

```bash
# Encontrar arquivos que importam lib/data
grep -r "from.*lib/data" app/ components/ --include="*.ts" --include="*.tsx"
```

### Passo 5: Testar a Aplicação

```bash
# Limpar cache do Next.js
rm -rf .next

# Instalar dependências
npm install

# Executar em modo de desenvolvimento
npm run dev
```

## 🔧 Configurações Adicionais

### Row Level Security (RLS)

Execute as seguintes queries no SQL Editor do Supabase para habilitar RLS:

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.braiders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.braider_availability ENABLE ROW LEVEL SECURITY;

-- Política para usuários (podem ver e editar seus próprios dados)
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Política para produtos (leitura pública)
CREATE POLICY "Products are viewable by everyone" ON public.products
  FOR SELECT USING (is_active = true);

-- Política para trancistas (leitura pública para aprovados)
CREATE POLICY "Approved braiders are viewable by everyone" ON public.braiders
  FOR SELECT USING (status = 'approved');

-- Política para serviços (leitura pública)
CREATE POLICY "Services are viewable by everyone" ON public.services
  FOR SELECT USING (is_available = true);

-- Política para agendamentos (usuários veem seus próprios)
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (
    auth.uid() = client_id OR 
    auth.uid() IN (SELECT user_id FROM braiders WHERE id = braider_id)
  );

-- Política para disponibilidade (leitura pública)
CREATE POLICY "Availability is viewable by everyone" ON public.braider_availability
  FOR SELECT USING (true);
```

### Configurar Storage (para imagens)

1. No dashboard do Supabase, vá para **Storage**
2. Crie um bucket chamado `product-images`
3. Crie um bucket chamado `braider-portfolio`
4. Configure as políticas de acesso:

```sql
-- Política de leitura pública para imagens
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id IN ('product-images', 'braider-portfolio'));

-- Política de upload para usuários autenticados
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('product-images', 'braider-portfolio') AND
    auth.role() = 'authenticated'
  );
```

## 🚨 Solução de Problemas

### Erro de Conexão com Supabase
- Verifique se as variáveis de ambiente estão corretas
- Confirme se o projeto Supabase está ativo
- Teste a conexão no dashboard

### Erro de Permissões
- Verifique se está usando a `SUPABASE_SERVICE_ROLE_KEY` no script de migração
- Confirme se as políticas RLS estão configuradas corretamente

### Dados Não Aparecem
- Verifique os logs do console do navegador
- Confirme se as tabelas foram criadas corretamente
- Teste as queries diretamente no SQL Editor

### Performance Lenta
- Adicione índices nas colunas mais consultadas:
```sql
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_braiders_status ON braiders(status);
CREATE INDEX idx_bookings_braider ON bookings(braider_id);
CREATE INDEX idx_services_braider ON services(braider_id);
```

## 📊 Verificação da Migração

Execute estas queries para verificar se os dados foram migrados corretamente:

```sql
-- Verificar contagem de registros
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'braiders', COUNT(*) FROM braiders
UNION ALL
SELECT 'services', COUNT(*) FROM services
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'braider_availability', COUNT(*) FROM braider_availability;

-- Verificar integridade dos dados
SELECT 
  b.id,
  u.name as braider_name,
  COUNT(s.id) as services_count,
  b.status
FROM braiders b
LEFT JOIN users u ON b.user_id = u.id
LEFT JOIN services s ON b.id = s.braider_id
GROUP BY b.id, u.name, b.status;
```

## ✅ Checklist de Migração

- [ ] Variáveis de ambiente configuradas
- [ ] Schema do banco criado
- [ ] Script de migração executado com sucesso
- [ ] Funções de dados atualizadas
- [ ] RLS configurado
- [ ] Storage configurado (se necessário)
- [ ] Aplicação testada localmente
- [ ] Dados visíveis na interface
- [ ] Funcionalidades principais funcionando

## 🎯 Próximos Passos

Após a migração bem-sucedida:

1. **Implementar Upload de Imagens**: Substituir placeholders por upload real
2. **Configurar Emails**: Implementar envio de emails para notificações
3. **Adicionar Pagamentos**: Integrar sistema de pagamento
4. **Otimizar Performance**: Adicionar cache e otimizações
5. **Deploy em Produção**: Configurar ambiente de produção

## 📞 Suporte

Se encontrar problemas durante a migração:

1. Verifique os logs de erro detalhadamente
2. Consulte a documentação do Supabase
3. Teste queries diretamente no SQL Editor
4. Verifique se todas as dependências estão instaladas

---

**⚠️ Importante**: Sempre faça backup dos dados antes de executar a migração em produção!