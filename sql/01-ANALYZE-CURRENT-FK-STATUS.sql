-- =====================================================
-- ANÁLISE DO ESTADO ATUAL DAS FOREIGN KEYS
-- =====================================================
-- Script para verificar quais tabelas estão referenciando auth.users vs public.users

\echo '🔍 ANALISANDO FOREIGN KEYS ATUAIS...'
\echo ''

-- 1. Verificar todas as FK que referenciam auth.users
\echo '❌ FOREIGN KEYS REFERENCIANDO auth.users (PRECISAM CORREÇÃO):'
SELECT 
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
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
    AND ccu.table_schema = 'auth'
    AND ccu.table_name = 'users'
ORDER BY tc.table_name;

\echo ''
\echo '✅ FOREIGN KEYS REFERENCIANDO public.users (CORRETAS):'
SELECT 
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
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
    AND ccu.table_schema = 'public'
    AND ccu.table_name = 'users'
ORDER BY tc.table_name;

\echo ''
\echo '📊 RESUMO DO ESTADO ATUAL:'
-- Contar FKs problemáticas
WITH fk_counts AS (
    SELECT 
        'auth.users' as reference_table,
        COUNT(*) as count
    FROM information_schema.table_constraints tc 
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND ccu.table_schema = 'auth'
      AND ccu.table_name = 'users'
    
    UNION ALL
    
    SELECT 
        'public.users' as reference_table,
        COUNT(*) as count
    FROM information_schema.table_constraints tc 
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND ccu.table_schema = 'public'
      AND ccu.table_name = 'users'
)
SELECT 
    reference_table,
    count,
    CASE 
        WHEN reference_table = 'auth.users' THEN '❌ PRECISAM CORREÇÃO'
        ELSE '✅ ESTÃO CORRETAS'
    END as status
FROM fk_counts;

\echo ''
\echo '📋 TABELAS E COLUNAS COM user_id PARA VERIFICAÇÃO:'
SELECT 
    table_schema,
    table_name,
    column_name,
    is_nullable,
    column_default,
    data_type
FROM information_schema.columns
WHERE 
    (column_name = 'user_id' OR column_name = 'updated_by' OR column_name = 'created_by')
    AND table_schema = 'public'
    AND table_name NOT LIKE '%_backup%'
ORDER BY table_name, column_name;