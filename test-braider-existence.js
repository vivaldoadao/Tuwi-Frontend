// Script rápido para testar se o braider existe
const testBraiderId = 'ec4f8487-db41-4f3e-ba82-95558b6bb4a7'

console.log('🔍 Testando se o braider existe...')
console.log('ID:', testBraiderId)

// Teste via fetch da API de debug
fetch('http://localhost:3000/api/debug-chat')
  .then(res => res.json())
  .then(data => {
    console.log('\n📊 Estado atual do banco:')
    console.log('- Usuários:', data.debug_info?.users?.count || 0)
    console.log('- Braiders:', data.debug_info?.braiders?.count || 0)
    console.log('- Braider específico encontrado:', data.debug_info?.specific_braider?.found || false)
    console.log('- Conversas existentes:', data.debug_info?.conversations?.count || 0)
    
    if (data.debug_info?.braiders?.error) {
      console.log('\n❌ Erro na tabela braiders:', data.debug_info.braiders.error)
    }
    
    if (data.debug_info?.specific_braider?.error) {
      console.log('\n❌ Erro ao buscar braider específico:', data.debug_info.specific_braider.error)
    }
    
    // Sugestão de solução
    if (data.debug_info?.braiders?.count === 0) {
      console.log('\n💡 SOLUÇÃO: A tabela braiders está vazia ou com problemas.')
      console.log('   Precisa criar um braider válido primeiro.')
      console.log('   Ou usar um dos usuários existentes que tem role "braider"')
    }
  })
  .catch(error => {
    console.error('❌ Erro ao testar:', error.message)
  })