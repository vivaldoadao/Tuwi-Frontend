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

async function checkExistingBraider() {
  console.log('🔍 Verificando registro existente de trancista\n');

  try {
    // Buscar registro existente pelo user_id
    const { data: braiderData, error: braiderError } = await supabase
      .from('braiders')
      .select('*')
      .eq('user_id', '3c9549bf-3c52-4b55-8dfe-ce53fb1a623b')
      .single();

    if (braiderError) {
      console.error('❌ Erro ao buscar trancista:', braiderError);
    } else {
      console.log('✅ Registro de trancista encontrado:');
      console.log(JSON.stringify(braiderData, null, 2));
    }

    // Também verificar pela pesquisa por email (método que nossa API usa)
    console.log('\n🔍 Testando busca por email (como a API faz):');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'znattechnology95@gmail.com')
      .single();

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
    } else {
      console.log('✅ ID do usuário:', userData.id);

      // Agora buscar braider com esse user_id
      const { data: braiderByUserId, error: braiderByUserIdError } = await supabase
        .from('braiders')
        .select('id, name, status, contact_email')
        .eq('user_id', userData.id)
        .single();

      if (braiderByUserIdError) {
        console.error('❌ Erro ao buscar trancista por user_id:', braiderByUserIdError);
      } else {
        console.log('✅ Trancista encontrada:', braiderByUserId);
      }
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

checkExistingBraider().then(() => {
  console.log('\n🏁 Verificação concluída');
  process.exit(0);
}).catch(error => {
  console.error('💥 Falha na verificação:', error);
  process.exit(1);
});