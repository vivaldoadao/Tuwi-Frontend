# Plano de Implementação - Página de Bookings da Trancista

## 🔍 Diagnóstico Realizado

### Dados Encontrados:
- ✅ **Usuário existe**: `znattechnology95@gmail.com` (ID: `3c9549bf-3c52-4b55-8dfe-ce53fb1a623b`)
- ✅ **Role correto**: `braider` 
- ❌ **Problema principal**: Não existe registro na tabela `braiders` para este usuário
- ❌ **Relacionamento quebrado**: FK entre `braiders` e `users` não está funcionando no Supabase
- ✅ **Agendamentos existem**: 3 bookings no sistema, mas com outros `braider_id`s

### Problemas Identificados:
1. **Usuário não tem registro de trancista**: Apesar de ter role `braider`, não existe entrada na tabela `braiders`
2. **FK relationship não encontrada**: Query com join falha entre `braiders` e `users`
3. **Session ID vs DB ID**: O sistema está funcionando mas falta o registro de trancista

## 🎯 Solução Proposta

### Fase 1: Criar Registro de Trancista para o Usuário
```sql
-- Criar registro de trancista para o usuário existente
INSERT INTO public.braiders (
  user_id,
  name,
  bio,
  location,
  contact_email,
  contact_phone,
  profile_image_url,
  status
) VALUES (
  '3c9549bf-3c52-4b55-8dfe-ce53fb1a623b', -- ID do usuário existente
  'Znat Technology Tranças',
  'Especialista em diversos estilos de tranças e cuidados capilares.',
  'Lisboa, Portugal',
  'znattechnology95@gmail.com',
  '+351 999 888 777',
  '/placeholder.svg?height=200&width=200&text=ZT',
  'approved' -- Já aprovado para testes
);
```

### Fase 2: Corrigir API de Bookings
**Arquivo**: `app/api/braiders/bookings/route.ts`

**Abordagem Simplificada**:
1. Buscar braider pelo `user_id` diretamente (sem join complexo)
2. Depois buscar os bookings pelo `braider_id` encontrado
3. Retornar dados com estatísticas

```typescript
// Nova implementação da API
export async function GET(request: Request) {
  const session = await auth()
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // 1. Buscar usuário pelo email
  const { data: userData } = await serviceSupabase
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single()

  if (!userData) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  // 2. Buscar braider pelo user_id
  const { data: braiderData } = await serviceSupabase
    .from('braiders')
    .select('id, name, status')
    .eq('user_id', userData.id)
    .single()

  if (!braiderData) {
    return NextResponse.json({ error: 'Registro de trancista não encontrado' }, { status: 404 })
  }

  // 3. Buscar bookings pelo braider_id
  const { data: bookings } = await serviceSupabase
    .from('bookings')
    .select('*')
    .eq('braider_id', braiderData.id)
    .order('created_at', { ascending: false })

  // 4. Calcular estatísticas
  const stats = {
    total: bookings?.length || 0,
    pending: bookings?.filter(b => b.status === 'pending').length || 0,
    confirmed: bookings?.filter(b => b.status === 'confirmed').length || 0,
    completed: bookings?.filter(b => b.status === 'completed').length || 0,
    cancelled: bookings?.filter(b => b.status === 'cancelled').length || 0
  }

  return NextResponse.json({
    braider: braiderData,
    bookings: bookings || [],
    stats
  })
}
```

### Fase 3: Atualizar Componente Frontend
**Arquivo**: `app/braider-dashboard/bookings/page.tsx`

**Melhorias**:
1. Melhor tratamento de erros
2. Loading states mais claros
3. Display das estatísticas
4. Ações de gerenciamento de bookings

### Fase 4: Criar Dados de Teste
```sql
-- Criar alguns bookings de teste para esta trancista
INSERT INTO public.bookings (
  service_id,
  braider_id,
  booking_date,
  booking_time,
  service_type,
  client_name,
  client_email,
  client_phone,
  status,
  total_amount
) VALUES 
-- Usando o ID da trancista que será criada
(
  (SELECT id FROM public.services LIMIT 1),
  (SELECT id FROM public.braiders WHERE contact_email = 'znattechnology95@gmail.com'),
  CURRENT_DATE + INTERVAL '1 day',
  '10:00:00',
  'trancista',
  'Ana Cliente Teste',
  'ana.teste@example.com',
  '+351 961234567',
  'pending',
  150.00
),
(
  (SELECT id FROM public.services LIMIT 1),
  (SELECT id FROM public.braiders WHERE contact_email = 'znattechnology95@gmail.com'),
  CURRENT_DATE + INTERVAL '3 days',
  '14:30:00',
  'domicilio',
  'Carla Cliente Teste',
  'carla.teste@example.com',
  '+351 962345678',
  'confirmed',
  200.00
);
```

## 🚀 Sequência de Implementação

1. **Executar script SQL** para criar registro de trancista
2. **Atualizar API** com nova lógica simplificada
3. **Testar API** via browser ou Postman
4. **Atualizar componente** se necessário
5. **Criar dados de teste** para demonstração
6. **Verificar funcionamento** completo

## 🔧 Scripts de Execução

### Script 1: Criar Trancista
```sql
-- Arquivo: supabase/create-braider-for-zna.sql
```

### Script 2: Criar Bookings de Teste
```sql  
-- Arquivo: supabase/create-test-bookings-for-zna.sql
```

## ✅ Critérios de Sucesso

- [ ] API `/api/braiders/bookings` retorna dados sem erro
- [ ] Página exibe bookings da trancista logada
- [ ] Estatísticas são calculadas corretamente
- [ ] Interface permite ações básicas (aprovar, rejeitar, etc.)
- [ ] Sem erros de RLS ou autenticação

## 📝 Notas Técnicas

- **RLS**: As políticas já permitem que braiders vejam seus próprios dados
- **Authentication**: NextAuth está funcionando corretamente
- **Database**: Estrutura está correta, só falta o registro de trancista
- **Frontend**: Componente já implementado, só precisa de ajustes menores