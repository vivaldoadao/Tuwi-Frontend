-- SCRIPT PARA POPULAR TRANSAÇÕES DE COMISSÕES - DADOS DE EXEMPLO
-- Execute este script para testar o sistema de comissões

-- 1. Verificar se as tabelas existem
\echo 'Verificando tabelas...'

-- 2. Inserir dados de exemplo apenas se não existirem
INSERT INTO public.platform_transactions (
    braider_id,
    booking_id,
    service_amount,
    commission_rate,
    commission_amount,
    braider_payout,
    status,
    is_simulated,
    created_at,
    updated_at
) 
SELECT 
    braiders.id as braider_id,
    NULL as booking_id, -- Sem booking específico por enquanto
    ROUND((50 + random() * 100)::numeric, 2) as service_amount, -- Entre €50-150
    0.10 as commission_rate,
    ROUND((50 + random() * 100)::numeric * 0.10, 2) as commission_amount,
    ROUND((50 + random() * 100)::numeric * 0.90, 2) as braider_payout,
    CASE 
        WHEN random() < 0.7 THEN 'completed'
        WHEN random() < 0.9 THEN 'pending' 
        ELSE 'failed'
    END as status,
    true as is_simulated,
    NOW() - INTERVAL '1 day' * FLOOR(random() * 30) as created_at, -- Últimos 30 dias
    NOW() - INTERVAL '1 day' * FLOOR(random() * 30) as updated_at
FROM public.braiders 
WHERE braiders.status = 'approved'
AND NOT EXISTS (
    SELECT 1 FROM public.platform_transactions 
    WHERE platform_transactions.braider_id = braiders.id
)
CROSS JOIN generate_series(1, 5); -- 5 transações por trancista

-- 3. Atualizar algumas transações como processadas (pagas)
UPDATE public.platform_transactions 
SET 
    processed_at = created_at + INTERVAL '2 days',
    updated_at = NOW()
WHERE status = 'completed' 
  AND processed_at IS NULL
  AND random() < 0.8; -- 80% das completed têm processed_at

-- 4. Inserir algumas métricas de exemplo
INSERT INTO public.braider_metrics (
    braider_id,
    month_year,
    total_bookings,
    completed_bookings,
    cancelled_bookings,
    total_revenue,
    potential_commission,
    average_booking_value,
    profile_views,
    contact_attempts,
    conversion_rate
)
SELECT 
    braiders.id as braider_id,
    DATE_TRUNC('month', NOW()) as month_year,
    COUNT(pt.*) as total_bookings,
    COUNT(pt.*) FILTER (WHERE pt.status = 'completed') as completed_bookings,
    COUNT(pt.*) FILTER (WHERE pt.status = 'failed') as cancelled_bookings,
    COALESCE(SUM(pt.service_amount), 0) as total_revenue,
    COALESCE(SUM(pt.commission_amount), 0) as potential_commission,
    COALESCE(AVG(pt.service_amount), 0) as average_booking_value,
    FLOOR(random() * 200 + 50) as profile_views, -- 50-250 views
    FLOOR(random() * 50 + 10) as contact_attempts, -- 10-60 contatos
    ROUND((random() * 30 + 20)::numeric, 2) as conversion_rate -- 20-50% conversão
FROM public.braiders
LEFT JOIN public.platform_transactions pt ON pt.braider_id = braiders.id
    AND pt.created_at >= DATE_TRUNC('month', NOW())
WHERE braiders.status = 'approved'
GROUP BY braiders.id
ON CONFLICT (braider_id, month_year) DO UPDATE SET
    total_bookings = EXCLUDED.total_bookings,
    completed_bookings = EXCLUDED.completed_bookings,
    cancelled_bookings = EXCLUDED.cancelled_bookings,
    total_revenue = EXCLUDED.total_revenue,
    potential_commission = EXCLUDED.potential_commission,
    average_booking_value = EXCLUDED.average_booking_value,
    updated_at = NOW();

-- 5. Mostrar estatísticas criadas
\echo ''
\echo '📊 ESTATÍSTICAS CRIADAS:'
\echo '========================'

SELECT 
    'Total de transações criadas: ' || COUNT(*) as estatistica
FROM public.platform_transactions
UNION ALL
SELECT 
    'Transações concluídas: ' || COUNT(*) as estatistica  
FROM public.platform_transactions
WHERE status = 'completed'
UNION ALL
SELECT 
    'Transações pendentes: ' || COUNT(*) as estatistica
FROM public.platform_transactions  
WHERE status = 'pending'
UNION ALL
SELECT 
    'Receita total simulada: €' || ROUND(SUM(service_amount), 2) as estatistica
FROM public.platform_transactions
UNION ALL
SELECT 
    'Comissões totais: €' || ROUND(SUM(commission_amount), 2) as estatistica
FROM public.platform_transactions
UNION ALL
SELECT 
    'Trancistas com métricas: ' || COUNT(*) as estatistica
FROM public.braider_metrics;

-- 6. Mostrar exemplo de dados por trancista
\echo ''
\echo '👩‍🦱 EXEMPLO DE DADOS POR TRANCISTA:'
\echo '===================================='

SELECT 
    b.name as "Nome da Trancista",
    COUNT(pt.*) as "Total Transações",
    COUNT(pt.*) FILTER (WHERE pt.status = 'completed') as "Concluídas",
    COUNT(pt.*) FILTER (WHERE pt.status = 'pending') as "Pendentes",
    COALESCE(SUM(pt.service_amount), 0) as "Receita Total (€)",
    COALESCE(SUM(pt.commission_amount), 0) as "Comissões (€)",
    COALESCE(SUM(pt.braider_payout), 0) as "Ganhos Líquidos (€)"
FROM public.braiders b
LEFT JOIN public.platform_transactions pt ON pt.braider_id = b.id
WHERE b.status = 'approved'
GROUP BY b.id, b.name
ORDER BY "Receita Total (€)" DESC
LIMIT 5;

\echo ''
\echo '✅ Script de seed executado com sucesso!'
\echo '🔗 Agora você pode testar o sistema de comissões no dashboard das trancistas'