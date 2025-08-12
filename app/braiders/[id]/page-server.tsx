import Image from "next/image"
import { notFound } from "next/navigation"
import SiteHeader from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getBraiderById, getAllBraidersLegacy } from "@/lib/data-supabase"
import { MapPin, Phone, Mail, Clock, Star, Calendar, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { BraiderDetailClient } from "@/components/braider-detail-client"
import type { Braider } from "@/lib/data"
import { Metadata } from "next"

// 🚀 ISR CONFIGURATION - Páginas de trancistas individuais
// Revalida a cada 1 hora - equilibra performance com atualizações de serviços
export const revalidate = 3600

// 📊 GENERATE STATIC PARAMS para pre-render trancistas populares
export async function generateStaticParams() {
  try {
    console.log('🔄 Pre-rendering popular braiders...')
    const braiders = await getAllBraidersLegacy()
    
    // Pre-render as top 20 trancistas mais populares (com base em reviews)
    const topBraiders = braiders
      ?.sort((a, b) => (b.totalReviews || 0) - (a.totalReviews || 0))
      .slice(0, 20) || []
    
    console.log(`✅ Pre-rendering ${topBraiders.length} popular braiders`)
    
    return topBraiders.map((braider) => ({
      id: braider.id,
    }))
  } catch (error) {
    console.error('❌ Error generating static params for braiders:', error)
    return []
  }
}

// 🎯 DYNAMIC METADATA para SEO otimizado
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  const { id } = await params
  
  try {
    const braider = await getBraiderById(id)
    
    if (!braider) {
      return {
        title: 'Trancista não encontrada - Wilnara Tranças',
        description: 'A trancista solicitada não foi encontrada.',
      }
    }

    return {
      title: `${braider.name} - Trancista Profissional | Wilnara Tranças`,
      description: `${braider.bio} Localizada em ${braider.location}. Agendamento online disponível.`,
      keywords: `${braider.name}, trancista, ${braider.location}, tranças, agendamento online`,
      openGraph: {
        title: `${braider.name} - Trancista Profissional`,
        description: braider.bio,
        images: braider.profileImageUrl ? [braider.profileImageUrl] : undefined,
        type: 'profile',
      },
      alternates: {
        canonical: `/braiders/${braider.id}`,
      },
    }
  } catch (error) {
    console.error('Error generating metadata for braider:', error)
    return {
      title: 'Trancista - Wilnara Tranças',
      description: 'Perfil de trancista profissional.',
    }
  }
}

// 🎯 FUNÇÃO OTIMIZADA para buscar dados da trancista
async function getBraiderData(id: string) {
  try {
    console.log(`🔄 Fetching braider data for ISR: ${id}`)
    const startTime = Date.now()
    
    const braider = await getBraiderById(id)
    
    const endTime = Date.now()
    console.log(`✅ Braider data fetched in ${endTime - startTime}ms`)
    
    return {
      braider,
      generatedAt: new Date().toISOString(),
      performance: {
        fetchTime: endTime - startTime
      }
    }
  } catch (error) {
    console.error(`❌ Error fetching braider ${id}:`, error)
    return {
      braider: null,
      generatedAt: new Date().toISOString(),
      error: 'Failed to load braider',
      performance: {
        fetchTime: 0
      }
    }
  }
}

export default async function BraiderDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  
  // 📊 Buscar dados no servidor com cache
  const { braider, generatedAt, performance, error } = await getBraiderData(id)
  
  if (!braider) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-25 to-amber-25">
      <SiteHeader />
      
      {/* Debug info em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 border border-blue-200 p-2 text-xs text-blue-800 text-center">
          🚀 ISR Active | Generated: {new Date(generatedAt).toLocaleTimeString('pt')} | 
          Fetch: {performance.fetchTime}ms | 
          Braider: {braider.name}
          {error && ` | Error: ${error}`}
        </div>
      )}
      
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <Link href="/braiders" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Voltar às Trancistas
        </Link>
      </div>

      {/* Hero Section with Braider Info */}
      <section className="relative py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                {/* Profile Image */}
                <div className="lg:col-span-1">
                  <div className="relative h-96 lg:h-full">
                    <Image
                      src={braider.profileImageUrl || "/placeholder.svg"}
                      alt={braider.name}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>
                
                {/* Info */}
                <div className="lg:col-span-2 p-8">
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {braider.name}
                          </h1>
                          <div className="flex items-center gap-4 text-gray-600 mb-4">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {braider.location}
                            </div>
                            {braider.averageRating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold">{braider.averageRating}</span>
                                <span className="text-sm text-gray-500">
                                  ({braider.totalReviews} avaliações)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge 
                          variant={braider.status === 'approved' ? 'default' : 'secondary'}
                          className={braider.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {braider.status === 'approved' ? 'Verificada' : 'Pendente'}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-700 leading-relaxed">
                        {braider.bio}
                      </p>
                    </div>
                    
                    {/* Contact Info */}
                    <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t">
                      {braider.contactPhone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{braider.contactPhone}</span>
                        </div>
                      )}
                      {braider.contactEmail && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span>{braider.contactEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Component Client para interações dinâmicas */}
      <BraiderDetailClient 
        braider={braider}
        serverGeneratedAt={generatedAt}
        serverPerformance={performance}
      />
    </div>
  )
}