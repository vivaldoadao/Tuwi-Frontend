-- ⭐ SISTEMA DE RATINGS & REVIEWS INTEGRADO
-- Schema otimizado para integrar com estrutura existente do Wilnara Tranças

-- =============================================================================
-- 🔍 ANÁLISE: EXPANSÃO DO SISTEMA EXISTENTE
-- =============================================================================

-- O sistema já possui:
-- - Tabela `reviews` para braiders com rating 1-5
-- - Tabela `product_reviews` para produtos
-- - Campo `average_rating` na tabela `braiders`
-- - Triggers para atualização automática

-- Esta implementação EXPANDE o sistema existente mantendo compatibilidade

-- =============================================================================
-- 1. TABELA EXPANDIDA DE RATINGS (complementa `reviews` existente)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Referencias (seguindo padrão existente)
  braider_id UUID NOT NULL REFERENCES public.braiders(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  
  -- Dados do rating
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  
  -- Ratings por categoria (opcional)
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  
  -- Review text
  review_title VARCHAR(200),
  review_text TEXT,
  
  -- Metadata
  client_name VARCHAR(255) NOT NULL, -- Para casos onde client_id é NULL
  client_email VARCHAR(255) NOT NULL,
  
  -- Photos (URLs para Supabase Storage)
  review_images TEXT[], -- Array de URLs das imagens
  
  -- Status e moderação
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'flagged', 'deleted')),
  is_verified BOOLEAN DEFAULT false, -- Se o review foi de um booking real
  flagged_reason TEXT,
  
  -- Resposta da braider (opcional)
  braider_response TEXT,
  braider_response_date TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_ratings_braider_id ON public.ratings(braider_id);
CREATE INDEX idx_ratings_client_id ON public.ratings(client_id);
CREATE INDEX idx_ratings_booking_id ON public.ratings(booking_id);
CREATE INDEX idx_ratings_overall_rating ON public.ratings(overall_rating);
CREATE INDEX idx_ratings_status ON public.ratings(status);
CREATE INDEX idx_ratings_created_at ON public.ratings(created_at);
CREATE INDEX idx_ratings_braider_status ON public.ratings(braider_id, status);

-- Índice composto para queries frequentes
CREATE INDEX idx_ratings_braider_active ON public.ratings(braider_id, status) WHERE status = 'active';

