# Análise de Limpeza de Arquivos - Marketplace Wilnara

## 📊 Resumo da Análise
- **Total SQL**: 127 arquivos
- **Scripts identificados**: 35+ arquivos
- **Arquivos seguros para deletar**: ~80+ arquivos

## ✅ ARQUIVOS SEGUROS PARA DELETAR

### 1. **Log Files (Desenvolvimento)**
```
clean-restart.log
dev-final.log
dev-new.log
dev.log
final-test.log
test-final.log
server.log
```

### 2. **SQL Debug/Temporários (Root)**
```
CHECK-EXISTING-TABLES.sql
DEBUG-PAYMENTS-SETTING.sql
debug-chat.sql
create-test-braider.sql
```

### 3. **Test Files JavaScript**
```
test-braider-existence.js
test-braiders.js
test-tracking-flow.js
test-tracking-system.js
```

### 4. **Backup Files**
```
app/dashboard/promotions/page.tsx.backup
app/dashboard/promotions/page.tsx.backup2
lib/sync-users.ts
```

### 5. **SQL Duplicados/Experimentais (Supabase)**
```
supabase/test-phase1-schemas.sql
supabase/test-phase2-ratings.sql
supabase/test-phase3-notifications.sql
supabase/diagnose-current-state.sql
supabase/diagnose-user-data.sql
supabase/quick-check.sql
supabase/quick-verify.sql
supabase/test-*.sql (múltiplos)
```

### 6. **Scripts de Debug/Test (Scripts/)**
```
scripts/test-*.js (múltiplos)
scripts/check-*.js (alguns)
scripts/diagnose-db.js
```

## ⚠️ MANTER (Arquivos Ativos)

### **SQL Essenciais**
- `supabase/schema.sql` ✅ Usado em scripts/setup-db.js
- `supabase/functions.sql` ✅ Usado em scripts/setup-db.js
- `COMPREHENSIVE-DATABASE-FIX.sql` ✅ Usado em API
- `sql/*.sql` ✅ Documentados

### **Scripts Ativos**
- `scripts/setup-db.js` ✅ Documentado em SETUP.md
- `scripts/migrate-to-supabase.js` ✅ Documentado
- `scripts/final-system-test.js` ✅ Criado recentemente

## 🎯 ESTRATÉGIA DE LIMPEZA

### **Fase 1**: Arquivos 100% Seguros
- Log files
- Test files JavaScript
- Backup files
- Debug SQL files

### **Fase 2**: SQL Experimentais Supabase
- Test files
- Diagnostic files
- Quick check files

### **Fase 3**: Scripts Redundantes
- Scripts de teste não utilizados
- Scripts experimentais

## 📋 PRÓXIMOS PASSOS
1. Criar backup completo
2. Deletar fase 1 (seguros)
3. Revisar fase 2 (Supabase)
4. Limpar fase 3 (scripts)
5. Validar sistema ainda funciona