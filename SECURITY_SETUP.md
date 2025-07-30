# 🔒 Configuração de Segurança - Sistema de Produtos

## 📋 Passos para Implementar Segurança RLS

### 1. Configurar Variáveis de Ambiente

Adicione ao seu arquivo `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Required for secure admin operations
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Como encontrar as chaves:**
1. Vá para o painel do Supabase
2. Navegue para **Settings > API**
3. Copie a **URL** e a **anon public key**
4. Copie a **service_role key** (⚠️ NUNCA exponha esta chave no frontend!)

### 2. Executar SQL para Reabilitar RLS

Execute os seguintes comandos no **SQL Editor** do Supabase:

```sql
-- Reabilitar RLS para segurança
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Allow all operations on products" ON products;

-- Criar política segura apenas para leitura pública
CREATE POLICY "Allow public read access to active products" 
ON products FOR SELECT 
USING (is_active = true);

-- Verificar se RLS está ativo
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'products';
```

### 3. Verificar Configuração

Após configurar, teste:

1. **Frontend**: Deve conseguir ver produtos ativos
2. **Dashboard**: Deve conseguir fazer CRUD completo via API routes
3. **Segurança**: Tentativas diretas de modificar produtos via Supabase client devem falhar

## 🛡️ Como Funciona a Segurança

### Arquitetura Segura

```
Frontend (Browser)
     ↓
API Routes (/api/admin/products)
     ↓
Service Role Key Functions
     ↓
Supabase Database
```

**Benefícios:**
- ✅ RLS ativo protege contra acesso não autorizado
- ✅ Service Role Key apenas no servidor
- ✅ API routes com verificação de permissões
- ✅ Logs centralizados no servidor
- ✅ Controle total sobre operações administrativas

### Operações Protegidas

- **Criar produtos**: Via API route `/api/admin/products` (POST)
- **Editar produtos**: Via API route `/api/admin/products` (PUT)
- **Excluir produtos**: Via API route `/api/admin/products` (DELETE)
- **Toggle status**: Via API route `/api/admin/products/toggle` (POST)
- **Listar produtos (admin)**: Via API route `/api/admin/products` (GET)

### Operações Públicas (RLS)

- **Ver produtos ativos**: Direto via Supabase client (leitura apenas)

## 🚨 Importante

1. **NUNCA** exponha a `SUPABASE_SERVICE_ROLE_KEY` no frontend
2. **SEMPRE** mantenha RLS ativo em produção
3. **TESTE** as permissões antes de fazer deploy
4. **MONITORE** logs de acesso para detectar tentativas não autorizadas

## 🔧 Troubleshooting

### Erro: "SUPABASE_SERVICE_ROLE_KEY is required"
- Verifique se a variável de ambiente está definida no `.env.local`
- Reinicie o servidor de desenvolvimento após adicionar a variável

### Erro: "Unauthorized" nas API routes
- Implemente verificação de autenticação adequada na função `isAdmin()`
- Por ora, está configurada para permitir todas as operações (desenvolvimento)

### RLS bloqueando operações
- Verifique se as políticas foram criadas corretamente
- Confirme que RLS está ativo apenas para operações diretas, não para Service Role