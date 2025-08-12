-- =========================================
-- FUNÇÕES RPC PARA ANALYTICS DE PROMOÇÕES
-- =========================================

-- Função para incrementar receita de promoção
CREATE OR REPLACE FUNCTION public.increment_promotion_revenue(
  promotion_id UUID,
  revenue_amount DECIMAL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Incrementar receita gerada
  UPDATE public.promotions 
  SET 
    revenue_generated = COALESCE(revenue_generated, 0) + revenue_amount,
    updated_at = NOW()
  WHERE id = promotion_id;
  
  -- Registrar na tabela de analytics se necessário
  INSERT INTO public.promotion_analytics (
    promotion_id,
    event_type,
    data,
    created_at
  ) VALUES (
    promotion_id,
    'revenue_update',
    jsonb_build_object('amount', revenue_amount),
    NOW()
  );
END;
$$;

-- Função para obter estatísticas gerais de promoções
CREATE OR REPLACE FUNCTION public.get_promotion_statistics(
  date_from TIMESTAMP DEFAULT NULL,
  date_to TIMESTAMP DEFAULT NULL
)
RETURNS TABLE(
  total_promotions INTEGER,
  active_promotions INTEGER,
  total_views BIGINT,
  total_clicks BIGINT,
  total_contacts BIGINT,
  total_conversions BIGINT,
  total_revenue DECIMAL,
  total_investment DECIMAL,
  average_ctr DECIMAL,
  average_cvr DECIMAL,
  overall_roi DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  from_date TIMESTAMP;
  to_date TIMESTAMP;
BEGIN
  -- Definir datas padrão se não fornecidas
  from_date := COALESCE(date_from, NOW() - INTERVAL '30 days');
  to_date := COALESCE(date_to, NOW());
  
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_promotions,
    COUNT(*) FILTER (WHERE status = 'active')::INTEGER as active_promotions,
    COALESCE(SUM(views_count), 0)::BIGINT as total_views,
    COALESCE(SUM(clicks_count), 0)::BIGINT as total_clicks,
    COALESCE(SUM(contacts_count), 0)::BIGINT as total_contacts,
    COALESCE(SUM(conversions_count), 0)::BIGINT as total_conversions,
    COALESCE(SUM(revenue_generated), 0)::DECIMAL as total_revenue,
    COALESCE(SUM(investment_amount), 0)::DECIMAL as total_investment,
    CASE 
      WHEN SUM(views_count) > 0 
      THEN (SUM(clicks_count)::DECIMAL / SUM(views_count) * 100)::DECIMAL(5,2)
      ELSE 0
    END as average_ctr,
    CASE 
      WHEN SUM(clicks_count) > 0 
      THEN (SUM(conversions_count)::DECIMAL / SUM(clicks_count) * 100)::DECIMAL(5,2)
      ELSE 0
    END as average_cvr,
    CASE 
      WHEN SUM(investment_amount) > 0 
      THEN (((SUM(revenue_generated) - SUM(investment_amount)) / SUM(investment_amount)) * 100)::DECIMAL(5,2)
      ELSE 0
    END as overall_roi
  FROM public.promotions
  WHERE created_at >= from_date 
    AND created_at <= to_date;
END;
$$;

-- Função para obter top promoções por performance
CREATE OR REPLACE FUNCTION public.get_top_performing_promotions(
  limit_count INTEGER DEFAULT 10,
  date_from TIMESTAMP DEFAULT NULL,
  date_to TIMESTAMP DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  title VARCHAR,
  type VARCHAR,
  views_count INTEGER,
  clicks_count INTEGER,
  contacts_count INTEGER,
  conversions_count INTEGER,
  revenue_generated DECIMAL,
  investment_amount DECIMAL,
  ctr DECIMAL,
  cvr DECIMAL,
  roi DECIMAL,
  status VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  from_date TIMESTAMP;
  to_date TIMESTAMP;
BEGIN
  from_date := COALESCE(date_from, NOW() - INTERVAL '30 days');
  to_date := COALESCE(date_to, NOW());
  
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.type,
    COALESCE(p.views_count, 0)::INTEGER,
    COALESCE(p.clicks_count, 0)::INTEGER,
    COALESCE(p.contacts_count, 0)::INTEGER,
    COALESCE(p.conversions_count, 0)::INTEGER,
    COALESCE(p.revenue_generated, 0)::DECIMAL,
    COALESCE(p.investment_amount, 0)::DECIMAL,
    CASE 
      WHEN p.views_count > 0 
      THEN (p.clicks_count::DECIMAL / p.views_count * 100)::DECIMAL(5,2)
      ELSE 0
    END as ctr,
    CASE 
      WHEN p.clicks_count > 0 
      THEN (p.conversions_count::DECIMAL / p.clicks_count * 100)::DECIMAL(5,2)
      ELSE 0
    END as cvr,
    CASE 
      WHEN p.investment_amount > 0 
      THEN (((p.revenue_generated - p.investment_amount) / p.investment_amount) * 100)::DECIMAL(5,2)
      ELSE 0
    END as roi,
    p.status
  FROM public.promotions p
  WHERE p.created_at >= from_date 
    AND p.created_at <= to_date
  ORDER BY 
    CASE 
      WHEN p.investment_amount > 0 
      THEN ((p.revenue_generated - p.investment_amount) / p.investment_amount) * 100
      ELSE 0
    END DESC,
    p.views_count DESC
  LIMIT limit_count;
END;
$$;

-- Função para obter dados de analytics temporais (para gráficos)
CREATE OR REPLACE FUNCTION public.get_promotion_analytics_timeline(
  promotion_id_param UUID DEFAULT NULL,
  date_from TIMESTAMP DEFAULT NULL,
  date_to TIMESTAMP DEFAULT NULL,
  interval_type VARCHAR DEFAULT 'day'
)
RETURNS TABLE(
  period TEXT,
  views_count BIGINT,
  clicks_count BIGINT,
  contacts_count BIGINT,
  conversions_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  from_date TIMESTAMP;
  to_date TIMESTAMP;
  date_trunc_format TEXT;
BEGIN
  from_date := COALESCE(date_from, NOW() - INTERVAL '30 days');
  to_date := COALESCE(date_to, NOW());
  
  -- Definir formato de agrupamento baseado no intervalo
  CASE interval_type
    WHEN 'hour' THEN date_trunc_format := 'hour';
    WHEN 'day' THEN date_trunc_format := 'day';
    WHEN 'week' THEN date_trunc_format := 'week';
    WHEN 'month' THEN date_trunc_format := 'month';
    ELSE date_trunc_format := 'day';
  END CASE;
  
  RETURN QUERY
  EXECUTE format('
    SELECT 
      TO_CHAR(DATE_TRUNC(%L, pa.created_at), ''YYYY-MM-DD HH24:MI'') as period,
      COUNT(*) FILTER (WHERE pa.event_type = ''view'')::BIGINT as views_count,
      COUNT(*) FILTER (WHERE pa.event_type = ''click'')::BIGINT as clicks_count,
      COUNT(*) FILTER (WHERE pa.event_type = ''contact'')::BIGINT as contacts_count,
      COUNT(*) FILTER (WHERE pa.event_type = ''conversion'')::BIGINT as conversions_count
    FROM public.promotion_analytics pa
    WHERE pa.created_at >= %L 
      AND pa.created_at <= %L
      %s
    GROUP BY DATE_TRUNC(%L, pa.created_at)
    ORDER BY DATE_TRUNC(%L, pa.created_at)
  ', 
    date_trunc_format,
    from_date,
    to_date,
    CASE WHEN promotion_id_param IS NOT NULL 
         THEN format('AND pa.promotion_id = %L', promotion_id_param)
         ELSE '' END,
    date_trunc_format,
    date_trunc_format
  );
END;
$$;

-- Função para obter métricas de uma promoção específica
CREATE OR REPLACE FUNCTION public.get_promotion_detailed_metrics(
  promotion_id_param UUID
)
RETURNS TABLE(
  promotion_id UUID,
  title VARCHAR,
  type VARCHAR,
  status VARCHAR,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  views_count INTEGER,
  clicks_count INTEGER,
  contacts_count INTEGER,
  conversions_count INTEGER,
  revenue_generated DECIMAL,
  investment_amount DECIMAL,
  ctr DECIMAL,
  cvr DECIMAL,
  roi DECIMAL,
  cost_per_click DECIMAL,
  cost_per_conversion DECIMAL,
  days_active INTEGER,
  avg_daily_views DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as promotion_id,
    p.title,
    p.type,
    p.status,
    p.start_date,
    p.end_date,
    COALESCE(p.views_count, 0)::INTEGER,
    COALESCE(p.clicks_count, 0)::INTEGER,
    COALESCE(p.contacts_count, 0)::INTEGER,
    COALESCE(p.conversions_count, 0)::INTEGER,
    COALESCE(p.revenue_generated, 0)::DECIMAL,
    COALESCE(p.investment_amount, 0)::DECIMAL,
    CASE 
      WHEN p.views_count > 0 
      THEN (p.clicks_count::DECIMAL / p.views_count * 100)::DECIMAL(5,2)
      ELSE 0
    END as ctr,
    CASE 
      WHEN p.clicks_count > 0 
      THEN (p.conversions_count::DECIMAL / p.clicks_count * 100)::DECIMAL(5,2)
      ELSE 0
    END as cvr,
    CASE 
      WHEN p.investment_amount > 0 
      THEN (((p.revenue_generated - p.investment_amount) / p.investment_amount) * 100)::DECIMAL(5,2)
      ELSE 0
    END as roi,
    CASE 
      WHEN p.clicks_count > 0 
      THEN (p.investment_amount / p.clicks_count)::DECIMAL(5,2)
      ELSE 0
    END as cost_per_click,
    CASE 
      WHEN p.conversions_count > 0 
      THEN (p.investment_amount / p.conversions_count)::DECIMAL(5,2)
      ELSE 0
    END as cost_per_conversion,
    EXTRACT(DAY FROM COALESCE(p.end_date, NOW()) - p.start_date)::INTEGER as days_active,
    CASE 
      WHEN EXTRACT(DAY FROM COALESCE(p.end_date, NOW()) - p.start_date) > 0 
      THEN (p.views_count::DECIMAL / EXTRACT(DAY FROM COALESCE(p.end_date, NOW()) - p.start_date))::DECIMAL(5,2)
      ELSE 0
    END as avg_daily_views
  FROM public.promotions p
  WHERE p.id = promotion_id_param;
END;
$$;

-- Função para limpar dados antigos de analytics (manutenção)
CREATE OR REPLACE FUNCTION public.cleanup_old_promotion_analytics(
  days_to_keep INTEGER DEFAULT 90
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
  cutoff_date TIMESTAMP;
BEGIN
  cutoff_date := NOW() - (days_to_keep || ' days')::INTERVAL;
  
  DELETE FROM public.promotion_analytics 
  WHERE created_at < cutoff_date;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log da operação de limpeza
  INSERT INTO public.promotion_analytics (
    promotion_id,
    event_type,
    data,
    created_at
  ) VALUES (
    NULL,
    'cleanup',
    jsonb_build_object(
      'deleted_records', deleted_count,
      'cutoff_date', cutoff_date,
      'days_kept', days_to_keep
    ),
    NOW()
  );
  
  RETURN deleted_count;
END;
$$;

-- Função para obter resumo de performance por tipo de promoção
CREATE OR REPLACE FUNCTION public.get_promotion_type_summary(
  date_from TIMESTAMP DEFAULT NULL,
  date_to TIMESTAMP DEFAULT NULL
)
RETURNS TABLE(
  promotion_type VARCHAR,
  total_promotions BIGINT,
  active_promotions BIGINT,
  total_views BIGINT,
  total_clicks BIGINT,
  total_conversions BIGINT,
  total_revenue DECIMAL,
  total_investment DECIMAL,
  avg_ctr DECIMAL,
  avg_cvr DECIMAL,
  avg_roi DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  from_date TIMESTAMP;
  to_date TIMESTAMP;
BEGIN
  from_date := COALESCE(date_from, NOW() - INTERVAL '30 days');
  to_date := COALESCE(date_to, NOW());
  
  RETURN QUERY
  SELECT 
    p.type as promotion_type,
    COUNT(*) as total_promotions,
    COUNT(*) FILTER (WHERE p.status = 'active') as active_promotions,
    COALESCE(SUM(p.views_count), 0) as total_views,
    COALESCE(SUM(p.clicks_count), 0) as total_clicks,
    COALESCE(SUM(p.conversions_count), 0) as total_conversions,
    COALESCE(SUM(p.revenue_generated), 0) as total_revenue,
    COALESCE(SUM(p.investment_amount), 0) as total_investment,
    CASE 
      WHEN SUM(p.views_count) > 0 
      THEN AVG(p.clicks_count::DECIMAL / NULLIF(p.views_count, 0) * 100)::DECIMAL(5,2)
      ELSE 0
    END as avg_ctr,
    CASE 
      WHEN SUM(p.clicks_count) > 0 
      THEN AVG(p.conversions_count::DECIMAL / NULLIF(p.clicks_count, 0) * 100)::DECIMAL(5,2)
      ELSE 0
    END as avg_cvr,
    CASE 
      WHEN SUM(p.investment_amount) > 0 
      THEN AVG(((p.revenue_generated - p.investment_amount) / NULLIF(p.investment_amount, 0)) * 100)::DECIMAL(5,2)
      ELSE 0
    END as avg_roi
  FROM public.promotions p
  WHERE p.created_at >= from_date 
    AND p.created_at <= to_date
  GROUP BY p.type
  ORDER BY total_revenue DESC;
END;
$$;