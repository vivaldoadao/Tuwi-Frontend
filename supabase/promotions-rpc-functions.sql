-- =====================================================
-- FUNÇÕES RPC PARA SISTEMA DE PROMOÇÕES
-- =====================================================
-- Funções auxiliares para operações específicas

-- Função para incrementar contadores de promoção de forma atomic
CREATE OR REPLACE FUNCTION public.increment_promotion_counter(
  promotion_id UUID,
  field_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validar field_name para evitar SQL injection
  IF field_name NOT IN ('views_count', 'clicks_count', 'contacts_count') THEN
    RAISE EXCEPTION 'Invalid field name: %', field_name;
  END IF;

  -- Incrementar contador
  EXECUTE format('UPDATE public.promotions SET %I = %I + 1 WHERE id = $1', field_name, field_name)
  USING promotion_id;
END;
$$;

-- Função para expirar promoções automaticamente
CREATE OR REPLACE FUNCTION public.expire_promotions()
RETURNS TABLE(expired_count INTEGER, expired_ids UUID[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_promotions UUID[];
  count_expired INTEGER;
BEGIN
  -- Buscar promoções que devem expirar
  SELECT ARRAY_AGG(id) INTO expired_promotions
  FROM public.promotions
  WHERE status = 'active' 
    AND end_date <= NOW();

  -- Atualizar status para expired
  UPDATE public.promotions 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' 
    AND end_date <= NOW();

  GET DIAGNOSTICS count_expired = ROW_COUNT;

  -- Retornar resultado
  RETURN QUERY SELECT count_expired, COALESCE(expired_promotions, ARRAY[]::UUID[]);
END;
$$;

-- Função para buscar promoções que estão próximas do vencimento
CREATE OR REPLACE FUNCTION public.get_expiring_promotions(days_before INTEGER DEFAULT 2)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  title VARCHAR,
  type VARCHAR,
  end_date TIMESTAMPTZ,
  user_email TEXT,
  user_name TEXT,
  days_left INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.title,
    p.type,
    p.end_date,
    u.email as user_email,
    COALESCE(u.raw_user_meta_data->>'name', u.email) as user_name,
    EXTRACT(day FROM p.end_date - NOW())::INTEGER as days_left
  FROM public.promotions p
  JOIN auth.users u ON u.id = p.user_id
  WHERE p.status = 'active'
    AND p.end_date > NOW()
    AND p.end_date <= (NOW() + INTERVAL '1 day' * days_before)
  ORDER BY p.end_date ASC;
END;
$$;

-- Função para obter estatísticas gerais do sistema (admin)
CREATE OR REPLACE FUNCTION public.get_promotion_system_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats JSONB;
  total_promotions INTEGER;
  active_promotions INTEGER;
  total_revenue DECIMAL;
  total_views BIGINT;
  total_clicks BIGINT;
BEGIN
  -- Verificar se é admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Contar promoções
  SELECT COUNT(*) INTO total_promotions FROM public.promotions;
  SELECT COUNT(*) INTO active_promotions FROM public.promotions WHERE status = 'active';

  -- Calcular receita total
  SELECT COALESCE(SUM(amount), 0) INTO total_revenue 
  FROM public.promotion_transactions 
  WHERE status = 'completed';

  -- Somar views e clicks totais
  SELECT COALESCE(SUM(views_count), 0) INTO total_views FROM public.promotions;
  SELECT COALESCE(SUM(clicks_count), 0) INTO total_clicks FROM public.promotions;

  -- Montar JSON com estatísticas
  stats := jsonb_build_object(
    'total_promotions', total_promotions,
    'active_promotions', active_promotions,
    'total_revenue', total_revenue,
    'total_views', total_views,
    'total_clicks', total_clicks,
    'ctr_percentage', CASE 
      WHEN total_views > 0 THEN ROUND((total_clicks::DECIMAL / total_views * 100), 2)
      ELSE 0 
    END,
    'avg_revenue_per_promotion', CASE 
      WHEN total_promotions > 0 THEN ROUND(total_revenue / total_promotions, 2)
      ELSE 0 
    END,
    'generated_at', NOW()
  );

  RETURN stats;
END;
$$;

-- Função para limpar dados antigos de analytics
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Apenas admin pode executar
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Deletar analytics antigos
  DELETE FROM public.promotion_analytics 
  WHERE created_at < (NOW() - INTERVAL '1 day' * retention_days);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$;

-- Função para validar dados de promoção antes de inserir
CREATE OR REPLACE FUNCTION public.validate_promotion_data()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validar datas
  IF NEW.start_date >= NEW.end_date THEN
    RAISE EXCEPTION 'Start date must be before end date';
  END IF;

  -- Validar duração máxima (1 ano)
  IF NEW.end_date > NEW.start_date + INTERVAL '365 days' THEN
    RAISE EXCEPTION 'Promotion duration cannot exceed 365 days';
  END IF;

  -- Validar price não negativo
  IF NEW.price < 0 THEN
    RAISE EXCEPTION 'Price cannot be negative';
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger para validação
DROP TRIGGER IF EXISTS validate_promotion_trigger ON public.promotions;
CREATE TRIGGER validate_promotion_trigger
  BEFORE INSERT OR UPDATE ON public.promotions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_promotion_data();

-- Função para buscar usuários que podem criar promoções (braiders ativos)
CREATE OR REPLACE FUNCTION public.get_eligible_promotion_users()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  active_promotions_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Apenas admin pode executar
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'name', u.email) as name,
    COALESCE(u.raw_user_meta_data->>'role', 'user') as role,
    COUNT(p.id) as active_promotions_count
  FROM auth.users u
  LEFT JOIN public.promotions p ON p.user_id = u.id AND p.status = 'active'
  WHERE u.raw_user_meta_data->>'role' IN ('braider', 'admin')
  GROUP BY u.id, u.email, u.raw_user_meta_data
  ORDER BY u.email;
END;
$$;

-- Função para resetar sistema (apenas desenvolvimento/teste)
CREATE OR REPLACE FUNCTION public.reset_promotion_system_dev()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Apenas admin pode executar
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Cancelar todas promoções ativas
  UPDATE public.promotions 
  SET status = 'cancelled', updated_at = NOW() 
  WHERE status = 'active';

  -- Limpar analytics (manter últimos 7 dias)
  DELETE FROM public.promotion_analytics 
  WHERE created_at < NOW() - INTERVAL '7 days';

  -- Resetar contadores
  UPDATE public.promotions 
  SET views_count = 0, clicks_count = 0, contacts_count = 0
  WHERE created_at < NOW() - INTERVAL '7 days';

  RETURN 'Development reset completed successfully';
END;
$$;

SELECT '✅ Funções RPC do sistema de promoções criadas com sucesso!' as message;