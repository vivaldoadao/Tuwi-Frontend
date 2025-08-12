-- =====================================================
-- DADOS INICIAIS DO SISTEMA DE PROMOÇÕES
-- =====================================================
-- Configurações padrão e pacotes iniciais

-- =====================================================
-- CONFIGURAÇÕES DO SISTEMA
-- =====================================================

INSERT INTO public.promotion_settings (key, value, description, category, is_public) VALUES

-- Sistema geral
('system_enabled', 'true', 'Sistema de promoções ativo globalmente', 'system', true),
('payments_enabled', 'false', 'Cobrança de pagamentos ativa (false = período gratuito)', 'payments', true),
('free_trial_enabled', 'true', 'Permite uso gratuito temporário', 'trial', true),
('free_trial_days', '7', 'Dias de teste gratuito para novos usuários', 'trial', false),

-- Limites do sistema
('max_hero_banners', '3', 'Máximo de banners no hero section simultaneamente', 'limits', true),
('max_highlighted_profiles', '15', 'Máximo de perfis em destaque simultaneamente', 'limits', true),
('max_active_promotions_per_user', '5', 'Máximo de promoções ativas por trancista', 'limits', false),

-- Aprovação e moderação
('auto_approval_profiles', 'true', 'Aprovação automática para perfis destacados', 'approval', false),
('hero_requires_approval', 'true', 'Banners do hero precisam aprovação admin', 'approval', false),
('moderation_enabled', 'true', 'Sistema de moderação ativo', 'approval', false),

-- Preços e descontos
('default_currency', '"EUR"', 'Moeda padrão do sistema', 'pricing', true),
('discount_first_purchase', '20', 'Desconto percentual na primeira compra', 'pricing', false),
('seasonal_discount', '0', 'Desconto sazonal ativo (percentual)', 'pricing', false),

-- Notificações
('email_notifications', 'true', 'Envio de notificações por email', 'notifications', false),
('reminder_days_before_expiry', '[2, 7]', 'Dias antes do vencimento para enviar lembretes', 'notifications', false),
('admin_notification_email', '"admin@wilnaratranças.com"', 'Email para notificações administrativas', 'notifications', false),

-- Analytics e relatórios
('analytics_retention_days', '90', 'Dias para manter dados de analytics', 'analytics', false),
('public_stats_enabled', 'false', 'Mostrar estatísticas públicas do sistema', 'analytics', true),

-- Funcionalidades avançadas
('combo_packages_enabled', 'true', 'Pacotes combo disponíveis', 'features', true),
('geographic_targeting', 'false', 'Segmentação geográfica (futuro)', 'features', false),
('scheduling_promotions', 'true', 'Agendamento de promoções futuras', 'features', false),

-- Interface e UX
('show_promotion_badge', 'true', 'Mostrar badges de destaque nos perfis', 'ui', true),
('badge_animation', 'true', 'Animações nos badges de destaque', 'ui', true),
('hero_rotation_interval', '8', 'Intervalo de rotação dos banners hero (segundos)', 'ui', true)

ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- =====================================================
-- PACOTES DE PROMOÇÃO DISPONÍVEIS
-- =====================================================

INSERT INTO public.promotion_packages (
  name, 
  description, 
  type, 
  duration_days, 
  price, 
  original_price,
  features, 
  is_active, 
  is_featured, 
  sort_order, 
  color, 
  icon
) VALUES 

-- PERFIL EM DESTAQUE
('Destaque Básico', 
 'Seu perfil aparece nas primeiras posições da lista de trancistas por uma semana completa.',
 'profile_highlight', 
 7, 
 5.00, 
 7.00,
 '["badge_destaque", "posicao_prioritaria", "analytics_basicas", "visibilidade_aumentada"]',
 true, 
 false, 
 1, 
 '#3B82F6', 
 'star'),

