/**
 * Script de Migração de Dados Mock para Supabase
 * 
 * Este script migra todos os dados mock da aplicação para o banco de dados Supabase
 * ATENÇÃO: Execute apenas em ambiente de desenvolvimento/teste
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuração do Supabase (usando service role key para operações administrativas)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Dados Mock (copiados e adaptados do lib/data.ts)
const mockProducts = [
  {
    name: "Tranças Box Braids Premium",
    description: "Tranças box braids de alta qualidade com fibra sintética premium",
    long_description: "Nossas Box Braids Premium são feitas com fibra sintética de alta qualidade que imita perfeitamente o cabelo natural. Ideal para quem busca um visual moderno e proteção para os fios naturais. Duração média de 2-3 meses com cuidados adequados.",
    price: 89.90,
    images: ["/placeholder.svg?height=400&width=400&text=Box+Braids+Premium"],
    category: "Tranças",
    stock_quantity: 50
  },
  {
    name: "Twist Braids Naturais",
    description: "Twist braids com aparência natural e toque suave",
    long_description: "As Twist Braids Naturais oferecem um visual elegante e sofisticado. Feitas com fibra de altíssima qualidade que proporciona movimento natural e brilho saudável. Perfeitas para um look profissional ou casual.",
    price: 79.90,
    images: ["/placeholder.svg?height=400&width=400&text=Twist+Braids"],
    category: "Tranças",
    stock_quantity: 45
  },
  {
    name: "Crochet Braids Cacheadas",
    description: "Crochet braids com textura cacheada para volume natural",
    long_description: "Para quem ama cachos! Nossas Crochet Braids Cacheadas proporcionam volume e movimento naturais. Fáceis de manter e estilizar, são perfeitas para quem quer praticidade sem abrir mão da beleza.",
    price: 95.90,
    images: ["/placeholder.svg?height=400&width=400&text=Crochet+Cacheadas"],
    category: "Cachos",
    stock_quantity: 30
  },
  {
    name: "Fulani Braids Decoradas",
    description: "Tranças Fulani com decorações douradas tradicionais",
    long_description: "As Fulani Braids são uma homenagem à cultura africana tradicional. Nossas tranças vêm com decorações douradas autênticas e são ideais para ocasiões especiais ou para quem quer expressar sua conexão com as raízes africanas.",
    price: 120.00,
    images: ["/placeholder.svg?height=400&width=400&text=Fulani+Braids"],
    category: "Tradicionais",
    stock_quantity: 25
  },
  {
    name: "Goddess Locs Luxo",
    description: "Goddess locs com textura luxuosa e acabamento perfeito",
    long_description: "As Goddess Locs Luxo combinam a beleza dos locs tradicionais com toques modernos. Textura suave ao toque e aparência sofisticada. Ideais para quem busca elegância e praticidade no dia a dia.",
    price: 150.00,
    images: ["/placeholder.svg?height=400&width=400&text=Goddess+Locs"],
    category: "Locs",
    stock_quantity: 20
  }
]

const mockUsers = [
  {
    id: 'user-admin-001',
    email: 'admin@wilnara.com',
    name: 'Administrador Wilnara',
    role: 'admin'
  },
  {
    id: 'user-braider-001',
    email: 'maria@wilnara.com',
    name: 'Maria Silva Santos',
    role: 'braider',
    phone: '(11) 99999-1234'
  },
  {
    id: 'user-braider-002',
    email: 'ana@wilnara.com',
    name: 'Ana Costa Lima',
    role: 'braider',
    phone: '(21) 99999-5678'
  },
  {
    id: 'user-customer-001',
    email: 'cliente@exemplo.com',
    name: 'Cliente Exemplo',
    role: 'customer',
    phone: '(11) 99999-0000'
  }
]

const mockBraiders = [
  {
    user_id: 'user-braider-001',
    bio: 'Especialista em tranças africanas com mais de 10 anos de experiência. Formada pela Escola de Beleza Afro-Brasileira e com diversos cursos de aperfeiçoamento. Apaixonada por valorizar a beleza natural da mulher negra através das tranças tradicionais e modernas.',
    location: 'São Paulo, SP - Zona Sul',
    contact_phone: '(11) 99999-1234',
    status: 'approved',
    portfolio_images: [
      '/placeholder.svg?height=300&width=300&text=Portfolio+Maria+1',
      '/placeholder.svg?height=300&width=300&text=Portfolio+Maria+2',
      '/placeholder.svg?height=300&width=300&text=Portfolio+Maria+3'
    ],
    average_rating: 4.8,
    total_reviews: 45
  },
  {
    user_id: 'user-braider-002',
    bio: 'Trancista profissional especializada em box braids e twist braids. Com formação em estética capilar e 8 anos de experiência, atende tanto em domicílio quanto em salão próprio. Focada em proporcionar não apenas beleza, mas também saúde capilar para suas clientes.',
    location: 'Rio de Janeiro, RJ - Zona Norte',
    contact_phone: '(21) 99999-5678',
    status: 'approved',
    portfolio_images: [
      '/placeholder.svg?height=300&width=300&text=Portfolio+Ana+1',
      '/placeholder.svg?height=300&width=300&text=Portfolio+Ana+2'
    ],
    average_rating: 4.9,
    total_reviews: 32
  }
]

const mockServices = [
  // Serviços da Maria
  {
    braider_user_id: 'user-braider-001',
    name: 'Box Braids Completas',
    description: 'Box braids tradicionais com instalação completa e finalização profissional',
    price: 150.00,
    duration_minutes: 360,
    image_url: '/placeholder.svg?height=200&width=200&text=Box+Braids+Maria'
  },
  {
    braider_user_id: 'user-braider-001',
    name: 'Twist Braids Médias',
    description: 'Twist braids de tamanho médio, ideais para o dia a dia',
    price: 120.00,
    duration_minutes: 300,
    image_url: '/placeholder.svg?height=200&width=200&text=Twist+Braids+Maria'
  },
  {
    braider_user_id: 'user-braider-001',
    name: 'Fulani Braids Decoradas',
    description: 'Fulani braids com decorações douradas tradicionais',
    price: 200.00,
    duration_minutes: 420,
    image_url: '/placeholder.svg?height=200&width=200&text=Fulani+Braids+Maria'
  },
  // Serviços da Ana
  {
    braider_user_id: 'user-braider-002',
    name: 'Box Braids Jumbo',
    description: 'Box braids jumbo para um visual mais despojado e moderno',
    price: 130.00,
    duration_minutes: 240,
    image_url: '/placeholder.svg?height=200&width=200&text=Box+Jumbo+Ana'
  },
  {
    braider_user_id: 'user-braider-002',
    name: 'Crochet Braids',
    description: 'Crochet braids com textura natural e volume',
    price: 110.00,
    duration_minutes: 180,
    image_url: '/placeholder.svg?height=200&width=200&text=Crochet+Ana'
  }
]

// Funções auxiliares
async function clearDatabase() {
  console.log('🧹 Limpando dados existentes...')
  
  const tables = [
    'bookings',
    'braider_availability', 
    'services',
    'braiders',
    'products',
    'users'
  ]
  
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', 'impossible-id') // Deleta todos os registros
    
    if (error && !error.message.includes('No rows found')) {
      console.warn(`⚠️  Aviso ao limpar tabela ${table}:`, error.message)
    }
  }
}

async function insertUsers() {
  console.log('👥 Inserindo usuários...')
  
  for (const user of mockUsers) {
    // Primeiro, criar o usuário na tabela auth.users (simulado)
    const { data, error } = await supabase
      .from('users')
      .insert([{
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone || null
      }])
      .select()
    
    if (error) {
      console.error(`❌ Erro ao inserir usuário ${user.email}:`, error.message)
    } else {
      console.log(`✅ Usuário ${user.email} inserido com sucesso`)
    }
  }
}

async function insertProducts() {
  console.log('📦 Inserindo produtos...')
  
  const { data, error } = await supabase
    .from('products')
    .insert(mockProducts)
    .select()
  
  if (error) {
    console.error('❌ Erro ao inserir produtos:', error.message)
    return []
  } else {
    console.log(`✅ ${data.length} produtos inseridos com sucesso`)
    return data
  }
}

async function insertBraiders() {
  console.log('💇‍♀️ Inserindo perfis de trancistas...')
  
  const insertedBraiders = []
  
  for (const braider of mockBraiders) {
    const { data, error } = await supabase
      .from('braiders')
      .insert([braider])
      .select()
    
    if (error) {
      console.error(`❌ Erro ao inserir trancista:`, error.message)
    } else {
      console.log(`✅ Trancista inserido com sucesso`)
      insertedBraiders.push(data[0])
    }
  }
  
  return insertedBraiders
}

async function insertServices(braiders) {
  console.log('🔧 Inserindo serviços...')
  
  const insertedServices = []
  
  for (const service of mockServices) {
    // Encontrar o braider_id pelo user_id
    const braider = braiders.find(b => b.user_id === service.braider_user_id)
    
    if (!braider) {
      console.error(`❌ Trancista não encontrado para user_id: ${service.braider_user_id}`)
      continue
    }
    
    const serviceData = {
      braider_id: braider.id,
      name: service.name,
      description: service.description,
      price: service.price,
      duration_minutes: service.duration_minutes,
      image_url: service.image_url
    }
    
    const { data, error } = await supabase
      .from('services')
      .insert([serviceData])
      .select()
    
    if (error) {
      console.error(`❌ Erro ao inserir serviço ${service.name}:`, error.message)
    } else {
      console.log(`✅ Serviço ${service.name} inserido com sucesso`)
      insertedServices.push(data[0])
    }
  }
  
  return insertedServices
}

async function insertBraiderAvailability(braiders) {
  console.log('📅 Inserindo disponibilidades das trancistas...')
  
  const today = new Date()
  const availabilities = []
  
  // Criar disponibilidades para os próximos 30 dias
  for (const braider of braiders) {
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      // Pular domingos
      if (date.getDay() === 0) continue
      
      // Horários disponíveis (9:00 às 17:00, intervalos de 1 hora)
      const timeSlots = [
        '09:00', '10:00', '11:00', '12:00', 
        '14:00', '15:00', '16:00', '17:00'
      ]
      
      for (const startTime of timeSlots) {
        const [hour, minute] = startTime.split(':')
        const endHour = parseInt(hour) + 1
        const endTime = `${endHour.toString().padStart(2, '0')}:${minute}`
        
        availabilities.push({
          braider_id: braider.id,
          available_date: date.toISOString().split('T')[0],
          start_time: startTime,
          end_time: endTime,
          is_booked: false
        })
      }
    }
  }
  
  // Inserir em lotes para evitar timeout
  const batchSize = 100
  for (let i = 0; i < availabilities.length; i += batchSize) {
    const batch = availabilities.slice(i, i + batchSize)
    
    const { error } = await supabase
      .from('braider_availability')
      .insert(batch)
    
    if (error) {
      console.error(`❌ Erro ao inserir lote de disponibilidades:`, error.message)
    } else {
      console.log(`✅ Lote de ${batch.length} disponibilidades inserido`)
    }
  }
  
  console.log(`✅ Total de ${availabilities.length} disponibilidades inseridas`)
}

async function createSampleBookings(braiders, services) {
  console.log('📋 Criando agendamentos de exemplo...')
  
  const sampleBookings = [
    {
      service_id: services[0]?.id,
      client_id: 'user-customer-001',
      braider_id: braiders[0]?.id,
      booking_date: '2024-12-01',
      booking_time: '10:00',
      service_type: 'trancista',
      client_name: 'Cliente Exemplo',
      client_email: 'cliente@exemplo.com',
      client_phone: '(11) 99999-0000',
      status: 'confirmed',
      total_amount: 150.00,
      notes: 'Primeira vez fazendo box braids'
    }
  ]
  
  for (const booking of sampleBookings) {
    if (!booking.service_id || !booking.braider_id) {
      console.log('⚠️  Pulando agendamento - serviço ou trancista não encontrado')
      continue
    }
    
    const { data, error } = await supabase
      .from('bookings')
      .insert([booking])
      .select()
    
    if (error) {
      console.error('❌ Erro ao criar agendamento:', error.message)
    } else {
      console.log('✅ Agendamento de exemplo criado')
    }
  }
}

// Função principal
async function main() {
  console.log('🚀 Iniciando migração de dados mock para Supabase...\n')
  
  try {
    // 1. Limpar dados existentes
    await clearDatabase()
    
    // 2. Inserir usuários
    await insertUsers()
    
    // 3. Inserir produtos
    const products = await insertProducts()
    
    // 4. Inserir trancistas
    const braiders = await insertBraiders()
    
    // 5. Inserir serviços
    const services = await insertServices(braiders)
    
    // 6. Inserir disponibilidades
    await insertBraiderAvailability(braiders)
    
    // 7. Criar agendamentos de exemplo
    await createSampleBookings(braiders, services)
    
    console.log('\n🎉 Migração concluída com sucesso!')
    console.log('\n📊 Resumo:')
    console.log(`   • ${mockUsers.length} usuários`)
    console.log(`   • ${products.length} produtos`)
    console.log(`   • ${braiders.length} trancistas`)
    console.log(`   • ${services.length} serviços`)
    console.log(`   • Disponibilidades para 30 dias`)
    console.log(`   • Agendamentos de exemplo`)
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error)
    process.exit(1)
  }
}

// Verificar se o script está sendo executado diretamente
if (require.main === module) {
  main()
}

module.exports = { main }