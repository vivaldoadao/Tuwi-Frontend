// Este é um teste rápido para entender o problema da sessão
// Vamos verificar o que está na sessão vs o que está na base de dados

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

async function checkSessionData() {
  console.log('🔍 Investigando dados de sessão vs banco de dados\n');

  try {
    const userEmail = 'znattechnology95@gmail.com';

    // 1. Verificar dados do usuário na base de dados
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', userEmail)
      .single();

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
      return;
    }

    console.log('👤 Usuário na base de dados:');
    console.log(`- ID: ${dbUser.id}`);
    console.log(`- Email: ${dbUser.email}`);
    console.log(`- Nome: ${dbUser.name}`);
    console.log(`- Role: ${dbUser.role}`);

    // 2. Verificar dados do braider
    const { data: braider, error: braiderError } = await supabase
      .from('braiders')
      .select('id, user_id, name, status')
      .eq('user_id', dbUser.id)
      .single();

    if (braiderError) {
      console.error('❌ Erro ao buscar braider:', braiderError);
      return;
    }

    console.log('\n👩‍🦱 Braider na base de dados:');
    console.log(`- ID: ${braider.id}`);
    console.log(`- User ID: ${braider.user_id}`);
    console.log(`- Nome: ${braider.name}`);
    console.log(`- Status: ${braider.status}`);

    // 3. Verificar se os IDs coincidem
    console.log('\n🔍 Verificação de compatibilidade:');
    console.log(`- User ID no DB: ${dbUser.id}`);
    console.log(`- User ID do Braider: ${braider.user_id}`);
    console.log(`- IDs coincidem: ${dbUser.id === braider.user_id ? '✅' : '❌'}`);

    // 4. Verificar agendamentos
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, client_name, booking_date, status')
      .eq('braider_id', braider.id)
      .limit(3);

    if (bookingsError) {
      console.error('❌ Erro ao buscar agendamentos:', bookingsError);
    } else {
      console.log('\n📅 Agendamentos para esta trancista:');
      bookings.forEach((booking, index) => {
        console.log(`${index + 1}. ${booking.client_name} - ${booking.booking_date} - ${booking.status}`);
      });
    }

    console.log('\n💡 Diagnóstico:');
    if (dbUser.id === braider.user_id) {
      console.log('✅ Os IDs coincidem - problema pode estar na sessão NextAuth');
      console.log('📝 Possíveis causas do erro 403:');
      console.log('   1. session.user.id não está sendo passado corretamente');
      console.log('   2. NextAuth não está populando o ID correto');
      console.log('   3. Middleware está bloqueando a requisição');
    } else {
      console.log('❌ Os IDs não coincidem - problema nos dados');
    }

  } catch (error) {
    console.error('💥 Erro:', error);
  }
}

checkSessionData().then(() => {
  console.log('\n🏁 Diagnóstico concluído');
  process.exit(0);
}).catch(error => {
  console.error('💥 Falha:', error);
  process.exit(1);
});