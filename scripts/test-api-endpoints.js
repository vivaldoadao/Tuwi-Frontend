const fetch = require('node-fetch')

async function testAPIEndpoints() {
  const baseURL = 'http://localhost:3000'
  
  console.log('🔍 Testando endpoints da API de notificações...\n')

  try {
    // 1. Testar endpoint /api/notifications/settings sem autenticação
    console.log('1️⃣ Testando /api/notifications/settings (sem auth):')
    
    const settingsResponse = await fetch(`${baseURL}/api/notifications/settings`)
    const settingsData = await settingsResponse.text()
    
    console.log(`   Status: ${settingsResponse.status}`)
    console.log(`   Response: ${settingsData.substring(0, 200)}...`)
    
    if (settingsResponse.status === 401) {
      console.log('✅ Endpoint correctamente protegido (401 Unauthorized)')
    } else if (settingsResponse.status === 500) {
      console.log('❌ Erro interno do servidor (500)')
      try {
        const jsonData = JSON.parse(settingsData)
        console.log('   Detalhes do erro:', jsonData)
      } catch (e) {
        console.log('   Resposta não é JSON válido')
      }
    } else {
      console.log('⚠️  Resposta inesperada')
    }

    // 2. Testar endpoint /api/notifications sem autenticação
    console.log('\n2️⃣ Testando /api/notifications (sem auth):')
    
    const notificationsResponse = await fetch(`${baseURL}/api/notifications`)
    const notificationsData = await notificationsResponse.text()
    
    console.log(`   Status: ${notificationsResponse.status}`)
    console.log(`   Response: ${notificationsData.substring(0, 200)}...`)
    
    if (notificationsResponse.status === 401) {
      console.log('✅ Endpoint correctamente protegido (401 Unauthorized)')
    } else if (notificationsResponse.status === 500) {
      console.log('❌ Erro interno do servidor (500)')
      try {
        const jsonData = JSON.parse(notificationsData)
        console.log('   Detalhes do erro:', jsonData)
      } catch (e) {
        console.log('   Resposta não é JSON válido')
      }
    } else {
      console.log('⚠️  Resposta inesperada')
    }

    // 3. Testar endpoint de debug (se existir)
    console.log('\n3️⃣ Testando /api/debug/check-notifications:')
    
    const debugResponse = await fetch(`${baseURL}/api/debug/check-notifications`)
    const debugData = await debugResponse.text()
    
    console.log(`   Status: ${debugResponse.status}`)
    
    if (debugResponse.status === 404) {
      console.log('   Endpoint não encontrado (404)')
    } else if (debugResponse.status === 401) {
      console.log('   Requer autenticação (401)')
    } else if (debugResponse.status === 500) {
      console.log('❌ Erro interno do servidor (500)')
      console.log(`   Response: ${debugData.substring(0, 300)}...`)
    } else {
      console.log('✅ Endpoint respondeu com sucesso')
      try {
        const jsonData = JSON.parse(debugData)
        console.log('   Resumo:', jsonData.summary)
      } catch (e) {
        console.log('   Resposta não é JSON válido')
      }
    }

  } catch (error) {
    console.error('💥 Erro ao testar endpoints:', error.message)
  }
}

testAPIEndpoints()