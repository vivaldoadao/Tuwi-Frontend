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

async function testSimpleAPI() {
  console.log('🧪 Testando API simplificada (sem verificação de ownership)\n');

  try {
    // Buscar um agendamento pendente
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, client_name, booking_date, booking_time, status')
      .eq('status', 'pending')
      .eq('braider_id', 'ec4f8487-db41-4f3e-ba82-95558b6bb4a7')
      .limit(1);

    if (bookingsError || !bookings || bookings.length === 0) {
      console.log('❌ Nenhum agendamento pendente encontrado');
      return;
    }

    const booking = bookings[0];
    console.log('📋 Testando com agendamento:', booking.client_name, booking.booking_date);

    // Fazer chamada para a API de teste
    const response = await fetch('http://localhost:3000/api/braiders/bookings/test-patch', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookingId: booking.id,
        status: 'Confirmado'
      })
    });

    const result = await response.json();

    console.log('\n📊 Resultado da API de teste:');
    console.log(`Status HTTP: ${response.status}`);
    console.log('Resposta:', JSON.stringify(result, null, 2));

    if (response.ok && result.success) {
      console.log('\n✅ API de teste funcionou!');
      console.log('🔍 Isso significa que o problema está na verificação de ownership na API principal');
      console.log('\n💡 Próximos passos:');
      console.log('1. Verificar os logs do servidor para ver os dados de sessão');
      console.log('2. O problema pode ser que session.user.id é null ou undefined');
      console.log('3. Ou session está retornando null completamente');
    } else {
      console.log('\n❌ API de teste também falhou');
      console.log('📝 Isso indica um problema mais profundo na infraestrutura');
    }

  } catch (error) {
    console.error('💥 Erro no teste:', error.message);
  }
}

testSimpleAPI().then(() => {
  console.log('\n🏁 Teste concluído');
  process.exit(0);
}).catch(error => {
  console.error('💥 Falha no teste:', error);
  process.exit(1);
});