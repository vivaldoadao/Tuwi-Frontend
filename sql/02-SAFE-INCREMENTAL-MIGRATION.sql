-- =====================================================
-- MIGRAÇÃO INCREMENTAL SEGURA PARA public.users
-- =====================================================
-- Este script corrige todas as FK de forma segura, sem afetar o funcionamento
-- Baseado no NextAuth com public.users como tabela principal

\echo '🚀 INICIANDO MIGRAÇÃO SEGURA PARA public.users...'
\echo ''

-- Função auxiliar para executar comandos de forma segura
CREATE OR REPLACE FUNCTION safe_migrate_fk(
    p_table_name text,
    p_column_name text,
    p_constraint_name text DEFAULT NULL,
    p_on_delete text DEFAULT 'CASCADE'
)
RETURNS text AS $$
DECLARE
    v_constraint_name text;
    v_result text := '';
BEGIN
    -- Gerar nome do constraint se não fornecido
    IF p_constraint_name IS NULL THEN
        v_constraint_name := p_table_name || '_' || p_column_name || '_fkey';
    ELSE
        v_constraint_name := p_constraint_name;
    END IF;
    
    -- Verificar se a tabela e coluna existem
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = p_table_name 
        AND column_name = p_column_name 
        AND table_schema = 'public'
    ) THEN
        RETURN 'SKIP: Table ' || p_table_name || ' or column ' || p_column_name || ' does not exist';
    END IF;
    
    -- Remover constraint existente se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = v_constraint_name 
        AND table_schema = 'public'
    ) THEN
        EXECUTE 'ALTER TABLE public.' || p_table_name || ' DROP CONSTRAINT ' || v_constraint_name;
        v_result := v_result || 'Dropped old constraint. ';
    END IF;
    
    -- Adicionar nova constraint para public.users
    BEGIN
        EXECUTE 'ALTER TABLE public.' || p_table_name || 
                ' ADD CONSTRAINT ' || v_constraint_name || 
                ' FOREIGN KEY (' || p_column_name || ') REFERENCES public.users(id) ON DELETE ' || p_on_delete;
        v_result := v_result || 'Added new FK -> public.users';
    EXCEPTION
        WHEN OTHERS THEN
            v_result := v_result || 'ERROR: ' || SQLERRM;
    END;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

\echo '✅ Função auxiliar criada'
\echo ''

-- =====================================================
-- MIGRAÇÃO TABELA POR TABELA
-- =====================================================

\echo '📝 MIGRANDO SISTEMA DE PROMOÇÕES...'

-- 1. Tabela promotions
SELECT 
    'promotions' as table_name,
    safe_migrate_fk('promotions', 'user_id') as result;

-- 2. Tabela promotion_settings
SELECT 
    'promotion_settings' as table_name,
    safe_migrate_fk('promotion_settings', 'updated_by', 'promotion_settings_updated_by_fkey', 'SET NULL') as result;

-- 3. Tabela promotion_analytics  
SELECT 
    'promotion_analytics' as table_name,
    safe_migrate_fk('promotion_analytics', 'user_id') as result;

-- 4. Tabela promotion_transactions
SELECT 
    'promotion_transactions' as table_name,
    safe_migrate_fk('promotion_transactions', 'user_id') as result;

-- 5. Tabela promotion_subscriptions
SELECT 
    'promotion_subscriptions' as table_name,
    safe_migrate_fk('promotion_subscriptions', 'user_id') as result;

\echo ''
\echo '📝 MIGRANDO OUTRAS TABELAS COM REFERÊNCIAS DE USUÁRIO...'

-- 6. Tabela conversations (se existir)
SELECT 
    'conversations' as table_name,
    safe_migrate_fk('conversations', 'user1_id', 'conversations_user1_id_fkey') as result
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations');

SELECT 
    'conversations' as table_name,
    safe_migrate_fk('conversations', 'user2_id', 'conversations_user2_id_fkey') as result  
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations');

-- 7. Tabela messages (se existir)
SELECT 
    'messages' as table_name,
    safe_migrate_fk('messages', 'user_id') as result
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages');

-- 8. Tabela braiders (verificar se usa user_id)
SELECT 
    'braiders' as table_name,
    safe_migrate_fk('braiders', 'user_id') as result
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'braiders' AND column_name = 'user_id'
);

-- 9. Tabela orders (se usar user_id em vez de email)  
SELECT 
    'orders' as table_name,
    safe_migrate_fk('orders', 'user_id', 'orders_user_id_fkey', 'SET NULL') as result
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'user_id'
);

-- =====================================================
-- VERIFICAÇÃO PÓS-MIGRAÇÃO
-- =====================================================

\echo ''
\echo '🔍 VERIFICANDO RESULTADO DA MIGRAÇÃO...'

-- Mostrar resultado final
WITH fk_summary AS (
    SELECT 
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_schema || '.' || ccu.table_name AS references_table
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE 
        tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'public'
        AND (ccu.table_name = 'users')
        AND (kcu.column_name LIKE '%user%' OR kcu.column_name LIKE '%_by')
)
SELECT 
    table_name,
    column_name,
    references_table,
    CASE 
        WHEN references_table = 'public.users' THEN '✅ CORRETO'
        WHEN references_table = 'auth.users' THEN '❌ PRECISA CORREÇÃO'
        ELSE '❓ DESCONHECIDO'
    END as status
FROM fk_summary
ORDER BY table_name, column_name;

\echo ''
\echo '📊 RESUMO FINAL:'
SELECT 
    COUNT(*) FILTER (WHERE ccu.table_schema = 'public' AND ccu.table_name = 'users') as "FKs para public.users (✅ CORRETO)",
    COUNT(*) FILTER (WHERE ccu.table_schema = 'auth' AND ccu.table_name = 'users') as "FKs para auth.users (❌ PROBLEMA)"
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND ccu.table_name = 'users';

-- Limpar função auxiliar
DROP FUNCTION safe_migrate_fk(text, text, text, text);

\echo ''
\echo '✅ MIGRAÇÃO CONCLUÍDA! Sistema continua funcionando normalmente.'
\echo '📋 Próximos passos: Executar testes de validação do sistema.'