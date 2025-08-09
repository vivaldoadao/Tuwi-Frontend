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

async function createAvailabilitySlots() {
  console.log('⏰ Criando slots de disponibilidade para a trancista\n');

  try {
    const braiderId = 'ec4f8487-db41-4f3e-ba82-95558b6bb4a7'; // ID da trancista Znat Technology

    // Verificar slots existentes
    const { data: existing, error: existingError } = await supabase
      .from('braider_availability')
      .select('*')
      .eq('braider_id', braiderId)
      .limit(5);

    if (existingError) {
      console.error('❌ Erro ao verificar slots existentes:', existingError);
    } else {
      console.log('📅 Slots existentes:', existing?.length || 0);
      if (existing && existing.length > 0) {
        console.log('Primeiros 3 slots:', existing.slice(0, 3));
      }
    }

    // Criar slots para os próximos 7 dias
    const today = new Date();
    const slots = [];

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);
      const dateStr = date.toISOString().split('T')[0];

      // Horários disponíveis: 09:00-17:00 com slots de 1 hora
      const timeSlots = [
        { start: '09:00:00', end: '10:00:00' },
        { start: '10:00:00', end: '11:00:00' },
        { start: '11:00:00', end: '12:00:00' },
        { start: '14:00:00', end: '15:00:00' },
        { start: '15:00:00', end: '16:00:00' },
        { start: '16:00:00', end: '17:00:00' }
      ];

      timeSlots.forEach(timeSlot => {
        slots.push({
          braider_id: braiderId,
          available_date: dateStr,
          start_time: timeSlot.start,
          end_time: timeSlot.end,
          is_booked: false
        });
      });
    }

    console.log(`📝 Preparando ${slots.length} slots de disponibilidade...`);

    // Inserir slots um por vez para evitar duplicatas
    let insertedCount = 0;
    for (const slot of slots) {
      // Verificar se já existe
      const { data: existingSlot } = await supabase
        .from('braider_availability')
        .select('id')
        .eq('braider_id', slot.braider_id)
        .eq('available_date', slot.available_date)
        .eq('start_time', slot.start_time)
        .eq('end_time', slot.end_time)
        .maybeSingle();

      if (!existingSlot) {
        // Inserir novo slot
        const { error: insertError } = await supabase
          .from('braider_availability')
          .insert(slot);

        if (!insertError) {
          insertedCount++;
        } else {
          console.log(`⚠️ Erro ao inserir slot ${slot.available_date} ${slot.start_time}:`, insertError.message);
        }
      }
    }

    console.log(`✅ ${insertedCount} novos slots criados de ${slots.length} solicitados`);

    // Verificar resultado final
    const { data: finalCheck, error: finalError } = await supabase
      .from('braider_availability')
      .select('available_date, start_time, end_time, is_booked')
      .eq('braider_id', braiderId)
      .order('available_date')
      .order('start_time');

    if (finalError) {
      console.error('❌ Erro ao verificar resultado:', finalError);
    } else {
      console.log('\n📊 Resumo da disponibilidade criada:');
      console.log(`Total de slots: ${finalCheck?.length || 0}`);
      
      if (finalCheck && finalCheck.length > 0) {
        // Agrupar por data
        const byDate = finalCheck.reduce((acc, slot) => {
          if (!acc[slot.available_date]) acc[slot.available_date] = [];
          acc[slot.available_date].push(`${slot.start_time.slice(0,5)}-${slot.end_time.slice(0,5)} ${slot.is_booked ? '🔒' : '✅'}`);
          return acc;
        }, {});

        Object.entries(byDate).forEach(([date, slots]) => {
          console.log(`${date}: ${slots.join(', ')}`);
        });
      }
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

createAvailabilitySlots().then(() => {
  console.log('\n🏁 Processo de criação de slots concluído');
  process.exit(0);
}).catch(error => {
  console.error('💥 Falha no processo:', error);
  process.exit(1);
});