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

async function resetBookingForTest() {
  console.log('🔄 Preparando agendamento para teste na interface\n');

  try {
    const braiderId = 'ec4f8487-db41-4f3e-ba82-95558b6bb4a7'; // Znat Technology

    // Resetar alguns agendamentos para pending para permitir teste
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, client_name, booking_date, booking_time, status')
      .eq('braider_id', braiderId)
      .limit(3);

    if (bookingsError) {
      console.error('❌ Erro ao buscar agendamentos:', bookingsError);
      return;
    }

    if (!bookings || bookings.length === 0) {
      console.log('❌ Nenhum agendamento encontrado');
      return;
    }

    console.log('📋 Agendamentos existentes:');
    bookings.forEach((booking, index) => {
      console.log(`${index + 1}. ${booking.client_name} - ${booking.booking_date} ${booking.booking_time} - Status: ${booking.status}`);
    });

    // Resetar o primeiro agendamento para pending se não estiver
    const firstBooking = bookings[0];
    if (firstBooking.status !== 'pending') {
      console.log(`\n🔄 Resetando agendamento ${firstBooking.id} para 'pending'...`);
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ 
          status: 'pending', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', firstBooking.id);

      if (updateError) {
        console.error('❌ Erro ao resetar status:', updateError);
      } else {
        console.log('✅ Status resetado para pending');
      }

      // Também liberar o slot de disponibilidade
      const { error: freeSlotError } = await supabase
        .from('braider_availability')
        .update({ is_booked: false })
        .eq('braider_id', braiderId)
        .eq('available_date', firstBooking.booking_date)
        .eq('start_time', firstBooking.booking_time);

      if (freeSlotError) {
        console.log('⚠️ Aviso: Não conseguiu liberar slot:', freeSlotError.message);
      } else {
        console.log('✅ Slot de disponibilidade liberado');
      }
    } else {
      console.log(`\n✅ Agendamento ${firstBooking.id} já está pendente`);
    }

    console.log('\n🎯 Instruções para teste:');
    console.log('1. Acesse http://localhost:3000/braider-dashboard/bookings');
    console.log('2. Faça login com znattechnology95@gmail.com');
    console.log('3. Você deve ver pelo menos 1 agendamento pendente');
    console.log('4. Clique em "Aprovar" para testar o fluxo completo');
    console.log('5. Verifique os logs do servidor para ver o processo de email');
    console.log('6. Verifique se o slot de disponibilidade foi marcado como reservado');

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

resetBookingForTest().then(() => {
  console.log('\n🏁 Preparação concluída');
  process.exit(0);
}).catch(error => {
  console.error('💥 Falha na preparação:', error);
  process.exit(1);
});