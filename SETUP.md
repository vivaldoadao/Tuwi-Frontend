# 🚀 Guia de Configuração - Wilnara Tranças Marketplace

## ✅ Status Atual
- ✅ Dependências instaladas
- ✅ Variáveis de ambiente configuradas
- ✅ NextAuth secret gerado
- ✅ Servidor dev carregando .env.local

## 📋 Próximos Passos

### 1. Configurar Supabase Database Schema

**Método 1 - Interface Web (Recomendado):**

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto: **ttqxxxphasfmwakstedi**
3. Vá para **SQL Editor** no menu lateral
4. Crie uma nova query e copie todo o conteúdo do arquivo `supabase/schema.sql`
5. Execute a query
6. Crie outra query e copie todo o conteúdo do arquivo `supabase/functions.sql`
7. Execute esta segunda query

**Método 2 - Via Script (Alternativo):**
```bash
# Execute apenas se o Método 1 não funcionar
node scripts/setup-db.js
```

### 2. Testar a Configuração

```bash
# Reiniciar servidor dev
npm run dev
```

O projeto deve estar funcionando em: http://localhost:3000

### 3. Verificar Funcionamento

**Teste estas funcionalidades:**

1. **Home Page** - `http://localhost:3000`
   - Deve carregar sem erros de auth
   
2. **Login** - `http://localhost:3000/login`
   - Deve mostrar formulário de login
   
3. **Registro de Trancista** - `http://localhost:3000/register-braider`
   - Deve permitir cadastro

## 🔧 Solução de Problemas

### Erro: "supabaseUrl is required"
✅ **RESOLVIDO** - Variáveis de ambiente configuradas

### Se ainda houver erros de auth:

1. Verifique se as tabelas foram criadas:
```sql
-- Execute no Supabase SQL Editor
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

2. Verifique se o schema auth está habilitado:
```sql
-- Execute no Supabase SQL Editor  
SELECT * FROM auth.users LIMIT 1;
```

## 🎯 Estrutura do Banco de Dados

Após executar o schema, você terá essas tabelas:

### Core Tables:
- `users` - Usuários com roles (customer/braider/admin)
- `braiders` - Perfis de trancistas
- `products` - Catálogo de produtos
- `services` - Serviços oferecidos por trancistas

### Business Logic:
- `bookings` - Agendamentos de serviços
- `orders` - Pedidos de produtos
- `reviews` - Avaliações de trancistas
- `payment_transactions` - Histórico de pagamentos

### Sistema de Roles:
- `customer` → Acesso a `/dashboard`
- `braider` → Acesso a `/braider-dashboard`  
- `admin` → Acesso a `/admin`

## 🚀 Deploy para Produção

Quando estiver pronto para produção:

1. Configure variáveis de ambiente no Vercel/Netlify
2. Configure OAuth providers (Google, etc.)
3. Configure webhooks de pagamento
4. Habilite RLS policies no Supabase

## 📞 Suporte

Se encontrar problemas:
1. Verifique logs do servidor dev
2. Verifique logs do Supabase Dashboard
3. Confirme que todas as variáveis de ambiente estão corretas

---

**🎉 Quando tudo estiver funcionando, você terá um marketplace completo com:**
- Autenticação segura
- Sistema de roles
- CRUD de produtos e serviços  
- Sistema de agendamentos
- Dashboard para cada tipo de usuário