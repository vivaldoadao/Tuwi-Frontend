-- ============================================================================
-- ADICIONAR MAIS USUÁRIOS PARA TESTAR PAGINAÇÃO
-- ============================================================================
-- Este script adiciona mais usuários de exemplo para testar a funcionalidade
-- de paginação na tabela de usuários do dashboard
-- ============================================================================

-- Inserir mais usuários clientes para teste de paginação
INSERT INTO public.users (id, email, name, role, phone, created_at) VALUES
-- Clientes Adicionais
('user-customer-001', 'patricia.silva@example.com', 'Patrícia Silva', 'customer', '(351) 91001-2001', NOW() - INTERVAL '30 days'),
('user-customer-002', 'fernanda.costa@example.com', 'Fernanda Costa', 'customer', '(351) 91002-2002', NOW() - INTERVAL '29 days'),
('user-customer-003', 'juliana.lima@example.com', 'Juliana Lima', 'customer', '(351) 91003-2003', NOW() - INTERVAL '28 days'),
('user-customer-004', 'camila.rocha@example.com', 'Camila Rocha', 'customer', '(351) 91004-2004', NOW() - INTERVAL '27 days'),
('user-customer-005', 'beatriz.santos@example.com', 'Beatriz Santos', 'customer', '(351) 91005-2005', NOW() - INTERVAL '26 days'),
('user-customer-006', 'amanda.oliveira@example.com', 'Amanda Oliveira', 'customer', '(351) 91006-2006', NOW() - INTERVAL '25 days'),
('user-customer-007', 'larissa.ferreira@example.com', 'Larissa Ferreira', 'customer', '(351) 91007-2007', NOW() - INTERVAL '24 days'),
('user-customer-008', 'gabriela.alves@example.com', 'Gabriela Alves', 'customer', '(351) 91008-2008', NOW() - INTERVAL '23 days'),
('user-customer-009', 'vanessa.pereira@example.com', 'Vanessa Pereira', 'customer', '(351) 91009-2009', NOW() - INTERVAL '22 days'),
('user-customer-010', 'renata.carvalho@example.com', 'Renata Carvalho', 'customer', '(351) 91010-2010', NOW() - INTERVAL '21 days'),
('user-customer-011', 'daniela.martin@example.com', 'Daniela Martin', 'customer', '(351) 91011-2011', NOW() - INTERVAL '20 days'),
('user-customer-012', 'monica.silva@example.com', 'Monica Silva', 'customer', '(351) 91012-2012', NOW() - INTERVAL '19 days'),
('user-customer-013', 'sabrina.costa@example.com', 'Sabrina Costa', 'customer', '(351) 91013-2013', NOW() - INTERVAL '18 days'),
('user-customer-014', 'carolina.lima@example.com', 'Carolina Lima', 'customer', '(351) 91014-2014', NOW() - INTERVAL '17 days'),
('user-customer-015', 'priscila.rocha@example.com', 'Priscila Rocha', 'customer', '(351) 91015-2015', NOW() - INTERVAL '16 days'),
('user-customer-016', 'aline.santos@example.com', 'Aline Santos', 'customer', '(351) 91016-2016', NOW() - INTERVAL '15 days'),
('user-customer-017', 'kelly.oliveira@example.com', 'Kelly Oliveira', 'customer', '(351) 91017-2017', NOW() - INTERVAL '14 days'),
('user-customer-018', 'tatiana.ferreira@example.com', 'Tatiana Ferreira', 'customer', '(351) 91018-2018', NOW() - INTERVAL '13 days'),
('user-customer-019', 'bianca.alves@example.com', 'Bianca Alves', 'customer', '(351) 91019-2019', NOW() - INTERVAL '12 days'),
('user-customer-020', 'luciana.pereira@example.com', 'Luciana Pereira', 'customer', '(351) 91020-2020', NOW() - INTERVAL '11 days'),

-- Trancistas Adicionais
('user-braider-001', 'sofia.trancas@example.com', 'Sofia Tranças Especiais', 'braider', '(351) 92001-3001', NOW() - INTERVAL '10 days'),
('user-braider-002', 'isabel.cachos@example.com', 'Isabel Cachos & Estilo', 'braider', '(351) 92002-3002', NOW() - INTERVAL '9 days'),
('user-braider-003', 'helena.braids@example.com', 'Helena Braids Studio', 'braider', '(351) 92003-3003', NOW() - INTERVAL '8 days'),
('user-braider-004', 'cristina.afro@example.com', 'Cristina Afro Hair', 'braider', '(351) 92004-3004', NOW() - INTERVAL '7 days'),
('user-braider-005', 'lucia.estilos@example.com', 'Lucia Estilos Naturais', 'braider', '(351) 92005-3005', NOW() - INTERVAL '6 days'),
('user-braider-006', 'telma.beleza@example.com', 'Telma Beleza Africana', 'braider', '(351) 92006-3006', NOW() - INTERVAL '5 days'),
('user-braider-007', 'grace.hair@example.com', 'Grace Hair Designer', 'braider', '(351) 92007-3007', NOW() - INTERVAL '4 days'),
('user-braider-008', 'monica.locks@example.com', 'Monica Locks & Braids', 'braider', '(351) 92008-3008', NOW() - INTERVAL '3 days'),

-- Alguns usuários inativos para teste
('user-inactive-001', 'inativo1@example.com', 'Usuário Inativo 1', 'customer', '(351) 90001-1001', NOW() - INTERVAL '2 days'),
('user-inactive-002', 'inativo2@example.com', 'Usuário Inativo 2', 'customer', '(351) 90002-1002', NOW() - INTERVAL '1 day'),
('user-inactive-003', 'inativo3@example.com', 'Usuário Inativo 3', 'braider', '(351) 90003-1003', NOW());

-- Desativar alguns usuários para teste
UPDATE public.users 
SET is_active = false 
WHERE id IN ('user-inactive-001', 'user-inactive-002', 'user-inactive-003');

-- Adicionar last_login para alguns usuários
UPDATE public.users 
SET last_login = NOW() - INTERVAL '1 day'
WHERE id IN ('11111111-1111-1111-1111-111111111111', 'user-customer-001', 'user-braider-001');

UPDATE public.users 
SET last_login = NOW() - INTERVAL '7 days'
WHERE id IN ('user-customer-002', 'user-customer-003', 'user-braider-002');

UPDATE public.users 
SET last_login = NOW() - INTERVAL '15 days'
WHERE id IN ('user-customer-004', 'user-customer-005');

-- Verificar total de usuários inseridos
DO $$
BEGIN
  RAISE NOTICE 'Total de usuários após inserção: %', (SELECT COUNT(*) FROM public.users);
END
$$;