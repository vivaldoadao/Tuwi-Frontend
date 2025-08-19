-- ============================================================================
-- TUWI MARKETPLACE - COMPLETE DATABASE SCHEMA FOR DJANGO MIGRATION
-- Sistema completo de marketplace para serviços de tranças africanas em Portugal
-- ============================================================================

-- ============================================================================
-- 1. USERS - Sistema de utilizadores com diferentes roles
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- Para autenticação local
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'braider', 'admin')),
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    preferences JSONB DEFAULT '{}', -- Preferências do utilizador
    address JSONB -- {street, city, postal_code, district}
);

-- ============================================================================
-- 2. BRAIDERS - Perfis de trancistas profissionais
-- ============================================================================
CREATE TABLE braiders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Pode ser null se criado via admin
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    bio TEXT,
    location VARCHAR(255), -- Localização geral
    district VARCHAR(100), -- Distrito
    concelho VARCHAR(100), -- Concelho
    freguesia VARCHAR(100), -- Freguesia
    address TEXT, -- Endereço completo
    profile_image_url TEXT,
    portfolio_images JSONB DEFAULT '[]', -- Array de URLs de imagens
    years_experience INTEGER,
    specialties JSONB DEFAULT '[]', -- Array de especialidades
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    featured_until TIMESTAMP WITH TIME ZONE,
    availability_schedule JSONB DEFAULT '{}', -- Horários de disponibilidade
    pricing_info JSONB DEFAULT '{}', -- Informações de preços base
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id)
);

-- ============================================================================
-- 3. SERVICES - Serviços oferecidos pelos trancistas
-- ============================================================================
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    braider_id UUID NOT NULL REFERENCES braiders(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    category VARCHAR(100), -- ex: "Tranças", "Cuidados", "Penteados"
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    hair_type_compatibility JSONB DEFAULT '[]', -- Tipos de cabelo compatíveis
    required_materials JSONB DEFAULT '[]', -- Materiais necessários
    aftercare_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. BOOKINGS - Sistema de agendamentos
-- ============================================================================
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    braider_id UUID NOT NULL REFERENCES braiders(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    booking_type VARCHAR(20) NOT NULL CHECK (booking_type IN ('domicilio', 'trancista')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_address TEXT, -- Usado quando booking_type = 'domicilio'
    special_requests TEXT,
    total_price DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled', 'refunded')),
    payment_method VARCHAR(50),
    payment_intent_id VARCHAR(255), -- Stripe payment intent
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir que não há conflitos de agendamento
    UNIQUE(braider_id, booking_date, booking_time)
);

-- ============================================================================
-- 5. PRODUCTS - Sistema de e-commerce de produtos
-- ============================================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    short_description TEXT,
    price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2), -- Preço promocional
    sku VARCHAR(100) UNIQUE,
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    weight DECIMAL(8,2), -- Em gramas
    dimensions JSONB, -- {length, width, height} em cm
    category VARCHAR(100),
    tags JSONB DEFAULT '[]',
    images JSONB DEFAULT '[]', -- Array de URLs de imagens
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    featured_until TIMESTAMP WITH TIME ZONE,
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords JSONB DEFAULT '[]',
    attributes JSONB DEFAULT '{}', -- Atributos específicos (cor, tamanho, etc.)
    care_instructions TEXT,
    ingredients JSONB DEFAULT '[]', -- Para produtos de cuidado capilar
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. ORDERS - Sistema de pedidos de e-commerce
-- ============================================================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_number VARCHAR(50) UNIQUE NOT NULL, -- Número do pedido legível
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
    
    -- Valores monetários
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    
    -- Informações de pagamento
    payment_method VARCHAR(50),
    payment_intent_id VARCHAR(255), -- Stripe payment intent
    stripe_customer_id VARCHAR(255),
    
    -- Informações de envio
    shipping_address JSONB NOT NULL, -- {name, street, city, postal_code, country, phone}
    billing_address JSONB, -- Se diferente do shipping
    shipping_method VARCHAR(100),
    tracking_number VARCHAR(255),
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Datas importantes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadados
    notes TEXT,
    admin_notes TEXT,
    refund_reason TEXT
);

