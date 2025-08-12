-- ===== SISTEMA DE GESTÃO DE CONTEÚDO (CMS) =====
-- Schema para gerenciar conteúdo estático do site

-- ===== 1. TABELA DE CONTEÚDOS =====

CREATE TABLE public.site_contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR UNIQUE NOT NULL, -- Chave única para identificar o conteúdo (ex: 'hero_title', 'about_us')
  title VARCHAR NOT NULL, -- Título descritivo para o admin
  content_type VARCHAR NOT NULL CHECK (content_type IN ('text', 'html', 'image', 'json')),
  content TEXT, -- Conteúdo principal
  meta_data JSONB DEFAULT '{}', -- Dados extras como alt text, configurações específicas
  page_section VARCHAR NOT NULL, -- Seção da página (hero, about, contact, footer)
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0, -- Ordem de exibição
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID
);

-- ===== 2. TABELA DE PÁGINAS =====

CREATE TABLE public.site_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR UNIQUE NOT NULL, -- URL slug (ex: 'about', 'contact')
  title VARCHAR NOT NULL, -- Título da página
  meta_title VARCHAR, -- SEO meta title
  meta_description TEXT, -- SEO meta description
  meta_keywords TEXT, -- SEO keywords
  is_published BOOLEAN DEFAULT true,
  template VARCHAR DEFAULT 'default', -- Template a ser usado
  custom_css TEXT, -- CSS personalizado para a página
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID
);

-- ===== 3. TABELA DE IMAGENS E MÍDIA =====

CREATE TABLE public.site_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename VARCHAR NOT NULL,
  original_name VARCHAR NOT NULL,
  file_path VARCHAR NOT NULL, -- Caminho no Supabase Storage
  file_size INTEGER,
  mime_type VARCHAR,
  alt_text VARCHAR,
  caption TEXT,
  width INTEGER,
  height INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID
);

-- ===== 4. TABELA DE CONFIGURAÇÕES DO SITE =====

CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  data_type VARCHAR DEFAULT 'text' CHECK (data_type IN ('text', 'number', 'boolean', 'json')),
  category VARCHAR DEFAULT 'general', -- general, seo, contact, social
  is_public BOOLEAN DEFAULT false, -- Se pode ser acessado publicamente
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID
);

-- ===== 5. ÍNDICES PARA PERFORMANCE =====

CREATE INDEX idx_site_contents_key ON public.site_contents(key);
CREATE INDEX idx_site_contents_page_section ON public.site_contents(page_section);
CREATE INDEX idx_site_contents_active ON public.site_contents(is_active);
CREATE INDEX idx_site_pages_slug ON public.site_pages(slug);
CREATE INDEX idx_site_pages_published ON public.site_pages(is_published);
CREATE INDEX idx_site_settings_key ON public.site_settings(key);
CREATE INDEX idx_site_settings_category ON public.site_settings(category);

-- ===== 6. RLS POLICIES =====

-- Conteúdos - apenas admins podem modificar, todos podem ler conteúdos ativos
ALTER TABLE public.site_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to site_contents" ON public.site_contents
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Public read active site_contents" ON public.site_contents
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Páginas - apenas admins podem modificar, todos podem ler páginas publicadas
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to site_pages" ON public.site_pages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Public read published site_pages" ON public.site_pages
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

-- Mídia - apenas admins podem modificar, todos podem ler mídia ativa
ALTER TABLE public.site_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to site_media" ON public.site_media
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Public read active site_media" ON public.site_media
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Configurações - apenas admins podem modificar, apenas configurações públicas podem ser lidas
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to site_settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Public read public site_settings" ON public.site_settings
  FOR SELECT TO anon, authenticated
  USING (is_public = true);

-- ===== 7. DADOS INICIAIS =====

-- Inserir conteúdos padrão da página principal
INSERT INTO public.site_contents (key, title, content_type, content, page_section, display_order, meta_data) VALUES

-- Hero Carousel Slides
('hero_slide_1', 'Hero Slide 1', 'json', '{"title": "WILNARA TRANÇAS", "subtitle": "Box Braids Elegantes", "description": "Realce sua beleza natural com nossas box braids profissionais. Estilo, conforto e durabilidade em cada fio trançado com perfeição.", "imageUrl": "/hero-braids.png", "ctaText": "Compre Agora", "ctaLink": "/products", "secondaryCtaText": "Ver Trancistas", "secondaryCtaLink": "/braiders"}', 'hero', 1, '{"type": "slide"}'),
('hero_slide_2', 'Hero Slide 2', 'json', '{"title": "WILNARA TRANÇAS", "subtitle": "Goddess Braids Luxuosas", "description": "Transforme seu visual com nossas goddess braids artesanais. Cada trança é uma obra de arte que celebra sua individualidade.", "imageUrl": "/hero-braids.png", "ctaText": "Explorar Estilos", "ctaLink": "/products", "secondaryCtaText": "Agendar Serviço", "secondaryCtaLink": "/braiders"}', 'hero', 2, '{"type": "slide"}'),
('hero_slide_3', 'Hero Slide 3', 'json', '{"title": "WILNARA TRANÇAS", "subtitle": "Twist Braids Modernas", "description": "Descubra a versatilidade dos twist braids. Proteção capilar e estilo combinados para um visual autêntico e contemporâneo.", "imageUrl": "/hero-braids.png", "ctaText": "Ver Coleção", "ctaLink": "/products", "secondaryCtaText": "Encontrar Profissional", "secondaryCtaLink": "/braiders"}', 'hero', 3, '{"type": "slide"}'),

