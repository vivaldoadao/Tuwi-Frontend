const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedData() {
  console.log('🌱 Seeding initial data...')
  
  try {
    // Add sample products
    console.log('📦 Adding sample products...')
    const { data: products, error: productsError } = await supabase
      .from('products')
      .insert([
        {
          name: 'Trança Box Braids Clássica',
          description: 'Cabelo sintético de alta qualidade para um visual clássico e duradouro.',
          long_description: 'As Box Braids clássicas são uma escolha atemporal para quem busca um visual elegante e de baixa manutenção.',
          price: 150.00,
          images: ['/placeholder.svg?height=300&width=400&text=Box+Braids'],
          category: 'tranças',
          stock_quantity: 10
        },
        {
          name: 'Crochet Braids Onduladas',
          description: 'Fios ondulados para um estilo volumoso e natural.',
          long_description: 'Nossas Crochet Braids onduladas são ideais para quem deseja volume e movimento.',
          price: 180.00,
          images: ['/placeholder.svg?height=300&width=400&text=Crochet+Braids'],
          category: 'tranças',
          stock_quantity: 15
        },
        {
          name: 'Twists Senegalesas Longas',
          description: 'Twists elegantes e leves, perfeitas para qualquer ocasião.',
          long_description: 'As Twists Senegalesas longas da Wilnara Tranças são sinônimo de elegância e leveza.',
          price: 220.00,
          images: ['/placeholder.svg?height=300&width=400&text=Twists+Senegalesas'],
          category: 'twists',
          stock_quantity: 8
        },
        {
          name: 'Faux Locs Leves',
          description: 'Locs sintéticas que imitam o cabelo natural, com conforto e estilo.',
          long_description: 'Experimente a beleza das Faux Locs com a leveza e o conforto que você merece.',
          price: 250.00,
          images: ['/placeholder.svg?height=300&width=400&text=Faux+Locs'],
          category: 'locs',
          stock_quantity: 5
        }
      ])
      .select()

    if (productsError) {
      console.error('❌ Error adding products:', productsError)
    } else {
      console.log('✅ Products added successfully!')
    }

    // Add sample admin user
    console.log('👤 Adding sample admin user...')
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .insert({
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@wilnaratracas.com',
        name: 'Admin Wilnara',
        role: 'admin'
      })
      .select()

    if (adminError && adminError.code !== '23505') { // Ignore duplicate key error
      console.error('❌ Error adding admin user:', adminError)
    } else {
      console.log('✅ Admin user added successfully!')
    }

    // Add sample customer user
    console.log('👤 Adding sample customer user...')
    const { data: customerUser, error: customerError } = await supabase
      .from('users')
      .insert({
        id: '00000000-0000-0000-0000-000000000002',
        email: 'cliente@exemplo.com',
        name: 'Cliente Exemplo',
        role: 'customer'
      })
      .select()

    if (customerError && customerError.code !== '23505') { // Ignore duplicate key error
      console.error('❌ Error adding customer user:', customerError)
    } else {
      console.log('✅ Customer user added successfully!')
    }

    // Add sample braider user
    console.log('👤 Adding sample braider user...')
    const { data: braiderUser, error: braiderUserError } = await supabase
      .from('users')
      .insert({
        id: '00000000-0000-0000-0000-000000000003',
        email: 'trancista@exemplo.com',
        name: 'Ana Trancista',
        role: 'braider'
      })
      .select()

    if (braiderUserError && braiderUserError.code !== '23505') { // Ignore duplicate key error
      console.error('❌ Error adding braider user:', braiderUserError)
    } else {
      console.log('✅ Braider user added successfully!')
      
      // Add braider profile
      console.log('💄 Adding braider profile...')
      const { data: braiderProfile, error: braiderProfileError } = await supabase
        .from('braiders')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000003',
          bio: 'Especialista em Box Braids e Twists Senegalesas com mais de 10 anos de experiência.',
          location: 'Lisboa, Portugal',
          contact_phone: '(351) 91234-5678',
          status: 'approved',
          portfolio_images: ['/placeholder.svg?height=300&width=400&text=Portfolio+1']
        })
        .select()

      if (braiderProfileError && braiderProfileError.code !== '23505') {
        console.error('❌ Error adding braider profile:', braiderProfileError)
      } else {
        console.log('✅ Braider profile added successfully!')
      }
    }

    console.log('🎉 Data seeding completed!')
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message)
    process.exit(1)
  }
}

seedData()