('Destaque Popular', 
 'Duas semanas de visibilidade máxima com badge especial e estatísticas detalhadas.',
 'profile_highlight', 
 15, 
 12.00, 
 15.00,
 '["badge_destaque", "posicao_prioritaria", "analytics_detalhadas", "suporte_prioritario", "badge_popular"]',
 true, 
 true, 
 2, 
 '#10B981', 
 'trending-up'),

('Destaque Premium', 
 'Um mês completo de máxima visibilidade com todos os benefícios incluídos.',
 'profile_highlight', 
 30, 
 20.00, 
 25.00,
 '["badge_destaque", "posicao_prioritaria", "analytics_avancadas", "suporte_prioritario", "badge_premium", "destaque_geografico", "relatorio_mensal"]',
 true, 
 false, 
 3, 
 '#8B5CF6', 
 'crown'),

-- BANNER NO HERO
('Banner Semanal', 
 'Seu serviço ou produto em destaque na página principal por 7 dias.',
 'hero_banner', 
 7, 
 15.00, 
 20.00,
 '["banner_homepage", "analytics_clicks", "design_personalizado", "aproval_rapida"]',
 true, 
 false, 
 4, 
 '#F59E0B', 
 'megaphone'),

('Banner Premium', 
 'Duas semanas de exposição máxima na homepage com design diferenciado.',
 'hero_banner', 
 14, 
 25.00, 
 35.00,
 '["banner_homepage", "analytics_avancadas", "design_premium", "posicao_prioritaria", "cta_personalizado"]',
 true, 
 true, 
 5, 
 '#EF4444', 
 'zap'),

-- PACOTES COMBO
('Visibilidade Total', 
 'Combo completo: perfil em destaque + banner hero. Máxima exposição garantida!',
 'combo', 
 30, 
 35.00, 
 45.00,
 '["perfil_destaque_30d", "banner_hero_14d", "analytics_premium", "suporte_prioritario", "badge_vip", "relatorios_personalizados"]',
 true, 
 true, 
 6, 
 '#EC4899', 
 'gift'),

('Pacote Crescimento', 
 'Ideal para trancistas que querem crescer rapidamente. Inclui consultoria de perfil.',
 'combo', 
 60, 
 60.00, 
 80.00,
 '["perfil_destaque_60d", "banner_hero_30d", "consultoria_perfil", "foto_profissional", "otimizacao_seo", "analytics_empresariais"]',
 true, 
 false, 
 7, 
 '#059669', 
 'rocket')

ON CONFLICT DO NOTHING;

-- =====================================================
-- EXEMPLO DE PROMOÇÃO ATIVA (para demonstração)
-- =====================================================

-- Vamos inserir uma promoção de exemplo se houver usuários
DO $$
DECLARE
  demo_user_id UUID;
BEGIN
  -- Buscar um usuário com role 'braider' para exemplo
  SELECT id INTO demo_user_id 
  FROM auth.users 
  WHERE raw_user_meta_data->>'role' = 'braider' 
  LIMIT 1;
  
  -- Se encontrou um usuário, criar promoção demo
  IF demo_user_id IS NOT NULL THEN
    INSERT INTO public.promotions (
      user_id,
      type,
      title,
      description,
      start_date,
      end_date,
      status,
      is_paid,
      content_data,
      price,
      metadata
    ) VALUES (
      demo_user_id,
      'profile_highlight',
      'Perfil em Destaque - Demo',
      'Promoção demonstrativa do sistema',
      NOW(),
      NOW() + INTERVAL '7 days',
      'active',
      false, -- Gratuito durante teste
      '{"badge_type": "premium", "position_boost": 10, "highlight_color": "#10B981"}',
      0.00,
      '{"demo": true, "created_by": "system"}'
    );
  END IF;
END $$;

-- =====================================================
-- FUNÇÕES DE CONVENIÊNCIA PARA DESENVOLVIMENTO
-- =====================================================

