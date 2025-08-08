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

async function testBookingsAPI() {
  console.log('🧪 Testando lógica da API de bookings\n');

  try {
    const userEmail = 'znattechnology95@gmail.com';

    // Step 1: Find user by email to get user_id
    console.log('1️⃣ Buscando usuário por email...', userEmail);
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (userError || !userData) {
      console.error('❌ Usuário não encontrado:', userError);
      return;
    }

    console.log('✅ ID do usuário encontrado:', userData.id);

    // Step 2: Find braider by user_id
    console.log('\n2️⃣ Buscando trancista por user_id...', userData.id);
    const { data: braiderData, error: braiderError } = await supabase
      .from('braiders')
      .select('id, name, contact_email, status, user_id')
      .eq('user_id', userData.id)
      .single();

    if (braiderError || !braiderData) {
      console.error('❌ Trancista não encontrada:', braiderError);
      return;
    }

    console.log('✅ Trancista encontrada:', {
      id: braiderData.id,
      name: braiderData.name,
      status: braiderData.status
    });

    // Step 3: Get bookings for this braider
    console.log('\n3️⃣ Buscando agendamentos para trancista:', braiderData.id);
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        services(name, price, duration_minutes)
      `)
      .eq('braider_id', braiderData.id)
      .order('booking_date', { ascending: true });

    if (bookingsError) {
      console.error('❌ Erro ao buscar agendamentos:', bookingsError);
      return;
    }

    console.log('✅ Agendamentos encontrados:', bookings?.length || 0);
    
    if (bookings && bookings.length > 0) {
      console.log('\n📋 Detalhes dos agendamentos:');
      bookings.forEach((booking, index) => {
        console.log(`${index + 1}. ${booking.client_name} - ${booking.booking_date} ${booking.booking_time} - Status: ${booking.status}`);
      });
    }

    // Step 4: Format response like the API does
    console.log('\n4️⃣ Formatando resposta...');
    const formattedBookings = (bookings || []).map(booking => ({
      id: booking.id,
      braiderId: booking.braider_id,
      serviceId: booking.service_id,
      clientName: booking.client_name,
      clientEmail: booking.client_email,
      clientPhone: booking.client_phone,
      clientAddress: booking.client_address,
      date: booking.booking_date,
      time: booking.booking_time,
      bookingType: booking.service_type,
      status: booking.status === 'pending' ? 'Pendente' : 
              booking.status === 'confirmed' ? 'Confirmado' : 
              booking.status === 'cancelled' ? 'Cancelado' : 'Pendente',
      createdAt: booking.created_at,
      service: booking.services ? {
        name: booking.services.name,
        price: parseFloat(booking.services.price) || 0,
        durationMinutes: booking.services.duration_minutes || 0
      } : null
    }));

    const response = {
      success: true,
      braider: {
        id: braiderData.id,
        name: braiderData.name,
        contactEmail: braiderData.contact_email,
        status: braiderData.status
      },
      bookings: formattedBookings,
      count: formattedBookings.length
    };

    console.log('\n✅ Resposta final:');
    console.log(JSON.stringify(response, null, 2));

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

testBookingsAPI().then(() => {
  console.log('\n🏁 Teste da API concluído');
  process.exit(0);
}).catch(error => {
  console.error('💥 Falha no teste:', error);
  process.exit(1);
});