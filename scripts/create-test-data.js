// ============================================================================
// CRIAR DADOS DE TESTE PARA CHAT
// ============================================================================

const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestData() {
  console.log('🚀 Criando dados de teste para chat...')

  try {
    // 1. Criar usuário trancista
    console.log('👤 Criando usuário trancista...')
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Maria Trancas',
        email: 'maria.trancas@teste.com',
        role: 'braider',
        email_verified: new Date().toISOString()
      }, {
        onConflict: 'email'
      })

    if (userError) {
      console.error('❌ Erro ao criar usuário trancista:', userError)
    } else {
      console.log('✅ Usuário trancista criado com sucesso')
    }

    // 2. Criar braider
    console.log('💇‍♀️ Criando braider...')
    const { error: braiderError } = await supabase
      .from('braiders')
      .upsert({
        id: 'ec4f8487-db41-4f3e-ba82-95558b6bb4a7',
        user_id: '11111111-1111-1111-1111-111111111111',
        bio: 'Especialista em tranças afro-brasileiras com mais de 10 anos de experiência.',
        location: 'Lisboa, Portugal',
        contact_phone: '+351 912 345 678',
        contact_email: 'maria.trancas@teste.com',
        status: 'approved',
        profile_image_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b787?w=400&h=400&fit=crop&crop=face',
        portfolio_images: [
          'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400',
          'https://images.unsplash.com/photo-1522336284037-91f7da73f5c8?w=600&h=400'
        ],
        distrito: 'Lisboa',
        concelho: 'Lisboa',
        freguesia: 'Estrela',
        specialties: ['Box Braids', 'Tranças Rastafári', 'Twist', 'Cornrows'],
        years_experience: 10
      }, {
        onConflict: 'id'
      })

    if (braiderError) {
      console.error('❌ Erro ao criar braider:', braiderError)
    } else {
      console.log('✅ Braider criado com sucesso')
    }

    // 3. Criar usuário cliente
    console.log('👤 Criando usuário cliente...')
    const { error: clientError } = await supabase
      .from('users')
      .upsert({
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Ana Cliente',
        email: 'ana.cliente@teste.com',
        role: 'customer',
        email_verified: new Date().toISOString()
      }, {
        onConflict: 'email'
      })

    if (clientError) {
      console.error('❌ Erro ao criar usuário cliente:', clientError)
    } else {
      console.log('✅ Usuário cliente criado com sucesso')
    }

    // 4. Criar serviços
    console.log('⚡ Criando serviços...')
    const services = [
      {
        braider_id: 'ec4f8487-db41-4f3e-ba82-95558b6bb4a7',
        name: 'Box Braids Clássicas',
        description: 'Tranças box braids tradicionais com extensões sintéticas.',
        price: 120.00,
        duration_minutes: 240,
        image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300'
      },
      {
        braider_id: 'ec4f8487-db41-4f3e-ba82-95558b6bb4a7',
        name: 'Tranças Rastafári',
        description: 'Tranças rastafári autênticas com extensões naturais.',
        price: 150.00,
        duration_minutes: 300,
        image_url: 'https://images.unsplash.com/photo-1522336284037-91f7da73f5c8?w=400&h=300'
      },
      {
        braider_id: 'ec4f8487-db41-4f3e-ba82-95558b6bb4a7',
        name: 'Twist Moderno',
        description: 'Penteado twist moderno e elegante.',
        price: 90.00,
        duration_minutes: 180,
        image_url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=300'
      }
    ]

    for (const service of services) {
      const { error: serviceError } = await supabase
        .from('services')
        .upsert(service, {
          onConflict: 'braider_id,name'
        })

      if (serviceError) {
        console.error(`❌ Erro ao criar serviço ${service.name}:`, serviceError)
      } else {
        console.log(`✅ Serviço ${service.name} criado com sucesso`)
      }
    }

    // 5. Verificar dados criados
    console.log('\n📊 Verificando dados criados...')
    
    const { data: braiderData, error: verifyError } = await supabase
      .from('braiders')
      .select('id, user_id, users!braiders_user_id_fkey(name, email), status, location')
      .eq('id', 'ec4f8487-db41-4f3e-ba82-95558b6bb4a7')
      .single()

    if (verifyError) {
      console.error('❌ Erro ao verificar braider:', verifyError)
    } else {
      console.log('✅ Braider verificado:', braiderData)
    }

    const { data: servicesData } = await supabase
      .from('services')
      .select('id, name, price, duration_minutes')
      .eq('braider_id', 'ec4f8487-db41-4f3e-ba82-95558b6bb4a7')

    console.log('✅ Serviços criados:', servicesData?.length || 0)

    console.log('\n🎉 Dados de teste criados com sucesso!')
    console.log('🔗 Agora você pode testar o chat com o braider ID: ec4f8487-db41-4f3e-ba82-95558b6bb4a7')

  } catch (error) {
    console.error('💥 Erro inesperado:', error)
  }
}

// Executar script
createTestData()