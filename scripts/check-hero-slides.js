const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkHeroSlides() {
  console.log('🎬 VERIFICANDO SLIDES DO HERO...\n')

  try {
    // Verificar se tabela site_contents existe
    const { data: contents, error } = await supabase
      .from('site_contents')
      .select('*')
      .eq('page_section', 'hero')
      .eq('is_active', true)
      .order('display_order')

    if (error) {
      console.log('❌ Erro ao buscar site_contents:', error.message)
      if (error.message.includes('does not exist')) {
        console.log('\n🔧 SOLUÇÃO: A tabela site_contents não existe.')
        console.log('Isso explica por que está usando promoções em vez de slides.')
        console.log('\nOpções:')
        console.log('1. Criar tabela site_contents para slides do CMS')
        console.log('2. Ou usar slides estáticos (mais simples)')
      }
    } else {
      console.log('✅ Tabela site_contents encontrada')
      console.log(`📊 Slides encontrados: ${contents?.length || 0}`)
      
      if (contents && contents.length > 0) {
        console.log('\n📋 Slides existentes:')
        contents.forEach((slide, index) => {
          console.log(`${index + 1}. ${slide.key} - ${slide.title}`)
          if (slide.content_type === 'json') {
            try {
              const data = JSON.parse(slide.content)
              console.log(`   Título: ${data.title}`)
              console.log(`   Subtítulo: ${data.subtitle}`)
            } catch (e) {
              console.log('   (JSON inválido)')
            }
          }
        })
      } else {
        console.log('\n⚠️  Nenhum slide encontrado na seção "hero"')
        console.log('Por isso está usando promoções como fallback.')
      }
    }

    // Verificar promoções hero_banner ativas
    console.log('\n🎯 VERIFICANDO PROMOÇÕES HERO_BANNER...')
    const { data: promos } = await supabase
      .from('promotions')
      .select('id, title, type, status, start_date, end_date')
      .eq('type', 'hero_banner')
      .eq('status', 'active')

    console.log(`📊 Promoções hero_banner ativas: ${promos?.length || 0}`)
    if (promos && promos.length > 0) {
      promos.forEach(promo => {
        console.log(`- ${promo.title} (${promo.start_date} até ${promo.end_date})`)
      })
    }

  } catch (err) {
    console.log('❌ Erro inesperado:', err.message)
  }

  console.log('\n' + '='.repeat(50))
  console.log('📋 RECOMENDAÇÃO:')
  console.log('Para usar slides em vez de promoções:')
  console.log('1. Criar tabela site_contents OU')
  console.log('2. Usar slides estáticos no código')
  console.log('3. Desabilitar sistema de promoções temporariamente')
}

checkHeroSlides()