-- ============================================================================
-- 7. ORDER_ITEMS - Itens dos pedidos
-- ============================================================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL, -- Snapshot do nome do produto
    product_sku VARCHAR(100),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    product_snapshot JSONB, -- Snapshot dos dados do produto na altura da compra
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 8. RATINGS - Sistema de avaliações e reviews
-- ============================================================================
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    braider_id UUID NOT NULL REFERENCES braiders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    
    -- Avaliações por categoria
    overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
    punctuality_rating INTEGER CHECK (punctuality_rating BETWEEN 1 AND 5),
    communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
    professionalism_rating INTEGER CHECK (professionalism_rating BETWEEN 1 AND 5),
    
    -- Review textual
    review_title VARCHAR(255),
    review_text TEXT,
    client_name VARCHAR(255) NOT NULL,
    
    -- Imagens da review
    review_images JSONB DEFAULT '[]',
    
    -- Verificação e moderação
    is_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'reported', 'deleted')),
    
    -- Resposta do trancista
    braider_response TEXT,
    braider_response_date TIMESTAMP WITH TIME ZONE,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Um utilizador só pode avaliar um trancista uma vez por booking
    UNIQUE(user_id, braider_id, booking_id)
);

-- ============================================================================
-- 9. RATING_REPORTS - Denúncias de avaliações
-- ============================================================================
CREATE TABLE rating_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rating_id UUID NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'rejected')),
    admin_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 10. BRAIDER_RATING_STATS - Estatísticas de avaliações (view materializada)
-- ============================================================================
CREATE TABLE braider_rating_stats (
    braider_id UUID PRIMARY KEY REFERENCES braiders(id) ON DELETE CASCADE,
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
    
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 11. CONVERSATIONS - Sistema de chat entre utilizadores
-- ============================================================================
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
    
    -- Última mensagem para listagem rápida
    last_message_content TEXT,
    last_message_timestamp TIMESTAMP WITH TIME ZONE,
    last_message_sender_id UUID REFERENCES users(id),
    
    -- Controlo de leitura
    participant_1_last_read_at TIMESTAMP WITH TIME ZONE,
    participant_2_last_read_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir que não há conversas duplicadas
    UNIQUE(participant_1_id, participant_2_id),
    CHECK(participant_1_id != participant_2_id)
);

-- ============================================================================
-- 12. MESSAGES - Mensagens do sistema de chat
-- ============================================================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    
    -- Para mensagens com arquivos
    file_url TEXT,
    file_name VARCHAR(255),
    file_size INTEGER,
    file_type VARCHAR(100),
    
    -- Controlo de estado
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    
    -- Resposta a mensagem (threading)
    reply_to_message_id UUID REFERENCES messages(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 13. TYPING_INDICATORS - Indicadores de digitação em tempo real
-- ============================================================================
CREATE TABLE typing_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_typing BOOLEAN NOT NULL DEFAULT FALSE,
    last_typed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Único indicador por utilizador por conversa
    UNIQUE(conversation_id, user_id)
);

-- ============================================================================
-- 14. NOTIFICATIONS - Sistema de notificações
-- ============================================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'booking_confirmed', 'message_received', 'rating_received', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}', -- Dados específicos da notificação
    
    -- Estado da notificação
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Ação relacionada
    action_url TEXT,
    action_label VARCHAR(100),
    
    -- Referências opcionais
    related_booking_id UUID REFERENCES bookings(id),
    related_order_id UUID REFERENCES orders(id),
    related_message_id UUID REFERENCES messages(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 15. NOTIFICATION_SETTINGS - Configurações de notificações por utilizador
-- ============================================================================
CREATE TABLE notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notificações por email
    email_bookings BOOLEAN DEFAULT TRUE,
    email_messages BOOLEAN DEFAULT TRUE,
    email_ratings BOOLEAN DEFAULT TRUE,
    email_orders BOOLEAN DEFAULT TRUE,
    email_marketing BOOLEAN DEFAULT FALSE,
    
    -- Notificações push (futuro)
    push_bookings BOOLEAN DEFAULT TRUE,
    push_messages BOOLEAN DEFAULT TRUE,
    push_ratings BOOLEAN DEFAULT TRUE,
    push_orders BOOLEAN DEFAULT TRUE,
    
    -- Configurações avançadas
    digest_frequency VARCHAR(20) DEFAULT 'daily' CHECK (digest_frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'never')),
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'Europe/Lisbon',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- ============================================================================
-- 16. ORDER_TRACKING - Sistema de rastreamento de pedidos
-- ============================================================================
CREATE TABLE order_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    location VARCHAR(255),
    tracking_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) -- Admin que criou o evento
);