-- Função para resetar sistema (apenas desenvolvimento)
CREATE OR REPLACE FUNCTION public.reset_promotions_system()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Apenas admins podem executar
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem resetar o sistema';
  END IF;
  
  -- Cancelar todas promoções ativas
  UPDATE public.promotions SET status = 'cancelled' WHERE status = 'active';
  
  -- Limpar analytics (manter últimos 7 dias)
  DELETE FROM public.promotion_analytics 
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  RETURN 'Sistema resetado com sucesso';
END;
$$;

-- Função para ativar modo pago
CREATE OR REPLACE FUNCTION public.enable_paid_mode()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Apenas admins podem executar
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem ativar modo pago';
  END IF;
  
  -- Ativar pagamentos
  UPDATE public.promotion_settings 
  SET value = 'true', updated_at = NOW() 
  WHERE key = 'payments_enabled';
  
  -- Desativar trial gratuito
  UPDATE public.promotion_settings 
  SET value = 'false', updated_at = NOW() 
  WHERE key = 'free_trial_enabled';
  
  RETURN 'Modo pago ativado com sucesso! 💰';
END;
$$;

-- Função para obter configurações públicas
CREATE OR REPLACE FUNCTION public.get_public_promotion_settings()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  settings JSONB;
BEGIN
  SELECT json_object_agg(key, value) INTO settings
  FROM public.promotion_settings
  WHERE is_public = true;
  
  RETURN COALESCE(settings, '{}'::jsonb);
END;
$$;

-- =====================================================
-- VIEWS ÚTEIS PARA RELATÓRIOS
-- =====================================================

-- View de promoções com dados do usuário
CREATE OR REPLACE VIEW public.promotions_with_user AS
SELECT 
  p.*,
  COALESCE(u.raw_user_meta_data->>'name', u.email) as user_name,
  u.email as user_email,
  u.raw_user_meta_data->>'role' as user_role
FROM public.promotions p
JOIN auth.users u ON u.id = p.user_id;

-- View de estatísticas por usuário
CREATE OR REPLACE VIEW public.user_promotion_stats AS
SELECT 
  p.user_id,
  COUNT(*) as total_promotions,
  COUNT(*) FILTER (WHERE p.status = 'active') as active_promotions,
  SUM(p.price) as total_spent,
  AVG(p.views_count) as avg_views,
  MAX(p.created_at) as last_promotion
FROM public.promotions p
GROUP BY p.user_id;

-- =====================================================
-- TRIGGERS PARA AUTOMAÇÕES
-- =====================================================

-- Trigger para notificar admin quando nova promoção hero é criada
CREATE OR REPLACE FUNCTION public.notify_admin_new_hero_banner()
RETURNS TRIGGER AS $$
BEGIN
  -- Se é banner hero e requer aprovação
  IF NEW.type = 'hero_banner' AND (
    SELECT value::boolean FROM public.promotion_settings 
    WHERE key = 'hero_requires_approval'
  ) THEN
    -- Inserir notificação para admins
    INSERT INTO public.promotion_notifications (
      user_id,
      promotion_id,
      type,
      title,
      message,
      channels
    )
    SELECT 
      u.id,
      NEW.id,
      'promotion_created',
      'Novo banner Hero para aprovação',
      'Uma nova promoção de banner hero foi criada e precisa da sua aprovação.',
      '["in_app", "email"]'
    FROM auth.users u
    WHERE u.raw_user_meta_data->>'role' = 'admin';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_admin_new_hero_trigger
  AFTER INSERT ON public.promotions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_hero_banner();

-- Trigger para auto-expirar promoções
CREATE OR REPLACE FUNCTION public.auto_expire_promotions()
RETURNS TRIGGER AS $$
BEGIN
  -- Esta função será chamada por um cron job
  UPDATE public.promotions 
  SET status = 'expired'
  WHERE status = 'active' AND end_date <= NOW();
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

SELECT 'Dados iniciais do sistema de promoções inseridos com sucesso! 🚀' as message;
SELECT 'Sistema configurado em modo GRATUITO. Use enable_paid_mode() para ativar cobrança.' as note;