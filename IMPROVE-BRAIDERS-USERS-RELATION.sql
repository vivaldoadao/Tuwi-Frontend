-- 🔧 MELHORIA: Relação entre tabelas braiders e users
-- Este script melhora a integridade referencial e sincronização

-- 1. Primeiro vamos verificar a estrutura atual
\d braiders;
\d auth.users;

-- 2. Adicionar foreign key constraint se não existir
ALTER TABLE braiders 
ADD CONSTRAINT fk_braiders_user_id 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- 3. Criar função para sincronizar automaticamente braiders quando user.role = 'braider'
CREATE OR REPLACE FUNCTION sync_braider_on_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o role mudou para 'braider', criar registro na tabela braiders se não existir
  IF NEW.raw_user_meta_data ->> 'role' = 'braider' AND 
     (OLD.raw_user_meta_data ->> 'role' IS NULL OR OLD.raw_user_meta_data ->> 'role' != 'braider') THEN
    
    INSERT INTO braiders (
      id,
      user_id,
      name,
      bio,
      contact_email,
      contact_phone,
      location,
      profile_image_url,
      status,
      created_at,
      updated_at
    ) VALUES (
      'braider-' || substring(replace(NEW.id::text, '-', ''), 1, 12),
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
      'Trancista especializada em penteados africanos e modernos',
      NEW.email,
      '',
      'Lisboa, Portugal',
      '/placeholder.svg?height=200&width=200&text=T',
      'pending', -- Começa como pending, precisa aprovação
      NOW(),
      NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
      name = EXCLUDED.name,
      contact_email = EXCLUDED.contact_email,
      updated_at = NOW();
      
  -- Se o role mudou de 'braider' para outro, marcar como inativo (não deletar por segurança)
  ELSIF OLD.raw_user_meta_data ->> 'role' = 'braider' AND 
        NEW.raw_user_meta_data ->> 'role' != 'braider' THEN
    
    UPDATE braiders 
    SET status = 'inactive', updated_at = NOW()
    WHERE user_id = NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar trigger para executar a função automaticamente
DROP TRIGGER IF EXISTS trigger_sync_braider_role ON auth.users;
CREATE TRIGGER trigger_sync_braider_role
  AFTER UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_braider_on_role_change();

-- 5. Criar função para sincronizar braiders existentes com role 'braider'
CREATE OR REPLACE FUNCTION sync_existing_braider_users()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Para todos os usuários com role 'braider' que não têm registro na tabela braiders
  FOR user_record IN 
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN braiders b ON b.user_id = u.id
    WHERE u.raw_user_meta_data ->> 'role' = 'braider'
    AND b.user_id IS NULL
  LOOP
    INSERT INTO braiders (
      id,
      user_id,
      name,
      bio,
      contact_email,
      contact_phone,
      location,
      profile_image_url,
      status,
      created_at,
      updated_at
    ) VALUES (
      'braider-' || substring(replace(user_record.id::text, '-', ''), 1, 12),
      user_record.id,
      COALESCE(user_record.raw_user_meta_data ->> 'full_name', split_part(user_record.email, '@', 1)),
      'Trancista especializada em penteados africanos e modernos',
      user_record.email,
      '',
      'Lisboa, Portugal',
      '/placeholder.svg?height=200&width=200&text=T',
      'approved', -- Usuários existentes aprovados automaticamente
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Criado registro de braider para usuário: %', user_record.email;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Executar sincronização para usuários existentes
SELECT sync_existing_braider_users();

-- 7. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_braiders_user_id ON braiders(user_id);
CREATE INDEX IF NOT EXISTS idx_braiders_status ON braiders(status);
CREATE INDEX IF NOT EXISTS idx_braiders_user_status ON braiders(user_id, status);

-- 8. Criar view para facilitar consultas combinadas
CREATE OR REPLACE VIEW braiders_with_users AS
SELECT 
  b.*,
  u.email as user_email,
  u.raw_user_meta_data ->> 'role' as user_role,
  u.created_at as user_created_at,
  u.email_confirmed_at,
  u.last_sign_in_at
FROM braiders b
INNER JOIN auth.users u ON b.user_id = u.id;

-- 9. Atualizar RLS policies para usar a nova relação
DROP POLICY IF EXISTS "Braiders can read own profile" ON braiders;
CREATE POLICY "Braiders can read own profile" ON braiders
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'role' = 'admin'
  );

DROP POLICY IF EXISTS "Braiders can update own profile" ON braiders;
CREATE POLICY "Braiders can update own profile" ON braiders
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'role' = 'admin'
  );

-- 10. Verificar o resultado
SELECT 
  COUNT(*) as total_users_with_braider_role,
  COUNT(b.id) as total_braider_records
FROM auth.users u
LEFT JOIN braiders b ON b.user_id = u.id
WHERE u.raw_user_meta_data ->> 'role' = 'braider';

-- 11. Mostrar usuários braider e seus registros
SELECT 
  u.email,
  u.raw_user_meta_data ->> 'role' as role,
  b.id as braider_id,
  b.name as braider_name,
  b.status as braider_status
FROM auth.users u
LEFT JOIN braiders b ON b.user_id = u.id
WHERE u.raw_user_meta_data ->> 'role' = 'braider'
ORDER BY u.email;