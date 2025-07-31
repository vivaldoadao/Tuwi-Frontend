# Configuração do Stripe para Wilnara Tranças

Este guia explica como configurar o sistema de pagamentos Stripe no marketplace.

## 📋 Pré-requisitos

1. Conta no Stripe (https://stripe.com)
2. Banco de dados Supabase configurado
3. Variáveis de ambiente configuradas

## 🔧 Configuração

### 1. Criar Conta no Stripe

1. Acesse https://stripe.com e crie uma conta
2. Ative o modo de teste (Test Mode)
3. Vá para "Developers" > "API Keys"
4. Copie as chaves:
   - **Publishable key** (pk_test_...)
   - **Secret key** (sk_test_...)

### 2. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env.local`:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
```

### 3. Criar Tabela de Pedidos no Supabase

Execute o SQL no arquivo `sql/orders-schema.sql` no seu banco Supabase:

1. Vá para o painel do Supabase
2. Navegue para "SQL Editor"
3. Cole e execute o conteúdo de `sql/orders-schema.sql`

### 4. Instalar Dependências

As dependências do Stripe já estão incluídas no projeto:

```json
{
  "stripe": "^14.x.x",
  "@stripe/stripe-js": "^2.x.x",
  "@stripe/react-stripe-js": "^2.x.x"
}
```

## 🛒 Fluxo de Pagamento

### Como Funciona

1. **Step 1 - Informações do Cliente**
   - Cliente preenche dados de entrega
   - Seleciona opção de frete
   - Clica em "Continuar para Pagamento"

2. **Step 2 - Processamento**
   - Sistema cria `PaymentIntent` no Stripe
   - Cria pedido no banco com status "pending"
   - Exibe formulário de pagamento Stripe

3. **Step 3 - Pagamento**
   - Cliente insere dados do cartão
   - Stripe processa pagamento
   - Sistema atualiza status do pedido

4. **Step 4 - Confirmação**
   - Pagamento confirmado
   - Carrinho limpo
   - Página de sucesso exibida

### Estrutura do Pedido

```typescript
type Order = {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: string
  shippingCity: string
  shippingPostalCode: string
  shippingCountry: string
  items: OrderItem[]
  subtotal: number
  shippingCost: number
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentIntentId?: string
  stripeCustomerId?: string
  notes?: string
  createdAt: string
  updatedAt?: string
}
```

## 🛡️ Segurança

### Proteções Implementadas

1. **RLS (Row Level Security)**
   - Clientes só veem seus próprios pedidos
   - Admins têm acesso total

2. **API Routes Seguras**
   - Validação de dados no servidor
   - Verificação de status de pagamento

3. **Stripe Elements**
   - Formulário seguro do Stripe
   - Dados do cartão nunca passam pelo servidor

## 🧪 Teste

### Cartões de Teste do Stripe

Use estes números para testar:

- **Sucesso**: 4242 4242 4242 4242
- **Falha**: 4000 0000 0000 0002
- **Cartão expirado**: 4000 0000 0000 0069

**CVV**: Qualquer 3 dígitos
**Data**: Qualquer data futura
**CEP**: Qualquer CEP

### Testar o Fluxo

1. Adicione produtos ao carrinho
2. Vá para checkout
3. Preencha informações (pode usar dados fictícios)
4. Use cartão de teste
5. Verifique pedido criado no banco

## 📊 Monitoramento

### Dashboard do Stripe

No painel do Stripe você pode:

- Ver todos os pagamentos
- Acompanhar tentativas de pagamento
- Ver estatísticas de conversão
- Configurar webhooks (futuro)

### Banco de Dados

Consulte pedidos no Supabase:

```sql
-- Ver todos os pedidos
SELECT * FROM orders ORDER BY created_at DESC;

-- Ver pedidos por status
SELECT * FROM orders WHERE status = 'processing';

-- Ver pedidos de um cliente
SELECT * FROM orders WHERE customer_email = 'cliente@email.com';
```

## 🚀 Produção

### Antes de ir para Produção

1. **Ativar conta Stripe**
   - Fornecer documentos necessários
   - Configurar conta bancária

2. **Trocar chaves**
   - Usar chaves de produção (pk_live_..., sk_live_...)
   - Atualizar variáveis de ambiente

3. **Configurar Webhooks**
   - Para confirmar pagamentos automaticamente
   - Para atualizar status de pedidos

4. **Testar completamente**
   - Fazer pedidos reais pequenos
   - Verificar fluxo completo

## ❓ Solução de Problemas

### Erros Comuns

1. **"Stripe is not defined"**
   - Verificar se NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY está definida
   - Verificar se começa com "pk_"

2. **"No such payment intent"** 
   - Verificar se STRIPE_SECRET_KEY está correta
   - Verificar se começa com "sk_"

3. **Erro de banco de dados**
   - Verificar se tabela `orders` foi criada
   - Verificar políticas RLS

### Logs Úteis

- Console do navegador para erros cliente
- Logs do Stripe Dashboard
- Logs do Supabase para banco de dados

## 📞 Suporte

- Documentação Stripe: https://stripe.com/docs
- Suporte Stripe: https://support.stripe.com
- Documentação Supabase: https://supabase.io/docs