-- Seção Sobre Nós
('about_hero_title', 'Título Hero About', 'text', 'Sobre a Wilnara Tranças', 'about', 1, '{}'),
('about_hero_subtitle', 'Subtítulo Hero About', 'text', 'Uma jornada de paixão pela arte das tranças, conectando tradição e modernidade para realçar a beleza natural de cada mulher.', 'about', 2, '{}'),
('about_mission_title', 'Título Missão', 'text', 'Nossa Missão', 'about', 3, '{}'),
('about_mission_content', 'Conteúdo Missão', 'html', '<p>Bem-vindo à <strong>Wilnara Tranças</strong>, seu destino online para postiços femininos de alta qualidade e tranças artesanais. Nascemos da paixão por realçar a beleza natural e a individualidade de cada mulher, oferecendo produtos que combinam tradição, modernidade e estilo.</p><p>Nossa missão é empoderar você a expressar sua identidade através de penteados versáteis e deslumbrantes. Acreditamos que cada trança e cada postiço contam uma história, e estamos aqui para ajudar você a criar a sua.</p>', 'about', 4, '{}'),
('about_mission_image', 'Imagem Missão', 'image', '/placeholder.svg?height=400&width=400&text=Nossa+História', 'about', 5, '{"alt": "História da Wilnara Tranças"}'),
('about_values', 'Valores da Empresa', 'json', '[{"title": "Paixão pela Arte", "description": "Cada trança é criada com amor e dedicação, respeitando as tradições ancestrais e abraçando técnicas modernas para resultados excepcionais.", "icon": "Heart"}, {"title": "Qualidade Premium", "description": "Trabalhamos apenas com materiais de primeira linha e técnicas que garantem durabilidade, conforto e um acabamento impecável em cada produto.", "icon": "Award"}, {"title": "Comunidade Forte", "description": "Mais que uma loja, somos uma comunidade que celebra a diversidade, conecta pessoas e fortalece a autoestima através da beleza autêntica.", "icon": "Users"}]', 'about', 6, '{}'),
('about_statistics', 'Estatísticas', 'json', '[{"value": "500+", "label": "Clientes Satisfeitas", "color": "accent"}, {"value": "50+", "label": "Produtos Únicos", "color": "brand"}, {"value": "4.9", "label": "Avaliação Média", "color": "purple"}, {"value": "3+", "label": "Anos de Experiência", "color": "green"}]', 'about', 7, '{}'),

-- Seção de Contato
('contact_hero_title', 'Título Hero Contato', 'text', 'Fale Conosco', 'contact', 1, '{}'),
('contact_hero_subtitle', 'Subtítulo Hero Contato', 'text', 'Tem alguma dúvida, sugestão ou precisa de ajuda? Nossa equipe está pronta para atendê-la com todo carinho e dedicação.', 'contact', 2, '{}'),
('contact_email', 'Email de Contato', 'text', 'contato@wilnaratranças.com', 'contact', 3, '{"label": "Email", "description": "Resposta em até 24h"}'),
('contact_phone', 'Telefone de Contato', 'text', '+351 912 345 678', 'contact', 4, '{"label": "Telefone", "description": "Seg-Sex: 9h às 18h"}'),
('contact_support', 'Suporte', 'text', 'Atendimento especializado', 'contact', 5, '{"label": "Suporte", "description": "WhatsApp e Chat online"}'),
('contact_hours', 'Horário de Atendimento', 'json', '{"weekdays": "9h às 18h", "saturday": "9h às 15h", "sunday": "Fechado"}', 'contact', 6, '{}'),
('contact_location', 'Localização', 'json', '{"name": "Wilnara Tranças", "address": "Rua das Flores, 123", "postal": "1200-001 Lisboa, Portugal", "note": "Atendimento presencial apenas com agendamento prévio"}', 'contact', 7, '{}'),