-- ============================================================================
-- 17. COUPONS - Sistema de cupões de desconto
-- ============================================================================
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Tipo de desconto
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    
    -- Limitações
    minimum_amount DECIMAL(10,2),
    maximum_discount DECIMAL(10,2),
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    user_usage_limit INTEGER DEFAULT 1, -- Vezes que cada utilizador pode usar
    
    -- Produtos aplicáveis
    applicable_to VARCHAR(20) DEFAULT 'all' CHECK (applicable_to IN ('all', 'products', 'services')),
    applicable_product_ids JSONB DEFAULT '[]',
    applicable_category VARCHAR(100),
    
    -- Validade
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    
    -- Estado
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- ============================================================================
-- 18. COUPON_USAGES - Histórico de uso de cupões
-- ============================================================================
CREATE TABLE coupon_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 19. ADMIN_LOGS - Logs de ações administrativas
-- ============================================================================
CREATE TABLE admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL, -- 'braider', 'order', 'user', etc.
    resource_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 20. FAVORITES - Sistema de favoritos
-- ============================================================================
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    braider_id UUID REFERENCES braiders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir que é favorito de braider OU produto
    CHECK (
        (braider_id IS NOT NULL AND product_id IS NULL) OR
        (braider_id IS NULL AND product_id IS NOT NULL)
    ),
    
    -- Um utilizador não pode favoritar o mesmo item duas vezes
    UNIQUE(user_id, braider_id),
    UNIQUE(user_id, product_id)
);

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Braiders
CREATE INDEX idx_braiders_user_id ON braiders(user_id);
CREATE INDEX idx_braiders_status ON braiders(status);
CREATE INDEX idx_braiders_district ON braiders(district);
CREATE INDEX idx_braiders_average_rating ON braiders(average_rating);
CREATE INDEX idx_braiders_is_featured ON braiders(is_featured);

-- Services
CREATE INDEX idx_services_braider_id ON services(braider_id);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_is_active ON services(is_active);
CREATE INDEX idx_services_price ON services(price);

-- Bookings
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_braider_id ON bookings(braider_id);
CREATE INDEX idx_bookings_service_id ON bookings(service_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);

-- Products
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_stock ON products(stock_quantity);

-- Orders
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- Order Items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Ratings
CREATE INDEX idx_ratings_braider_id ON ratings(braider_id);
CREATE INDEX idx_ratings_user_id ON ratings(user_id);
CREATE INDEX idx_ratings_booking_id ON ratings(booking_id);
CREATE INDEX idx_ratings_status ON ratings(status);
CREATE INDEX idx_ratings_created_at ON ratings(created_at);

-- Conversations
CREATE INDEX idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at);

-- Messages
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_is_read ON messages(is_read);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Favorites
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_braider_id ON favorites(braider_id);
CREATE INDEX idx_favorites_product_id ON favorites(product_id);

