-- ⭐ SISTEMA DE RATINGS & REVIEWS - VERSÃO CORRIGIDA
-- Schema otimizado e testado para o Wilnara Tranças

-- =============================================================================
-- 1. TABELA PRINCIPAL DE RATINGS
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
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  
  -- Photos (URLs para Supabase Storage)
  review_images TEXT[], -- Array de URLs das imagens
  
  -- Status e moderação
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'flagged', 'deleted')),
  is_verified BOOLEAN DEFAULT false,
  flagged_reason TEXT,
  
  -- Resposta da braider (opcional)
  braider_response TEXT,
  braider_response_date TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ratings_braider_id ON public.ratings(braider_id);
CREATE INDEX IF NOT EXISTS idx_ratings_client_id ON public.ratings(client_id);
CREATE INDEX IF NOT EXISTS idx_ratings_booking_id ON public.ratings(booking_id);
CREATE INDEX IF NOT EXISTS idx_ratings_overall_rating ON public.ratings(overall_rating);
CREATE INDEX IF NOT EXISTS idx_ratings_status ON public.ratings(status);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON public.ratings(created_at);
CREATE INDEX IF NOT EXISTS idx_ratings_braider_status ON public.ratings(braider_id, status);
CREATE INDEX IF NOT EXISTS idx_ratings_braider_active ON public.ratings(braider_id, status) WHERE status = 'active';

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
  has_recent_ratings BOOLEAN DEFAULT false,
  rating_trend VARCHAR(10) DEFAULT 'stable',
  
  -- Timestamps
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- 3. TABELA DE FLAGS E REPORTES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.rating_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
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
-- 4. FUNÇÃO SIMPLIFICADA PARA ATUALIZAR ESTATÍSTICAS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_braider_rating_stats(p_braider_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_total INTEGER;
  v_average DECIMAL(3,2);
  v_rating_1 INTEGER;
  v_rating_2 INTEGER;
  v_rating_3 INTEGER;
  v_rating_4 INTEGER;
  v_rating_5 INTEGER;
  v_avg_quality DECIMAL(3,2);
  v_avg_punctuality DECIMAL(3,2);
  v_avg_communication DECIMAL(3,2);
  v_avg_professionalism DECIMAL(3,2);
  v_first_rating TIMESTAMPTZ;
  v_last_rating TIMESTAMPTZ;
  v_has_recent BOOLEAN;
BEGIN
  -- Calcular estatísticas básicas
  SELECT 
    COUNT(*),
    AVG(overall_rating),
    COUNT(*) FILTER (WHERE overall_rating = 1),
    COUNT(*) FILTER (WHERE overall_rating = 2),
    COUNT(*) FILTER (WHERE overall_rating = 3),
    COUNT(*) FILTER (WHERE overall_rating = 4),
    COUNT(*) FILTER (WHERE overall_rating = 5),
    MIN(created_at),
    MAX(created_at),
    COUNT(*) FILTER (WHERE created_at > now() - interval '30 days') > 0
  INTO
    v_total,
    v_average,
    v_rating_1,
    v_rating_2,
    v_rating_3,
    v_rating_4,
    v_rating_5,
    v_first_rating,
    v_last_rating,
    v_has_recent
  FROM public.ratings
  WHERE braider_id = p_braider_id AND status = 'active';
  
  -- Calcular médias detalhadas
  SELECT 
    AVG(quality_rating) FILTER (WHERE quality_rating IS NOT NULL),
    AVG(punctuality_rating) FILTER (WHERE punctuality_rating IS NOT NULL),
    AVG(communication_rating) FILTER (WHERE communication_rating IS NOT NULL),
    AVG(professionalism_rating) FILTER (WHERE professionalism_rating IS NOT NULL)
  INTO
    v_avg_quality,
    v_avg_punctuality,
    v_avg_communication,
    v_avg_professionalism
  FROM public.ratings
  WHERE braider_id = p_braider_id AND status = 'active';
  
  -- Upsert nas estatísticas
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
    COALESCE(v_total, 0),
    COALESCE(v_average, 0.00),
    COALESCE(v_rating_1, 0),
    COALESCE(v_rating_2, 0),
    COALESCE(v_rating_3, 0),
    COALESCE(v_rating_4, 0),
    COALESCE(v_rating_5, 0),
    COALESCE(v_avg_quality, 0.00),
    COALESCE(v_avg_punctuality, 0.00),
    COALESCE(v_avg_communication, 0.00),
    COALESCE(v_avg_professionalism, 0.00),
    v_first_rating,
    v_last_rating,
    COALESCE(v_has_recent, false),
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
    
  -- Atualizar tabela braiders também
  UPDATE public.braiders 
  SET 
    average_rating = COALESCE(v_average, 0.00),
    total_reviews = COALESCE(v_total, 0),
    updated_at = now()
  WHERE id = p_braider_id;
END;
$$;

-- =============================================================================
-- 5. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- =============================================================================

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

-- Criar o trigger
DROP TRIGGER IF EXISTS trigger_ratings_stats_update ON public.ratings;
CREATE TRIGGER trigger_ratings_stats_update
  AFTER INSERT OR UPDATE OR DELETE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_rating_stats();

-- =============================================================================
-- 6. RLS POLICIES (SIMPLIFICADAS)
-- =============================================================================

-- Habilitar RLS
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.braider_rating_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rating_reports ENABLE ROW LEVEL SECURITY;

-- Policies básicas para ratings
DROP POLICY IF EXISTS "Anyone can view active ratings" ON public.ratings;
CREATE POLICY "Anyone can view active ratings" ON public.ratings
  FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Authenticated users can create ratings" ON public.ratings;
CREATE POLICY "Authenticated users can create ratings" ON public.ratings
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Clients can update their own ratings within 7 days" ON public.ratings;
CREATE POLICY "Clients can update their own ratings within 7 days" ON public.ratings
  FOR UPDATE USING (
    client_id = auth.uid() AND
    created_at > now() - interval '7 days' AND
    status = 'active'
  );

DROP POLICY IF EXISTS "Braiders can respond to their ratings" ON public.ratings;
CREATE POLICY "Braiders can respond to their ratings" ON public.ratings
  FOR UPDATE USING (
    braider_id IN (
      SELECT b.id FROM public.braiders b 
      WHERE b.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage all ratings" ON public.ratings;
CREATE POLICY "Admins can manage all ratings" ON public.ratings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies para stats
DROP POLICY IF EXISTS "Anyone can view rating stats" ON public.braider_rating_stats;
CREATE POLICY "Anyone can view rating stats" ON public.braider_rating_stats
  FOR SELECT USING (true);

-- Policies para reports
DROP POLICY IF EXISTS "Authenticated users can create reports" ON public.rating_reports;
CREATE POLICY "Authenticated users can create reports" ON public.rating_reports
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage reports" ON public.rating_reports;
CREATE POLICY "Admins can manage reports" ON public.rating_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- 7. DADOS INICIAIS
-- =============================================================================

-- Inicializar stats para braiders existentes
INSERT INTO public.braider_rating_stats (braider_id)
SELECT id FROM public.braiders
ON CONFLICT (braider_id) DO NOTHING;

-- Comentários nas tabelas
COMMENT ON TABLE public.ratings IS 'Sistema de avaliações e reviews para braiders';
COMMENT ON TABLE public.braider_rating_stats IS 'Estatísticas pré-calculadas de ratings por braider';
COMMENT ON TABLE public.rating_reports IS 'Sistema de reportes e moderação de reviews';

-- =============================================================================
-- 8. FUNÇÃO DE MIGRAÇÃO (OPCIONAL)
-- =============================================================================

CREATE OR REPLACE FUNCTION migrate_existing_reviews()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  migrated_count INTEGER := 0;
  review_record RECORD;
BEGIN
  -- Migrar reviews existentes se a tabela existir
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviews') THEN
    FOR review_record IN 
      SELECT r.*, u.name as client_name, u.email as client_email
      FROM public.reviews r
      LEFT JOIN public.users u ON u.id = r.client_id
      WHERE NOT EXISTS (
        SELECT 1 FROM public.ratings rt 
        WHERE rt.booking_id = r.booking_id
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
      ) VALUES (
        review_record.braider_id,
        review_record.client_id,
        review_record.booking_id,
        review_record.rating,
        review_record.comment,
        COALESCE(review_record.client_name, 'Cliente Anônimo'),
        COALESCE(review_record.client_email, 'anonimo@exemplo.com'),
        CASE WHEN review_record.is_public THEN 'active' ELSE 'hidden' END,
        true,
        review_record.created_at,
        review_record.updated_at
      );
      
      migrated_count := migrated_count + 1;
    END LOOP;
  END IF;
  
  RETURN migrated_count;
END;
$$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '⭐ SISTEMA DE RATINGS CRIADO COM SUCESSO!';
    RAISE NOTICE '   ✅ Tabelas: ratings, braider_rating_stats, rating_reports';
    RAISE NOTICE '   ✅ Funções: update_braider_rating_stats(), migrate_existing_reviews()';
    RAISE NOTICE '   ✅ Triggers: Atualização automática de estatísticas';
    RAISE NOTICE '   ✅ RLS: Policies de segurança configuradas';
    RAISE NOTICE '   ✅ Índices: Otimizados para performance';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Para migrar reviews existentes (opcional):';
    RAISE NOTICE '   SELECT migrate_existing_reviews();';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Sistema pronto para uso em produção!';
END $$;