-- Seções da Homepage
('homepage_products_title', 'Título Produtos Destaque', 'text', 'Nossos Produtos em Destaque', 'homepage', 1, '{}'),
('homepage_braiders_title', 'Título Trancistas Destaque', 'text', 'Conheça Nossas Trancistas em Destaque', 'homepage', 2, '{}'),
('homepage_braiders_subtitle', 'Subtítulo Trancistas', 'text', 'Encontre profissionais talentosas e apaixonadas pela arte das tranças. Agende seu serviço com quem entende do assunto e transforme seu visual!', 'homepage', 3, '{}'),
('homepage_cta_braider_title', 'Título CTA Trancista', 'text', 'É Trancista? Junte-se à Nossa Comunidade!', 'homepage', 4, '{}'),
('homepage_cta_braider_subtitle', 'Subtítulo CTA Trancista', 'text', 'Amplie seu alcance, gerencie seus agendamentos e conecte-se com novos clientes. Cadastre-se agora e faça parte da Wilnara Tranças!', 'homepage', 5, '{}'),
('homepage_about_title', 'Título Seção About Homepage', 'text', 'A Beleza da Tradição, o Estilo da Modernidade', 'homepage', 6, '{}'),
('homepage_about_subtitle', 'Subtítulo Seção About Homepage', 'text', 'Na Wilnara Tranças, celebramos a arte e a cultura das tranças, oferecendo produtos que realçam sua identidade e confiança. Descubra a diferença de um trabalho feito com paixão e dedicação.', 'homepage', 7, '{}'),

-- Footer
('footer_description', 'Descrição do Footer', 'text', 'Wilnara Tranças - Conectando cultura e beleza através das tranças africanas.', 'footer', 1, '{}'),
('footer_social_facebook', 'Facebook URL', 'text', 'https://facebook.com/wilnaratrancas', 'footer', 2, '{}'),
('footer_social_instagram', 'Instagram URL', 'text', 'https://instagram.com/wilnaratrancas', 'footer', 3, '{}'),
('footer_copyright', 'Copyright', 'text', '© 2024 Wilnara Tranças. Todos os direitos reservados.', 'footer', 4, '{}');

-- Inserir páginas padrão
INSERT INTO public.site_pages (slug, title, meta_title, meta_description, is_published) VALUES
('about', 'Sobre Nós', 'Sobre a Wilnara Tranças - Plataforma de Tranças Africanas', 'Conheça a Wilnara Tranças, plataforma dedicada a conectar pessoas com as melhores trancistas profissionais de Portugal.', true),
('contact', 'Contato', 'Contato - Wilnara Tranças', 'Entre em contato com a Wilnara Tranças. Estamos aqui para ajudar com suas dúvidas sobre tranças africanas.', true),
('privacy', 'Política de Privacidade', 'Política de Privacidade - Wilnara Tranças', 'Política de privacidade da Wilnara Tranças. Saiba como protegemos seus dados pessoais.', true),
('terms', 'Termos de Uso', 'Termos de Uso - Wilnara Tranças', 'Termos de uso da plataforma Wilnara Tranças. Conheça seus direitos e responsabilidades.', true);

-- Inserir configurações iniciais
INSERT INTO public.site_settings (key, value, description, category, is_public) VALUES
('site_name', 'Wilnara Tranças', 'Nome do site', 'general', true),
('site_tagline', 'Plataforma de Tranças Africanas', 'Slogan do site', 'general', true),
('site_logo', '/images/logo.png', 'Caminho do logo', 'general', true),
('maintenance_mode', 'false', 'Modo de manutenção', 'general', false),
('max_upload_size', '5242880', 'Tamanho máximo de upload (5MB)', 'general', false),
('google_analytics_id', '', 'ID do Google Analytics', 'seo', false),
('meta_keywords', 'tranças africanas, trancistas, portugal, agendamento', 'Keywords padrão do site', 'seo', true),
('social_sharing_enabled', 'true', 'Habilitar compartilhamento social', 'social', true);

-- Criar função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar timestamps automaticamente
CREATE TRIGGER update_site_contents_updated_at BEFORE UPDATE ON public.site_contents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_pages_updated_at BEFORE UPDATE ON public.site_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== 8. FUNCTIONS ÚTEIS =====

-- Função para obter conteúdo por chave
CREATE OR REPLACE FUNCTION get_site_content(content_key VARCHAR)
RETURNS TABLE (
  content TEXT,
  content_type VARCHAR,
  meta_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT sc.content, sc.content_type, sc.meta_data
  FROM public.site_contents sc
  WHERE sc.key = content_key AND sc.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter configuração por chave
CREATE OR REPLACE FUNCTION get_site_setting(setting_key VARCHAR)
RETURNS TEXT AS $$
DECLARE
  setting_value TEXT;
BEGIN
  SELECT value INTO setting_value
  FROM public.site_settings
  WHERE key = setting_key AND is_public = true;
  
  RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== COMENTÁRIOS =====
COMMENT ON TABLE public.site_contents IS 'Tabela para gerenciar conteúdo dinâmico do site';
COMMENT ON TABLE public.site_pages IS 'Tabela para gerenciar páginas do site';
COMMENT ON TABLE public.site_media IS 'Tabela para gerenciar mídia/imagens do site';
COMMENT ON TABLE public.site_settings IS 'Tabela para configurações gerais do site';

-- Show success message
SELECT '🎉 Sistema de CMS criado com sucesso!' as message;