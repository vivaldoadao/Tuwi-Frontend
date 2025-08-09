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

async function checkAvailabilityStructure() {
  console.log('🔍 Verificando estrutura da tabela braider_availability\n');

  try {
    // Pegar dados existentes para ver a estrutura
    const { data: sample, error: sampleError } = await supabase
      .from('braider_availability')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Erro ao buscar dados da tabela:', sampleError);
    } else {
      console.log('✅ Estrutura da tabela braider_availability:');
      if (sample && sample.length > 0) {
        console.log('Campos disponíveis:', Object.keys(sample[0]));
        console.log('Exemplo de registro:', JSON.stringify(sample[0], null, 2));
      } else {
        console.log('Tabela vazia - vamos verificar via consulta SQL');
      }
    }

    // Também verificar quantos registros existem
    const { data: count, error: countError } = await supabase
      .from('braider_availability')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erro ao contar registros:', countError);
    } else {
      console.log(`📊 Total de registros na tabela: ${count || 0}`);
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

checkAvailabilityStructure().then(() => {
  console.log('\n🏁 Verificação concluída');
  process.exit(0);
}).catch(error => {
  console.error('💥 Falha na verificação:', error);
  process.exit(1);
});