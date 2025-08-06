# 🔄 Atualização do Schema - Formulário de Registro de Trancistas

## 🎯 Objetivo
Atualizar o schema da tabela `braiders` para incluir todos os campos do formulário de registro expandido.

## 📋 Novos Campos Adicionados

### Campos Pessoais
- `whatsapp` - Número do WhatsApp
- `instagram` - Handle do Instagram

### Campos de Localização Detalhada
- `district` - Distrito de Portugal
- `concelho` - Concelho
- `freguesia` - Freguesia (opcional)
- `address` - Endereço completo
- `postal_code` - Código postal

### Modalidades de Atendimento
- `serves_home` - Atendimento ao domicílio
- `serves_studio` - Atendimento no estúdio/casa
- `serves_salon` - Atendimento no salão
- `max_travel_distance` - Distância máxima em km
- `salon_name` - Nome do salão (se aplicável)
- `salon_address` - Endereço do salão (se aplicável)

### Dados Profissionais
- `specialties` - Array de especialidades
- `years_experience` - Anos de experiência (enum)
- `certificates` - Certificações obtidas
- `min_price` - Preço mínimo em euros
- `max_price` - Preço máximo em euros
- `weekly_availability` - Disponibilidade semanal (JSON)

## 🚀 Como Executar as Migrações

### Passo 1: Fazer Backup (Recomendado)
```sql
-- Execute no SQL Editor do Supabase
CREATE TABLE braiders_backup AS SELECT * FROM public.braiders;
```

### Passo 2: Executar Atualização do Schema
```bash
# Via Dashboard Supabase
1. Acesse: https://supabase.com/dashboard
2. Vá para: SQL Editor
3. Copie e cole o conteúdo de: supabase/update-braiders-schema.sql
4. Execute o script
```

### Passo 3: Verificar Resultados
```bash
# Execute o script de verificação
# Copie e cole: supabase/verify-braiders-schema.sql
```

## ✅ Validações Adicionadas

### Constraints de Negócio
- **At least one service**: Deve ter pelo menos uma modalidade de atendimento
- **Salon fields**: Se `serves_salon=true`, deve ter `salon_name` e `salon_address`
- **Price range**: Se tiver preços, `min_price` ≤ `max_price`
- **Travel distance**: Entre 1 e 200 km

### Validações de Formato
- **WhatsApp**: Formato português (+351 9XX XXX XXX)
- **Instagram**: Handle válido (@username ou username)
- **Contact Phone**: Formato português

## 📊 Resultados Esperados

### Novos Tipos
- `experience_level` enum: iniciante, 1-2, 3-5, 6-10, 10+

### Novas Funções
- `validate_instagram_handle()` - Valida formato do Instagram
- `validate_portugal_phone()` - Valida telefones portugueses
- `search_braiders_by_location()` - Busca por localização
- `search_braiders_by_specialty()` - Busca por especialidade

### Nova View
- `braiders_complete` - View com dados completos incluindo user info

### Novos Índices
- `idx_braiders_district` - Performance para busca por distrito
- `idx_braiders_concelho` - Performance para busca por concelho
- `idx_braiders_services` - Performance para filtros de modalidade
- `idx_braiders_specialties` - Performance para busca por especialidade (GIN)
- `idx_braiders_price_range` - Performance para filtros de preço

## 🔍 Verificações Importantes

### 1. Contagem de Campos
```sql
SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name = 'braiders' AND table_schema = 'public';
-- Esperado: ~31 campos
```

### 2. Constraints Ativas
```sql
SELECT constraint_name FROM information_schema.table_constraints 
WHERE table_name = 'braiders' AND constraint_type = 'CHECK';
-- Esperado: 6+ constraints
```

### 3. Teste de Inserção
```sql
-- Este deve funcionar
INSERT INTO public.braiders (
  user_id, bio, location, serves_studio, 
  district, concelho, specialties
) VALUES (
  uuid_generate_v4(), 'Teste', 'Lisboa, Portugal', true,
  'Lisboa', 'Lisboa', ARRAY['Box Braids']
);
```

## 🚨 Problemas Comuns

### Erro: "constraint violation"
```sql
-- Verificar dados existentes que podem quebrar constraints
SELECT * FROM public.braiders 
WHERE NOT (serves_home OR serves_studio OR serves_salon);
```

### Erro: "function does not exist"
```sql
-- Re-executar criação das funções
CREATE OR REPLACE FUNCTION validate_instagram_handle...
```

### Erro: "column already exists"
```sql
-- Verificar se migration já foi executada
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'braiders' AND column_name = 'whatsapp';
```

## 🔧 Rollback (Se Necessário)

### Restaurar Backup
```sql
-- Restaurar tabela original
DROP TABLE public.braiders CASCADE;
CREATE TABLE public.braiders AS SELECT * FROM braiders_backup;
-- Recriar constraints e índices originais...
```

## 📱 Atualização da Aplicação

### Tipo TypeScript Atualizado
```typescript
export type Braider = {
  // ... campos existentes
  whatsapp?: string
  instagram?: string
  district?: string
  // ... outros novos campos
}
```

### Função addBraider Atualizada
```typescript
const result = await addBraider({
  // ... dados existentes
  whatsapp: personalData.whatsapp,
  instagram: personalData.instagram,
  district: locationData.district,
  // ... outros novos campos
})
```

## 🎉 Benefícios da Atualização

1. **Dados Completos**: Formulário salva todos os campos preenchidos
2. **Busca Avançada**: Filtros por localização e especialidade
3. **Validação Robusta**: Constraints garantem integridade dos dados
4. **Performance**: Índices otimizam consultas
5. **Escalabilidade**: Schema preparado para funcionalidades futuras

## 📞 Suporte

Se encontrar problemas durante a migração:

1. Verifique os logs do Supabase
2. Execute o script de verificação
3. Consulte a documentação dos erros específicos
4. Considere fazer rollback se necessário

---

**⚠️ Importante**: 
- Execute sempre em ambiente de desenvolvimento primeiro
- Faça backup antes da migração
- Teste todas as funcionalidades após a atualização