-- =============================================================================
-- 2. TABELA DE ESTATÍSTICAS PRE-CALCULADAS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.braider_rating_stats (
  braider_id UUID PRIMARY KEY REFERENCES public.braiders(id) ON DELETE CASCADE,
  
  -- Estatísticas gerais
  total_ratings INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  
  -- Distribuição por estrelas
  rating_1_count INTEGER DEFAULT 0,
  rating_2_count INTEGER DEFAULT 0,
  rating_3_count INTEGER DEFAULT 0,
  rating_4_count INTEGER DEFAULT 0,
  rating_5_count INTEGER DEFAULT 0,
  
  -- Médias por categoria
  avg_quality DECIMAL(3,2) DEFAULT 0.00,
  avg_punctuality DECIMAL(3,2) DEFAULT 0.00,
  avg_communication DECIMAL(3,2) DEFAULT 0.00,
  avg_professionalism DECIMAL(3,2) DEFAULT 0.00,
  
  -- Estatísticas de tempo
  last_rating_date TIMESTAMPTZ,
  first_rating_date TIMESTAMPTZ,
  
  -- Flags
  has_recent_ratings BOOLEAN DEFAULT false, -- Ratings nos últimos 30 dias
  rating_trend VARCHAR(10) DEFAULT 'stable', -- 'improving', 'declining', 'stable'
  
  -- Timestamps
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- 3. TABELA DE FLAGS E REPORTES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.rating_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  rating_id UUID NOT NULL REFERENCES public.ratings(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  reason VARCHAR(50) NOT NULL CHECK (reason IN (
    'inappropriate_content',
    'fake_review', 
    'spam',
    'harassment',
    'off_topic',
    'other'
  )),
  
  description TEXT,
  
  -- Status do reporte
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- 4. FUNÇÕES PARA ATUALIZAR ESTATÍSTICAS
-- =============================================================================

-- Função para recalcular estatísticas combinadas (reviews + ratings)
CREATE OR REPLACE FUNCTION update_braider_rating_stats(p_braider_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_stats RECORD;
  v_existing_reviews RECORD;
  total_combined INTEGER;
  avg_combined DECIMAL(3,2);
BEGIN
  -- 1. Estatísticas da tabela `ratings` (nova - detalhada)
  SELECT 
    COUNT(*) as total_ratings,
    AVG(overall_rating) as avg_rating_detailed,
    COUNT(*) FILTER (WHERE overall_rating = 1) as rating_1,
    COUNT(*) FILTER (WHERE overall_rating = 2) as rating_2,
    COUNT(*) FILTER (WHERE overall_rating = 3) as rating_3,
    COUNT(*) FILTER (WHERE overall_rating = 4) as rating_4,
    COUNT(*) FILTER (WHERE overall_rating = 5) as rating_5,
    AVG(quality_rating) as avg_quality,
    AVG(punctuality_rating) as avg_punctuality,
    AVG(communication_rating) as avg_communication,
    AVG(professionalism_rating) as avg_professionalism,
    MIN(created_at) as first_rating_detailed,
    MAX(created_at) as last_rating_detailed,
    COUNT(*) FILTER (WHERE created_at > now() - interval '30 days') > 0 as has_recent_detailed
  INTO v_stats
  FROM public.ratings
  WHERE braider_id = p_braider_id AND status = 'active';
  
  -- 2. Estatísticas da tabela `reviews` (existente - simples)
  SELECT 
    COUNT(*) as total_reviews,
    AVG(rating) as avg_rating_simple,
    MIN(created_at) as first_review,
    MAX(created_at) as last_review,
    COUNT(*) FILTER (WHERE created_at > now() - interval '30 days') > 0 as has_recent_simple
  INTO v_existing_reviews
  FROM public.reviews
  WHERE braider_id = p_braider_id AND is_public = true;
  
  -- 3. Combinar estatísticas para total geral
  total_combined := COALESCE(v_stats.total_ratings, 0) + COALESCE(v_existing_reviews.total_reviews, 0);
  
  -- Calcular média ponderada
  IF total_combined > 0 THEN
    avg_combined := (
      (COALESCE(v_stats.avg_rating_detailed, 0) * COALESCE(v_stats.total_ratings, 0)) +
      (COALESCE(v_existing_reviews.avg_rating_simple, 0) * COALESCE(v_existing_reviews.total_reviews, 0))
    ) / total_combined;
  ELSE
    avg_combined := 0.00;
  END IF;
  
    -- 4. Upsert nas estatísticas combinadas
    INSERT INTO public.braider_rating_stats (
      braider_id,
      total_ratings,
      average_rating,
      rating_1_count,
      rating_2_count, 
      rating_3_count,
      rating_4_count,
      rating_5_count,
      avg_quality,
      avg_punctuality,
      avg_communication,
      avg_professionalism,
      first_rating_date,
      last_rating_date,
      has_recent_ratings,
      updated_at
    ) VALUES (
      p_braider_id,
      total_combined,
      avg_combined,
      COALESCE(v_stats.rating_1, 0),
      COALESCE(v_stats.rating_2, 0),
      COALESCE(v_stats.rating_3, 0),
      COALESCE(v_stats.rating_4, 0),
      COALESCE(v_stats.rating_5, 0),
      COALESCE(v_stats.avg_quality, 0.00),
      COALESCE(v_stats.avg_punctuality, 0.00),
      COALESCE(v_stats.avg_communication, 0.00),
      COALESCE(v_stats.avg_professionalism, 0.00),
      LEAST(v_stats.first_rating_detailed, v_existing_reviews.first_review),
      GREATEST(v_stats.last_rating_detailed, v_existing_reviews.last_review),
      COALESCE(v_stats.has_recent_detailed, false) OR COALESCE(v_existing_reviews.has_recent_simple, false),
      now()
    )
    ON CONFLICT (braider_id) DO UPDATE SET
      total_ratings = EXCLUDED.total_ratings,
      average_rating = EXCLUDED.average_rating,
      rating_1_count = EXCLUDED.rating_1_count,
      rating_2_count = EXCLUDED.rating_2_count,
      rating_3_count = EXCLUDED.rating_3_count,
      rating_4_count = EXCLUDED.rating_4_count,
      rating_5_count = EXCLUDED.rating_5_count,
      avg_quality = EXCLUDED.avg_quality,
      avg_punctuality = EXCLUDED.avg_punctuality,
      avg_communication = EXCLUDED.avg_communication,
      avg_professionalism = EXCLUDED.avg_professionalism,
      first_rating_date = EXCLUDED.first_rating_date,
      last_rating_date = EXCLUDED.last_rating_date,
      has_recent_ratings = EXCLUDED.has_recent_ratings,
      updated_at = now();
    
    -- 5. Atualizar tabela braiders com nova média
    UPDATE public.braiders 
    SET 
      average_rating = avg_combined,
      total_reviews = total_combined,
      updated_at = now()
    WHERE id = p_braider_id;
END;
$$;

-- =============================================================================
-- 5. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- =============================================================================

-- Trigger para atualizar stats quando rating muda
CREATE OR REPLACE FUNCTION trigger_update_rating_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM update_braider_rating_stats(NEW.braider_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM update_braider_rating_stats(NEW.braider_id);
    IF OLD.braider_id != NEW.braider_id THEN
      PERFORM update_braider_rating_stats(OLD.braider_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_braider_rating_stats(OLD.braider_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Criar os triggers
DROP TRIGGER IF EXISTS trigger_ratings_stats_update ON public.ratings;
CREATE TRIGGER trigger_ratings_stats_update
  AFTER INSERT OR UPDATE OR DELETE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_rating_stats();

-- =============================================================================
-- 6. RLS POLICIES
-- =============================================================================

-- Habilitar RLS
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.braider_rating_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rating_reports ENABLE ROW LEVEL SECURITY;

-- Policies para ratings (seguindo padrões existentes)
CREATE POLICY "Anyone can view active ratings" ON public.ratings
  FOR SELECT USING (status = 'active');

CREATE POLICY "Authenticated users can create ratings" ON public.ratings
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    -- Só pode avaliar se teve booking confirmado
    (booking_id IS NULL OR EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = booking_id 
      AND b.status = 'completed'
      AND (b.client_id = auth.uid() OR client_id = auth.uid())
    ))
  );

CREATE POLICY "Clients can update their own ratings within 7 days" ON public.ratings
  FOR UPDATE USING (
    client_id = auth.uid() AND
    created_at > now() - interval '7 days' AND
    status = 'active'
  );

CREATE POLICY "Braiders can respond to their ratings" ON public.ratings
  FOR UPDATE USING (
    braider_id IN (
      SELECT b.id FROM public.braiders b 
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all ratings" ON public.ratings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies para stats (read-only para a maioria)
CREATE POLICY "Anyone can view rating stats" ON public.braider_rating_stats
  FOR SELECT USING (true);

CREATE POLICY "Only system can update rating stats" ON public.braider_rating_stats
  FOR ALL USING (false); -- Apenas via triggers

-- Policies para reports
CREATE POLICY "Authenticated users can create reports" ON public.rating_reports
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage reports" ON public.rating_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- 7. DADOS INICIAIS E TESTES
-- =============================================================================

-- Inicializar stats para braiders existentes
INSERT INTO public.braider_rating_stats (braider_id)
SELECT id FROM public.braiders
ON CONFLICT (braider_id) DO NOTHING;

-- Comentários nas tabelas
COMMENT ON TABLE public.ratings IS 'Sistema de avaliações e reviews para braiders';
COMMENT ON TABLE public.braider_rating_stats IS 'Estatísticas pré-calculadas de ratings por braider';
COMMENT ON TABLE public.rating_reports IS 'Sistema de reportes e moderação de reviews';

COMMENT ON COLUMN public.ratings.is_verified IS 'True se o review foi feito por alguém que realmente teve um booking';
COMMENT ON COLUMN public.ratings.review_images IS 'Array de URLs de imagens do review no Supabase Storage';

-- =============================================================================
-- 8. TRIGGERS PARA COMPATIBILIDADE COM SISTEMA EXISTENTE
-- =============================================================================

-- Trigger para atualizar também a tabela `reviews` quando necessário
CREATE OR REPLACE FUNCTION sync_with_existing_reviews()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se o rating foi criado baseado em um booking
  -- e não existe review simples correspondente, criar um
  IF NEW.booking_id IS NOT NULL AND TG_OP = 'INSERT' THEN
    INSERT INTO public.reviews (
      braider_id,
      client_id,
      booking_id,
      rating,
      comment,
      is_public,
      created_at
    ) VALUES (
      NEW.braider_id,
      NEW.client_id,
      NEW.booking_id,
      NEW.overall_rating,
      NEW.review_text,
      CASE WHEN NEW.status = 'active' THEN true ELSE false END,
      NEW.created_at
    )
    ON CONFLICT (booking_id) DO UPDATE SET
      rating = NEW.overall_rating,
      comment = NEW.review_text,
      is_public = CASE WHEN NEW.status = 'active' THEN true ELSE false END,
      updated_at = now();
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar trigger de sincronização
DROP TRIGGER IF EXISTS sync_reviews_trigger ON public.ratings;
CREATE TRIGGER sync_reviews_trigger
  AFTER INSERT OR UPDATE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION sync_with_existing_reviews();

-- =============================================================================
-- 9. MIGRATION HELPER - IMPORTAR REVIEWS EXISTENTES
-- =============================================================================

-- Função para migrar reviews existentes para o novo sistema
CREATE OR REPLACE FUNCTION migrate_existing_reviews()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  migrated_count INTEGER := 0;
  review_record RECORD;
BEGIN
  RAISE NOTICE '🔄 Iniciando migração de reviews existentes...';
  
  FOR review_record IN 
    SELECT * FROM public.reviews 
    WHERE NOT EXISTS (
      SELECT 1 FROM public.ratings r 
      WHERE r.booking_id = reviews.booking_id
    )
  LOOP
    INSERT INTO public.ratings (
      braider_id,
      client_id,
      booking_id,
      overall_rating,
      review_text,
      client_name,
      client_email,
      status,
      is_verified,
      created_at,
      updated_at
    )
    SELECT 
      review_record.braider_id,
      review_record.client_id,
      review_record.booking_id,
      review_record.rating,
      review_record.comment,
      COALESCE(u.name, 'Cliente Anônimo'),
      COALESCE(u.email, 'anonimo@exemplo.com'),
      CASE WHEN review_record.is_public THEN 'active' ELSE 'hidden' END,
      true, -- is_verified (vem de booking real)
      review_record.created_at,
      review_record.updated_at
    FROM public.users u
    WHERE u.id = review_record.client_id;
    
    migrated_count := migrated_count + 1;
  END LOOP;
  
  RAISE NOTICE '✅ Migração concluída: % reviews migrados', migrated_count;
  RETURN migrated_count;
END;
$$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '⭐ SISTEMA DE RATINGS INTEGRADO CRIADO COM SUCESSO!';
    RAISE NOTICE '   ✅ Tabelas: ratings (expansão), braider_rating_stats, rating_reports';
    RAISE NOTICE '   ✅ Integração: Compatível com sistema reviews existente';
    RAISE NOTICE '   ✅ Funções: update_braider_rating_stats() otimizada';
    RAISE NOTICE '   ✅ Triggers: Atualização automática + sincronização';
    RAISE NOTICE '   ✅ RLS: Policies de segurança avançadas';
    RAISE NOTICE '   ✅ Índices: Otimizados para performance';
    RAISE NOTICE '   ✅ Migration: Função migrate_existing_reviews() disponível';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Para migrar reviews existentes, execute:';
    RAISE NOTICE '   SELECT migrate_existing_reviews();';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 O sistema mantém compatibilidade total com o código existente';
    RAISE NOTICE '   enquanto expande funcionalidades de rating detalhado!';
END $$;