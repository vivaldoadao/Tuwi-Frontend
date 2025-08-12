import SiteHeader from "@/components/site-header"
import BraiderCard from "@/components/braider-card"
import { getAllBraidersLegacy } from "@/lib/data-supabase"
import BraiderRegisterButton from "@/components/auth/braider-register-button"
import { BraidersClientComponent } from "@/components/braiders-client"
import type { Braider } from "@/lib/data"

// 🚀 ISR CONFIGURATION - Página de alto tráfego
// Revalida a cada 15 minutos para manter dados atualizados das trancistas
export const revalidate = 900

// 📊 METADATA otimizado para SEO
export const metadata = {
  title: 'Trancistas Profissionais - Wilnara Tranças',
  description: 'Encontre as melhores trancistas profissionais da sua região. Visualize portfólios, avaliações e agende seus serviços de tranças online.',
  keywords: 'trancistas profissionais, tranças, agendamento online, box braids, goddess braids, portugal',
  openGraph: {
    title: 'Trancistas Profissionais - Wilnara Tranças',
    description: 'Encontre as melhores trancistas profissionais da sua região.',
    type: 'website'
  }
}

// 🎯 FUNÇÃO OTIMIZADA para buscar trancistas
async function getBraidersData() {
  try {
    console.log('🔄 Fetching braiders for ISR...')
    const startTime = Date.now()
    
    const braiders = await getAllBraidersLegacy()
    
    const endTime = Date.now()
    console.log(`✅ Braiders fetched in ${endTime - startTime}ms - Found ${braiders?.length || 0} braiders`)
    
    return {
      braiders: braiders || [],
      generatedAt: new Date().toISOString(),
      performance: {
        fetchTime: endTime - startTime,
        count: braiders?.length || 0
      }
    }
  } catch (error) {
    console.error('❌ Error fetching braiders for ISR:', error)
    
    // Fallback data para garantir que a página funcione
    return {
      braiders: [],
      generatedAt: new Date().toISOString(),
      error: 'Failed to load braiders',
      performance: {
        fetchTime: 0,
        count: 0
      }
    }
  }
}

// 🚀 GENERATE STATIC PARAMS para pre-render populares
export async function generateStaticParams() {
  // Pre-render as páginas mais populares
  return [
    { },  // Página principal de braiders
  ]
}

export default async function BraidersPage() {
  // 📊 Buscar dados no servidor com cache
  const { braiders, generatedAt, performance, error } = await getBraidersData()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-25 to-amber-25">
      <SiteHeader />
      
      {/* Debug info em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 border border-blue-200 p-2 text-xs text-blue-800 text-center">
          🚀 ISR Active | Generated: {new Date(generatedAt).toLocaleTimeString('pt')} | 
          Found: {performance.count} braiders | 
          Fetch: {performance.fetchTime}ms
          {error && ` | Error: ${error}`}
        </div>
      )}
      
      {/* Hero Section */}
      <section className="relative py-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-heading">
            Trancistas Profissionais 💇‍♀️
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Descubra as melhores profissionais de tranças da sua região. 
            Visualize portfólios, leia avaliações e agende seu serviço online.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <BraiderRegisterButton />
            <div className="text-sm text-gray-500">
              {braiders.length} trancistas disponíveis
            </div>
          </div>
        </div>
      </section>

      {/* Component Client para filtros e interações */}
      <BraidersClientComponent 
        initialBraiders={braiders} 
        serverGeneratedAt={generatedAt}
        serverPerformance={performance}
      />
    </div>
  )
}