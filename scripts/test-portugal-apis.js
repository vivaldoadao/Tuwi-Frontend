// Script para testar as APIs públicas de Portugal
// Execute com: node scripts/test-portugal-apis.js

const fetch = require('node-fetch')

async function testPortugalAPIs() {
  console.log('🇵🇹 Testando APIs Públicas de Portugal\n')

  // Teste 1: GEO API PT - Municípios
  console.log('1. Testando GEO API PT - Municípios')
  try {
    const response = await fetch('https://geoapi.pt/municipios')
    if (response.ok) {
      const municipios = await response.json()
      console.log(`✅ Sucesso! ${municipios.length} municípios encontrados`)
      console.log(`   Primeiros 5: ${municipios.slice(0, 5).join(', ')}`)
    } else {
      console.log(`❌ Erro: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.log(`❌ Erro de conexão: ${error.message}`)
  }
  
  console.log('')

  // Teste 2: IPMA - Distritos e Ilhas
  console.log('2. Testando IPMA - Distritos e Ilhas')
  try {
    const response = await fetch('https://api.ipma.pt/open-data/distrits-islands.json')
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Sucesso! ${data.data.length} localizações encontradas`)
      
      // Agrupar por região
      const regioes = data.data.reduce((acc, item) => {
        const regiao = item.idRegiao === 1 ? 'Continente' : 
                      item.idRegiao === 2 ? 'Madeira' : 'Açores'
        acc[regiao] = (acc[regiao] || 0) + 1
        return acc
      }, {})
      
      console.log('   Distribuição:')
      Object.entries(regioes).forEach(([regiao, count]) => {
        console.log(`   - ${regiao}: ${count} locais`)
      })
    } else {
      console.log(`❌ Erro: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.log(`❌ Erro de conexão: ${error.message}`)
  }

  console.log('')

  // Comparação com dados estáticos
  console.log('3. Comparação com dados estáticos do projeto')
  console.log('   📊 Benefícios das APIs:')
  console.log('   - Dados sempre atualizados (CAOP 2024)')
  console.log('   - Redução de ~500 linhas de código estático')
  console.log('   - Coordenadas geográficas incluídas (IPMA)')
  console.log('   - Manutenção automática pelo governo português')
  console.log('   - APIs oficiais e gratuitas')
  
  console.log('')
  console.log('✨ Para integrar no projeto:')
  console.log('   1. Import: import { usePortugalLocation } from "@/hooks/usePortugalLocation"')
  console.log('   2. Component: <PortugalLocationSelector ... />')
  console.log('   3. Replace: Dados estáticos → Dados dinâmicos')
}

// Executar testes
testPortugalAPIs().catch(console.error)