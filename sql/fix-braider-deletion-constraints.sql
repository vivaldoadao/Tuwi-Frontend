-- ============================================================================
-- FIX: Correção de Constraints para Permitir Deleção de Braiders
-- ============================================================================
-- 
-- PROBLEMA: Constraint ON DELETE RESTRICT na tabela bookings impede deleção de braiders
-- SOLUÇÃO: Alterar para ON DELETE CASCADE ou implementar deleção em cascata manual
--
-- Criado para resolver: "não consigo deletar um braider"
-- ============================================================================

BEGIN;

-- 1. ANÁLISE ATUAL: Verificar constraints existentes
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'braiders'
ORDER BY tc.table_name;

-- 2. CORREÇÃO: Alterar constraint da tabela bookings
-- Primeiro, remover o constraint existente
ALTER TABLE IF EXISTS public.bookings 
DROP CONSTRAINT IF EXISTS bookings_braider_id_fkey;

-- Recriar com ON DELETE CASCADE para permitir deleção
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_braider_id_fkey 
FOREIGN KEY (braider_id) 
REFERENCES public.braiders(id) ON DELETE CASCADE;

-- 3. VERIFICAÇÃO: Checar se há bookings que impedem deleção
CREATE OR REPLACE FUNCTION check_braider_dependencies(p_braider_id UUID)
RETURNS TABLE(
    table_name TEXT,
    count_records BIGINT,
    blocking BOOLEAN
) AS $$
BEGIN
    -- Verificar bookings
    RETURN QUERY
    SELECT 
        'bookings'::TEXT,
        COUNT(*)::BIGINT,
        (COUNT(*) > 0 AND bool_or(status IN ('pending', 'confirmed')))::BOOLEAN
    FROM public.bookings 
    WHERE braider_id = p_braider_id;
    
    -- Verificar reviews
    RETURN QUERY
    SELECT 
        'reviews'::TEXT,
        COUNT(*)::BIGINT,
        FALSE::BOOLEAN  -- Reviews não bloqueiam, serão deletadas em cascata
    FROM public.reviews 
    WHERE braider_id = p_braider_id;
    
    -- Verificar services
    RETURN QUERY
    SELECT 
        'services'::TEXT,
        COUNT(*)::BIGINT,
        FALSE::BOOLEAN  -- Services serão deletadas em cascata
    FROM public.services 
    WHERE braider_id = p_braider_id;
    
    -- Verificar availability
    RETURN QUERY
    SELECT 
        'braider_availability'::TEXT,
        COUNT(*)::BIGINT,
        FALSE::BOOLEAN  -- Availability será deletada em cascata
    FROM public.braider_availability 
    WHERE braider_id = p_braider_id;
    
    -- Verificar ratings
    RETURN QUERY
    SELECT 
        'ratings'::TEXT,
        COUNT(*)::BIGINT,
        FALSE::BOOLEAN  -- Ratings serão deletadas em cascata
    FROM public.ratings 
    WHERE braider_id = p_braider_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FUNÇÃO DE DELEÇÃO SEGURA
CREATE OR REPLACE FUNCTION safe_delete_braider(p_braider_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    dependencies RECORD;
    has_blocking BOOLEAN := FALSE;
BEGIN
    -- Verificar dependências que podem bloquear
    FOR dependencies IN 
        SELECT * FROM check_braider_dependencies(p_braider_id)
    LOOP
        IF dependencies.blocking THEN
            has_blocking := TRUE;
            EXIT;
        END IF;
    END LOOP;
    
    -- Se há dependências bloqueadoras, retornar erro
    IF has_blocking THEN
        SELECT json_build_object(
            'success', FALSE,
            'error', 'Cannot delete braider with active bookings',
            'dependencies', json_agg(
                json_build_object(
                    'table', dependencies.table_name,
                    'count', dependencies.count_records,
                    'blocking', dependencies.blocking
                )
            )
        ) INTO result
        FROM check_braider_dependencies(p_braider_id) dependencies;
        
        RETURN result;
    END IF;
    
    -- Proceder com deleção (CASCADE fará o resto)
    DELETE FROM public.braiders WHERE id = p_braider_id;
    
    -- Verificar se foi deletado
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Braider not found or could not be deleted'
        );
    END IF;
    
    RETURN json_build_object(
        'success', TRUE,
        'message', 'Braider deleted successfully',
        'braider_id', p_braider_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Database error: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. POLÍTICAS RLS PARA DELEÇÃO (Se não existirem)
-- Verificar se existe política de DELETE para admins
DO $$
BEGIN
    -- Tentar criar política para admins deletarem braiders
    EXECUTE 'CREATE POLICY "Admins can delete braiders" ON public.braiders
        FOR DELETE USING (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = ''admin''
            )
        )';
EXCEPTION
    WHEN duplicate_object THEN
        NULL; -- Política já existe
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating DELETE policy: %', SQLERRM;
END $$;

-- 6. VERIFICAÇÃO FINAL
-- Listar todos os constraints relacionados a braiders após as correções
SELECT 
    'AFTER FIXES - Foreign keys to braiders:' as info,
    tc.table_name, 
    kcu.column_name, 
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'braiders'
ORDER BY tc.table_name;

COMMIT;

-- ============================================================================
-- INSTRUÇÕES DE USO:
-- ============================================================================
-- 
-- 1. Execute este script no banco de dados
-- 2. Para verificar dependências antes de deletar:
--    SELECT * FROM check_braider_dependencies('uuid-do-braider');
-- 
-- 3. Para deletar um braider com segurança:
--    SELECT safe_delete_braider('uuid-do-braider');
-- 
-- 4. Para deletar via API, use a função safe_delete_braider
-- ============================================================================