-- FASE 1: Criar tabelas em falta para migração de dados mock
-- Data: 2025-08-10
-- Objetivo: Suporte para NotificationsContext e Reviews System

-- ===== 1. NOTIFICATIONS SYSTEM =====

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'order', 'message', 'booking', 'system')),
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,
  action_url TEXT,
  action_label VARCHAR,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification settings table
CREATE TABLE public.notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  enable_toasts BOOLEAN DEFAULT true,
  enable_sound BOOLEAN DEFAULT true,
  enable_desktop BOOLEAN DEFAULT false,
  auto_mark_as_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 2. REVIEWS SYSTEM =====

-- Product reviews table (separada da reviews existente que é para braiders)
CREATE TABLE public.product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified BOOLEAN DEFAULT false, -- se é de compra verificada
  is_public BOOLEAN DEFAULT true,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id, order_id) -- Um review por usuário por produto por pedido
);

-- ===== 3. ENABLE ROW LEVEL SECURITY =====

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- ===== 4. RLS POLICIES =====

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true); -- Sistema pode criar notificações

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());

-- Notification settings policies
CREATE POLICY "Users can view their own settings" ON public.notification_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own settings" ON public.notification_settings
  FOR ALL USING (user_id = auth.uid());

-- Product reviews policies
CREATE POLICY "Anyone can view public product reviews" ON public.product_reviews
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create product reviews for their orders" ON public.product_reviews
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND 
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own product reviews" ON public.product_reviews
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own product reviews" ON public.product_reviews
  FOR DELETE USING (user_id = auth.uid());

-- ===== 5. INDEXES FOR PERFORMANCE =====

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(user_id, is_read);

-- Product reviews indexes
CREATE INDEX idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX idx_product_reviews_user_id ON public.product_reviews(user_id);
CREATE INDEX idx_product_reviews_rating ON public.product_reviews(product_id, rating);
CREATE INDEX idx_product_reviews_public ON public.product_reviews(product_id, is_public);

-- ===== 6. TRIGGERS FOR UPDATED_AT =====

CREATE TRIGGER update_notifications_updated_at 
  BEFORE UPDATE ON public.notifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at 
  BEFORE UPDATE ON public.notification_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_reviews_updated_at 
  BEFORE UPDATE ON public.product_reviews 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== 7. FUNCTIONS FOR PRODUCT RATINGS =====

-- Function to calculate product average rating
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar a tabela products com rating agregado
  UPDATE public.products 
  SET 
    -- Vamos adicionar estas colunas depois se necessário
    updated_at = NOW()
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Trigger para atualizar ratings quando review é adicionado/removido/atualizado
CREATE TRIGGER update_product_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- ===== 8. HELPER FUNCTIONS =====

-- Function to get product rating stats
CREATE OR REPLACE FUNCTION get_product_rating_stats(product_uuid UUID)
RETURNS TABLE (
  average_rating DECIMAL(3,2),
  total_reviews INTEGER,
  rating_distribution JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(rating), 0)::DECIMAL(3,2) as average_rating,
    COUNT(*)::INTEGER as total_reviews,
    jsonb_object_agg(
      rating::TEXT, 
      review_count
    ) as rating_distribution
  FROM (
    SELECT 
      rating,
      COUNT(*) as review_count
    FROM public.product_reviews 
    WHERE product_id = product_uuid 
      AND is_public = true
    GROUP BY rating
  ) rating_counts;
END;
$$ language 'plpgsql';

-- Function to get user's unread notifications count
CREATE OR REPLACE FUNCTION get_unread_notifications_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM public.notifications 
    WHERE user_id = user_uuid 
      AND is_read = false
  );
END;
$$ language 'plpgsql';

-- ===== 9. COMMENT DOCUMENTATION =====

COMMENT ON TABLE public.notifications IS 'Notificações do sistema para usuários';
COMMENT ON TABLE public.notification_settings IS 'Configurações de notificação por usuário';
COMMENT ON TABLE public.product_reviews IS 'Reviews e avaliações de produtos';

COMMENT ON COLUMN public.notifications.metadata IS 'Dados adicionais em JSON (orderId, braiderId, etc)';
COMMENT ON COLUMN public.product_reviews.is_verified IS 'Se o review é de uma compra verificada';
COMMENT ON COLUMN public.product_reviews.helpful_count IS 'Quantas pessoas marcaram como útil';