-- ============================================================================
-- FUNÇÕES E TRIGGERS PARA MANUTENÇÃO AUTOMÁTICA
-- ============================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a todas as tabelas que têm updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_braiders_updated_at BEFORE UPDATE ON braiders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_typing_indicators_updated_at BEFORE UPDATE ON typing_indicators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar estatísticas de rating quando há mudanças
CREATE OR REPLACE FUNCTION update_braider_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar ou inserir estatísticas do braider
    INSERT INTO braider_rating_stats (braider_id)
    VALUES (COALESCE(NEW.braider_id, OLD.braider_id))
    ON CONFLICT (braider_id) DO NOTHING;
    
    -- Recalcular estatísticas
    UPDATE braider_rating_stats 
    SET 
        total_ratings = (
            SELECT COUNT(*) FROM ratings 
            WHERE braider_id = COALESCE(NEW.braider_id, OLD.braider_id) 
            AND status = 'active'
        ),
        average_rating = (
            SELECT COALESCE(AVG(overall_rating), 0) FROM ratings 
            WHERE braider_id = COALESCE(NEW.braider_id, OLD.braider_id) 
            AND status = 'active'
        ),
        rating_1_count = (
            SELECT COUNT(*) FROM ratings 
            WHERE braider_id = COALESCE(NEW.braider_id, OLD.braider_id) 
            AND status = 'active' AND overall_rating = 1
        ),
        rating_2_count = (
            SELECT COUNT(*) FROM ratings 
            WHERE braider_id = COALESCE(NEW.braider_id, OLD.braider_id) 
            AND status = 'active' AND overall_rating = 2
        ),
        rating_3_count = (
            SELECT COUNT(*) FROM ratings 
            WHERE braider_id = COALESCE(NEW.braider_id, OLD.braider_id) 
            AND status = 'active' AND overall_rating = 3
        ),
        rating_4_count = (
            SELECT COUNT(*) FROM ratings 
            WHERE braider_id = COALESCE(NEW.braider_id, OLD.braider_id) 
            AND status = 'active' AND overall_rating = 4
        ),
        rating_5_count = (
            SELECT COUNT(*) FROM ratings 
            WHERE braider_id = COALESCE(NEW.braider_id, OLD.braider_id) 
            AND status = 'active' AND overall_rating = 5
        ),
        avg_quality = (
            SELECT COALESCE(AVG(quality_rating), 0) FROM ratings 
            WHERE braider_id = COALESCE(NEW.braider_id, OLD.braider_id) 
            AND status = 'active' AND quality_rating IS NOT NULL
        ),
        avg_punctuality = (
            SELECT COALESCE(AVG(punctuality_rating), 0) FROM ratings 
            WHERE braider_id = COALESCE(NEW.braider_id, OLD.braider_id) 
            AND status = 'active' AND punctuality_rating IS NOT NULL
        ),
        avg_communication = (
            SELECT COALESCE(AVG(communication_rating), 0) FROM ratings 
            WHERE braider_id = COALESCE(NEW.braider_id, OLD.braider_id) 
            AND status = 'active' AND communication_rating IS NOT NULL
        ),
        avg_professionalism = (
            SELECT COALESCE(AVG(professionalism_rating), 0) FROM ratings 
            WHERE braider_id = COALESCE(NEW.braider_id, OLD.braider_id) 
            AND status = 'active' AND professionalism_rating IS NOT NULL
        ),
        last_updated = NOW()
    WHERE braider_id = COALESCE(NEW.braider_id, OLD.braider_id);
    
    -- Atualizar também a tabela braiders
    UPDATE braiders 
    SET 
        average_rating = (
            SELECT average_rating FROM braider_rating_stats 
            WHERE braider_id = COALESCE(NEW.braider_id, OLD.braider_id)
        ),
        total_reviews = (
            SELECT total_ratings FROM braider_rating_stats 
            WHERE braider_id = COALESCE(NEW.braider_id, OLD.braider_id)
        )
    WHERE id = COALESCE(NEW.braider_id, OLD.braider_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Trigger para atualizar estatísticas quando ratings mudam
CREATE TRIGGER update_rating_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON ratings
    FOR EACH ROW EXECUTE FUNCTION update_braider_rating_stats();

-- Função para atualizar última mensagem na conversa
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET 
        last_message_content = NEW.content,
        last_message_timestamp = NEW.created_at,
        last_message_sender_id = NEW.sender_id,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar última mensagem
CREATE TRIGGER update_conversation_last_message_trigger
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Função para criar configurações de notificação para novos utilizadores
CREATE OR REPLACE FUNCTION create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_settings (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para criar configurações padrão
CREATE TRIGGER create_notification_settings_trigger
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_default_notification_settings();

-- ============================================================================
-- FUNÇÕES ÚTEIS PARA DJANGO
-- ============================================================================

-- Função para obter ou criar conversa entre dois utilizadores
CREATE OR REPLACE FUNCTION get_or_create_conversation(p_user1_id UUID, p_user2_id UUID)
RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
    min_id UUID;
    max_id UUID;
BEGIN
    -- Garantir ordem consistente dos participantes
    SELECT LEAST(p_user1_id, p_user2_id), GREATEST(p_user1_id, p_user2_id) 
    INTO min_id, max_id;
    
    -- Tentar encontrar conversa existente
    SELECT id INTO conversation_id
    FROM conversations 
    WHERE (participant_1_id = min_id AND participant_2_id = max_id)
       OR (participant_1_id = max_id AND participant_2_id = min_id);
    
    -- Se não existir, criar nova
    IF conversation_id IS NULL THEN
        INSERT INTO conversations (participant_1_id, participant_2_id)
        VALUES (min_id, max_id)
        RETURNING id INTO conversation_id;
    END IF;
    
    RETURN conversation_id;
END;
$$ language 'plpgsql';

-- Função para calcular próximos slots disponíveis de um braider
CREATE OR REPLACE FUNCTION get_braider_available_slots(
    p_braider_id UUID, 
    p_date DATE, 
    p_service_duration INTEGER DEFAULT 60
)
RETURNS TABLE(slot_time TIME) AS $$
DECLARE
    start_hour INTEGER := 9;  -- 9h
    end_hour INTEGER := 18;   -- 18h
    slot_duration INTEGER := p_service_duration;
    current_time TIME;
BEGIN
    -- Gerar slots de hora em hora (pode ser ajustado)
    FOR i IN 0..(end_hour - start_hour - 1) LOOP
        current_time := (start_hour + i || ':00')::TIME;
        
        -- Verificar se slot está disponível
        IF NOT EXISTS (
            SELECT 1 FROM bookings 
            WHERE braider_id = p_braider_id 
            AND booking_date = p_date 
            AND booking_time = current_time
            AND status NOT IN ('cancelled')
        ) THEN
            slot_time := current_time;
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$ language 'plpgsql';

-- ============================================================================
-- VIEWS ÚTEIS PARA RELATÓRIOS E DASHBOARDS
-- ============================================================================

-- View para estatísticas gerais do sistema
CREATE VIEW system_stats AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'customer') as total_customers,
    (SELECT COUNT(*) FROM braiders WHERE status = 'approved') as active_braiders,
    (SELECT COUNT(*) FROM bookings WHERE status = 'completed') as completed_bookings,
    (SELECT COUNT(*) FROM orders WHERE status = 'delivered') as delivered_orders,
    (SELECT COALESCE(SUM(total), 0) FROM orders WHERE payment_status = 'paid') as total_revenue,
    (SELECT COUNT(*) FROM ratings) as total_ratings,
    (SELECT COALESCE(AVG(overall_rating), 0) FROM ratings WHERE status = 'active') as avg_platform_rating;

-- View para top braiders
CREATE VIEW top_braiders AS
SELECT 
    b.*,
    brs.total_ratings,
    brs.average_rating,
    COUNT(DISTINCT bk.id) as total_bookings,
    COALESCE(SUM(bk.total_price), 0) as total_earnings
FROM braiders b
LEFT JOIN braider_rating_stats brs ON b.id = brs.braider_id
LEFT JOIN bookings bk ON b.id = bk.braider_id AND bk.status = 'completed'
WHERE b.status = 'approved'
GROUP BY b.id, brs.total_ratings, brs.average_rating
ORDER BY brs.average_rating DESC, brs.total_ratings DESC;

-- View para dashboard de utilizador
CREATE VIEW user_dashboard AS
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    COUNT(DISTINCT b.id) as total_bookings,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(o.total), 0) as total_spent,
    COUNT(DISTINCT f.id) as total_favorites,
    COUNT(DISTINCT r.id) as total_ratings_given,
    MAX(b.created_at) as last_booking_date,
    MAX(o.created_at) as last_order_date
