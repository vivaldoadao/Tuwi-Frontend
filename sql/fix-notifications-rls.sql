-- Corrigir RLS para tabelas de notificações
-- Este script deve ser executado no banco de dados Supabase

-- 1. Habilitar RLS nas tabelas (caso não esteja habilitado)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas existentes que podem estar incorrectas
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

DROP POLICY IF EXISTS "Users can view own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can insert own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can update own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can delete own notification settings" ON notification_settings;

-- 3. Criar políticas RLS correctas para NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Política especial para permitir que o sistema (service role) insira notificações para qualquer usuário
CREATE POLICY "System can manage all notifications" ON notifications
    FOR ALL USING (
        auth.role() = 'service_role' OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

-- 4. Criar políticas RLS correctas para NOTIFICATION_SETTINGS
CREATE POLICY "Users can view own notification settings" ON notification_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings" ON notification_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings" ON notification_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notification settings" ON notification_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Política especial para permitir que o sistema gerencie configurações
CREATE POLICY "System can manage all notification settings" ON notification_settings
    FOR ALL USING (
        auth.role() = 'service_role' OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

-- 5. Verificar se as tabelas têm RLS habilitado
SELECT 
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ Habilitado'
        ELSE '❌ Desabilitado'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('notifications', 'notification_settings')
ORDER BY tablename;