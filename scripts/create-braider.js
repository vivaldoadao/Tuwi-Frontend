const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createBraiderRecord() {
  console.log('🔨 Criando registro de trancista para znattechnology95@gmail.com\n');

  try {
    // Criar registro de trancista
    const { data: braiderData, error: braiderError } = await supabase
      .from('braiders')
      .upsert({
        user_id: '3c9549bf-3c52-4b55-8dfe-ce53fb1a623b',
        name: 'Znat Technology Tranças',
        bio: 'Especialista em diversos estilos de tranças e cuidados capilares. Oferece serviços profissionais tanto no salão quanto ao domicílio.',
        location: 'Lisboa, Portugal',
        contact_email: 'znattechnology95@gmail.com',
        contact_phone: '+351 999 888 777',
        profile_image_url: '/placeholder.svg?height=200&width=200&text=ZT',
        status: 'approved',
        // Campos obrigatórios para satisfazer as constraints
        serves_home: true,
        serves_studio: true,
        serves_salon: false,
        district: 'Lisboa',
        concelho: 'Lisboa',
        max_travel_distance: 15,
        specialties: ['Box Braids', 'Tranças Afro', 'Twist'],
        years_experience: '3-5',
        min_price: 50.00,
        max_price: 200.00,
        whatsapp: '+351 999 888 777'
      })
      .select()
      .single();

    if (braiderError) {
      console.error('❌ Erro ao criar registro de trancista:', braiderError);
      return;
    }

    console.log('✅ Registro de trancista criado com sucesso:');
    console.log(braiderData);

    // Verificar se o registro foi criado corretamente
    console.log('\n🔍 Verificando registro criado:');
    const { data: verifyData, error: verifyError } = await supabase
      .from('braiders')
      .select(`
        id,
        user_id,
        name,
        contact_email,
        status,
        location
      `)
      .eq('user_id', '3c9549bf-3c52-4b55-8dfe-ce53fb1a623b')
      .single();

    if (verifyError) {
      console.error('❌ Erro ao verificar registro:', verifyError);
    } else {
      console.log('✅ Registro verificado:', verifyData);
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar criação
createBraiderRecord().then(() => {
  console.log('\n🏁 Processo concluído');
  process.exit(0);
}).catch(error => {
  console.error('💥 Falha no processo:', error);
  process.exit(1);
});