FROM users u
LEFT JOIN bookings b ON u.id = b.user_id
LEFT JOIN orders o ON u.id = o.user_id
LEFT JOIN favorites f ON u.id = f.user_id
LEFT JOIN ratings r ON u.id = r.user_id
WHERE u.role = 'customer'
GROUP BY u.id, u.name, u.email;

-- ============================================================================
-- COMENTÁRIOS FINAIS PARA DJANGO
-- ============================================================================

/*
NOTAS IMPORTANTES PARA MIGRAÇÃO DJANGO:

1. MODELS.PY:
   - Usar UUIDField para todos os IDs
   - JSONField para campos JSONB
   - DecimalField para valores monetários
   - Usar choices para campos com CHECK constraints

2. SETTINGS.PY:
   - Configurar TIME_ZONE = 'Europe/Lisbon'
   - Usar PostgreSQL como base de dados
   - Configurar MEDIA_URL para uploads de imagens

3. AUTHENTICAÇÃO:
   - Estender o User model padrão do Django ou usar AUTH_USER_MODEL customizado
   - Implementar sistema de roles (customer, braider, admin)

4. DJANGO REST FRAMEWORK:
   - Serializers para todas as entidades
   - ViewSets com filtering, searching e pagination
   - Permissions baseadas em roles

5. CELERY (RECOMENDADO):
   - Tasks para envio de emails
   - Tasks para cálculo de estatísticas
   - Tasks para limpeza de dados temporários

6. SIGNALS:
   - post_save para criar notification_settings
   - post_save/post_delete para atualizar rating stats
   - post_save para invalidar cache

7. CACHE:
   - Redis para cache de queries frequentes
   - Cache de estatísticas de braiders
   - Cache de configurações

8. MEDIA FILES:
   - Configurar upload para AWS S3 ou similar
   - Otimização automática de imagens
   - Thumbnails para produtos e perfis

9. WEBSOCKETS:
   - Django Channels para chat em tempo real
   - Redis para pub/sub de mensagens
   - Notifications em tempo real

10. ADMIN:
    - Django Admin customizado para gestão
    - Filtros avançados para todas as entidades
    - Actions em bulk para operações comuns

Este schema está otimizado para PostgreSQL e inclui todas as funcionalidades
do sistema original Next.js, pronto para implementação em Django.
*/