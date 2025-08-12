-- ===== CONFIGURAÇÃO DO SUPABASE STORAGE =====
-- Script para criar buckets e políticas de storage

-- 1. Criar bucket para imagens (se não existir)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Política para permitir que todos vejam imagens (READ)
CREATE POLICY "Public read access for images" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- 3. Política para permitir que admins façam upload (INSERT)
CREATE POLICY "Admin upload access for images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- 4. Política para permitir que admins atualizem imagens (UPDATE)
CREATE POLICY "Admin update access for images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'images' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- 5. Política para permitir que admins deletem imagens (DELETE)
CREATE POLICY "Admin delete access for images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Verificar se o bucket foi criado
SELECT id, name, public FROM storage.buckets WHERE id = 'images';

-- Verificar políticas criadas
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';