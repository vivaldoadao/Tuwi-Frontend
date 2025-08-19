-- Script para desativar RLS das tabelas de notificações
-- Execute este script no SQL Editor do Supabase

-- 1. Remover todas as políticas RLS da tabela notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "System can manage all notifications" ON notifications;
DROP POLICY IF EXISTS "Enable read access for all users" ON notifications;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON notifications;
DROP POLICY IF EXISTS "Enable update for users based on email" ON notifications;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON notifications;

-- 2. Remover todas as políticas RLS da tabela notification_settings
DROP POLICY IF EXISTS "Users can view own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can insert own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can update own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can delete own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "System can manage all notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON notification_settings;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON notification_settings;
DROP POLICY IF EXISTS "Enable update for users based on email" ON notification_settings;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON notification_settings;

-- 3. Desativar RLS nas tabelas
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings DISABLE ROW LEVEL SECURITY;

-- 4. Verificar status final (opcional)
SELECT 
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '❌ RLS Ativo'
        ELSE '✅ RLS Desativado'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('notifications', 'notification_settings')
ORDER BY tablename;