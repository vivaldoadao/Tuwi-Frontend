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

async function diagnoseDatabase() {
  console.log('🔍 Diagnóstico do Banco de Dados\n');

  try {
    // 1. Verificar se o usuário existe
    console.log('1️⃣ Verificando usuário znattechnology95@gmail.com:');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role, created_at')
      .eq('email', 'znattechnology95@gmail.com');

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
    } else {
      console.log('✅ Dados do usuário:', userData);
    }

    // 2. Verificar se existe registro de trancista para este usuário
    console.log('\n2️⃣ Verificando registro de trancista:');
    const { data: braiderData, error: braiderError } = await supabase
      .from('braiders')
      .select(`
        id, 
        user_id, 
        name,
        contact_email, 
        status,
        created_at,
        users!inner(email, role)
      `)
      .eq('users.email', 'znattechnology95@gmail.com');

    if (braiderError) {
      console.error('❌ Erro ao buscar trancista:', braiderError);
    } else {
      console.log('✅ Dados da trancista:', braiderData);
    }

    // 3. Verificar todas as trancistas existentes
    console.log('\n3️⃣ Todas as trancistas no sistema:');
    const { data: allBraiders, error: allBraidersError } = await supabase
      .from('braiders')
      .select(`
        id,
        name,
        contact_email,
        status,
        users!inner(email, role)
      `)
      .limit(5);

    if (allBraidersError) {
      console.error('❌ Erro ao buscar todas as trancistas:', allBraidersError);
    } else {
      console.log('✅ Trancistas existentes:', allBraiders);
    }

    // 4. Verificar estrutura da tabela bookings
    console.log('\n4️⃣ Verificando tabela de agendamentos:');
    const { data: bookingsCount, error: bookingsError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });

    if (bookingsError) {
      console.error('❌ Erro ao verificar agendamentos:', bookingsError);
    } else {
      console.log('✅ Total de agendamentos:', bookingsCount);
    }

    // 5. Verificar se existem agendamentos de exemplo
    console.log('\n5️⃣ Agendamentos existentes:');
    const { data: sampleBookings, error: sampleError } = await supabase
      .from('bookings')
      .select('*')
      .limit(3);

    if (sampleError) {
      console.error('❌ Erro ao buscar agendamentos:', sampleError);
    } else {
      console.log('✅ Agendamentos de exemplo:', sampleBookings);
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar diagnóstico
diagnoseDatabase().then(() => {
  console.log('\n🏁 Diagnóstico concluído');
  process.exit(0);
}).catch(error => {
  console.error('💥 Falha no diagnóstico:', error);
  process.exit(1);
});