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

async function testAPIPatch() {
  console.log('🧪 Testando API PATCH corrigida\n');

  try {
    // Buscar um agendamento pendente da nossa trancista
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, client_name, booking_date, booking_time, status, braider_id')
      .eq('braider_id', 'ec4f8487-db41-4f3e-ba82-95558b6bb4a7')
      .eq('status', 'pending')
      .limit(1);

    if (bookingsError || !bookings || bookings.length === 0) {
      console.log('❌ Nenhum agendamento pendente encontrado');
      return;
    }

    const booking = bookings[0];
    console.log('📋 Agendamento encontrado para teste:');
    console.log(`- ID: ${booking.id}`);
    console.log(`- Cliente: ${booking.client_name}`);
    console.log(`- Data: ${booking.booking_date} ${booking.booking_time}`);
    console.log(`- Status atual: ${booking.status}`);

    // Testar a lógica da API diretamente (simulando o que a API faz)
    console.log('\n🔍 Testando queries da API...');

    // 1. Buscar booking
    const { data: bookingData, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        id,
        braider_id,
        client_name,
        client_email,
        client_phone,
        client_address,
        booking_date,
        booking_time,
        service_type,
        total_amount,
        notes,
        status,
        service_id
      `)
      .eq('id', booking.id)
      .single()

    if (fetchError || !bookingData) {
      console.error('❌ Erro ao buscar booking:', fetchError);
      return;
    }

    console.log('✅ Booking encontrado');

    // 2. Buscar braider
    const { data: braiderData, error: braiderError } = await supabase
      .from('braiders')
      .select('user_id, name, contact_phone, location')
      .eq('id', bookingData.braider_id)
      .single()

    if (braiderError || !braiderData) {
      console.error('❌ Erro ao buscar braider:', braiderError);
      return;
    }

    console.log('✅ Braider encontrado:', braiderData.name);
    console.log('  User ID:', braiderData.user_id);

    // 3. Verificar ownership
    const expectedUserId = '3c9549bf-3c52-4b55-8dfe-ce53fb1a623b';
    if (braiderData.user_id !== expectedUserId) {
      console.log('❌ Ownership inválido');
      console.log(`  Esperado: ${expectedUserId}`);
      console.log(`  Encontrado: ${braiderData.user_id}`);
      return;
    }

    console.log('✅ Ownership verificado com sucesso');

    // 4. Buscar service
    if (bookingData.service_id) {
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('name, duration_minutes')
        .eq('id', bookingData.service_id)
        .single()

      if (serviceError) {
        console.log('⚠️ Warning: Serviço não encontrado:', serviceError.message);
      } else {
        console.log('✅ Serviço encontrado:', serviceData.name);
      }
    }

    console.log('\n🎉 Todas as queries da API funcionaram!');
    console.log('\n✅ A API corrigida deve funcionar agora');
    console.log('📝 Para testar na interface:');
    console.log('1. Acesse http://localhost:3000/braider-dashboard/bookings');
    console.log('2. Faça login com znattechnology95@gmail.com');
    console.log('3. Clique em "Aprovar" no agendamento');

  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

testAPIPatch().then(() => {
  console.log('\n🏁 Teste concluído');
  process.exit(0);
}).catch(error => {
  console.error('💥 Falha no teste:', error);
  process.exit(1);
});