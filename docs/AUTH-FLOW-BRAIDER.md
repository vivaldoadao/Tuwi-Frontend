# 🔐 Fluxo de Autenticação - Registro de Trancistas

## 🎯 Fluxo Recomendado

### **Etapa 1: Conta de Usuário Normal**
```
1. Usuário visita o site
2. Clica em "Entrar" ou "Cadastrar"
3. Cria conta via email/password ou social login
4. Perfil criado como role: 'customer'
5. Pode navegar, comprar produtos, fazer agendamentos
```

### **Etapa 2: Upgrade para Trancista**
```
1. Usuário logado acessa "Quero ser Trancista"
2. Sistema verifica se já é trancista
3. Se não for, mostra formulário completo
4. Após submissão: status 'pending'
5. Admin aprova: role muda para 'braider'
```

## 🏗️ Arquitetura de Dados

### **Tabelas Envolvidas:**
```sql
auth.users (Supabase Auth)
├── id (UUID)
├── email 
└── created_at

public.users (Perfil Público)
├── id → auth.users.id
├── name, email, phone
├── role: 'customer' | 'braider' | 'admin'
└── avatar_url

public.braiders (Perfil Trancista)
├── user_id → public.users.id
├── bio, location, specialties
├── status: 'pending' | 'approved' | 'rejected'
└── ... (todos os novos campos)
```

## 🔧 Implementação Técnica

### **1. Proteger Rota do Formulário**
```typescript
// app/register-braider/page.tsx
import { useAuth } from "@/context/auth-context"
import { redirect } from "next/navigation"

export default function RegisterBraiderPage() {
  const { user, loading } = useAuth()
  
  if (loading) return <Loading />
  if (!user) redirect('/login?callbackUrl=/register-braider')
  
  // Verificar se já é trancista
  const isAlreadyBraider = user.role === 'braider'
  if (isAlreadyBraider) {
    return <AlreadyBraiderMessage />
  }
  
  return <BraiderRegistrationForm />
}
```

### **2. Atualizar addBraider Function**
```typescript
export async function addBraider(data: BraiderData) {
  // Verificar se usuário está autenticado
  const { user } = await getUser()
  if (!user) throw new Error('Usuário não autenticado')
  
  // Verificar se já é trancista
  const existingBraider = await getBraiderByUserId(user.id)
  if (existingBraider) throw new Error('Usuário já é trancista')
  
  // Criar perfil de trancista
  const braider = await createBraider({
    user_id: user.id,
    ...data,
    status: 'pending'
  })
  
  // Enviar email de confirmação
  await sendBraiderApplicationEmail(user.email, user.name)
  
  return { success: true, braider }
}
```

### **3. Sistema de Aprovação**
```typescript
// Dashboard Admin - Aprovar Trancista
export async function approveBraider(braiderId: string) {
  // Atualizar status do braider
  await updateBraiderStatus(braiderId, 'approved')
  
  // Atualizar role do usuário
  await updateUserRole(braider.user_id, 'braider')
  
  // Enviar email de aprovação
  await sendApprovalEmail(user.email)
}
```

## 🎨 UX Melhorado

### **Botões de Call-to-Action:**
```typescript
// Se não logado
<Button onClick={() => router.push('/login?callbackUrl=/register-braider')}>
  Entrar para se Cadastrar como Trancista
</Button>

// Se logado mas não é trancista
<Button onClick={() => router.push('/register-braider')}>
  Quero ser Trancista
</Button>

// Se já é trancista
<Button onClick={() => router.push('/dashboard/braider')}>
  Meu Painel de Trancista
</Button>
```

### **Estados do Usuário:**
1. **Não logado**: Botão "Entrar para se Cadastrar"
2. **Customer**: Botão "Quero ser Trancista"  
3. **Braider Pending**: "Aguardando Aprovação"
4. **Braider Approved**: "Acessar Painel"
5. **Braider Rejected**: "Solicitar Revisão"

## 🔒 Benefícios desta Abordagem

### **Segurança:**
- ✅ Rastreabilidade completa
- ✅ Verificação de duplicatas
- ✅ Controle de acesso adequado
- ✅ Auditoria de mudanças

### **UX/UI:**
- ✅ Fluxo natural e intuitivo
- ✅ Dados do usuário pré-preenchidos
- ✅ Estados claros para cada situação
- ✅ Feedback visual do status

### **Negócio:**
- ✅ Processo de aprovação controlado
- ✅ Qualidade dos trancistas
- ✅ Comunicação automatizada
- ✅ Métricas de conversão

## 📱 Fluxos Alternativos

### **Opção A: Registro Direto**
- Usuário cria conta já como trancista
- Mais rápido, menos controle

### **Opção B: Registro Duplo**
- Dois formulários separados
- Mais complexo, melhor separação

### **Opção C: Registro Híbrido** ⭐ **RECOMENDADO**
- Conta normal → Upgrade para trancista
- Equilibra simplicidade e controle

## 🚀 Implementação Recomendada

1. **Fase 1**: Proteger rota atual com autenticação
2. **Fase 2**: Verificar se usuário já é trancista  
3. **Fase 3**: Pré-preencher dados do usuário logado
4. **Fase 4**: Sistema de aprovação no admin
5. **Fase 5**: Emails automatizados
6. **Fase 6**: Dashboard personalizado por role