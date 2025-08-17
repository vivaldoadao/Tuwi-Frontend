import Link from "next/link"
import { SiteLayout } from "@/components/layouts/site-layout"
import ProductCard from "@/components/product-card"
import BraiderCard from "@/components/braider-card"
import HeroCarouselDynamic from "@/components/hero-carousel-dynamic"
import { DynamicHeroBanner, defaultHeroContent } from "@/components/dynamic-hero-banner"
import { PromotedBraidersSection } from "@/components/promoted-braiders-section"
import { Section } from "@/components/common/section"
import { Button } from "@/components/ui/button"
import BraiderRegisterButton from "@/components/auth/braider-register-button"
import { getFeaturedProducts, getFeaturedBraiders } from "@/lib/data-supabase"
import { getHomepageContent, getHeroSlides } from "@/lib/cms-content"
import { getActiveHeroBanner, getPromotionSettings } from "@/lib/promotions-display"
import type { Product } from "@/lib/data"
import type { Braider } from "@/lib/data-supabase"

// 🚀 ISR CONFIGURATION
// Revalida a cada 30 minutos - otimizado para alto tráfego de serviços
export const revalidate = 1800

// 📊 METADATA para SEO otimizado
export const metadata = {
  title: 'Tuwi - Marketplace de Serviços de Beleza e Produtos Premium',
  description: 'Descubra os melhores profissionais de beleza e produtos premium. Tranças, tratamentos capilares, cuidados africanos e muito mais. Agendamentos online com especialistas em Portugal.',
  keywords: 'beleza, tranças, cabeleireiro, tratamentos capilares, produtos de beleza, agendamento online, cuidados africanos, salão de beleza, portugal',
}

async function getFeaturedData(): Promise<{ featuredProducts: Product[], featuredBraiders: Braider[] }> {
  try {
    const [featuredProducts, featuredBraiders] = await Promise.all([
      getFeaturedProducts(),
      getFeaturedBraiders()
    ])
    
    return { featuredProducts, featuredBraiders }
  } catch (error) {
    console.error('Error fetching featured data:', error)
    
    // Fallback to mock data if database fails
    const mockProducts: Product[] = [
      {
        id: "1",
        name: "Kit Tranças Premium",
        description: "Kit completo para tranças profissionais com produtos de alta qualidade",
        longDescription: "Kit completo para tranças profissionais com produtos de alta qualidade e ferramentas especializadas",
        price: 45.99,
        imageUrl: "/placeholder.svg?height=300&width=300&text=Kit+Premium"
      },
      {
        id: "2", 
        name: "Tratamento Capilar Afro",
        description: "Linha completa de cuidados para cabelos afro e crespos",
        longDescription: "Linha completa de cuidados para cabelos afro e crespos com ingredientes naturais",
        price: 65.99,
        imageUrl: "/placeholder.svg?height=300&width=300&text=Tratamento+Afro"
      }
    ]

    const mockBraiders: Braider[] = [
      {
        id: "mock-1",
        name: "Maria Silva",
        bio: "Especialista em tranças africanas e tratamentos capilares com mais de 10 anos de experiência em cuidados afro.",
        location: "Lisboa, Portugal",
        contactEmail: "maria@example.com",
        contactPhone: "+351 91 999-1234",
        profileImageUrl: "/placeholder.svg?height=200&width=200&text=Maria",
        services: [],
        portfolioImages: ["/placeholder.svg?height=300&width=300&text=Portfolio1"],
        status: "approved",
        createdAt: new Date().toISOString()
      }
    ]

    return { featuredProducts: mockProducts, featuredBraiders: mockBraiders }
  }
}

export default async function HomePage() {
  const [
    { featuredProducts, featuredBraiders }, 
    homepageContent, 
    heroSlides,
    promotionSettings,
    activeHeroBanner
  ] = await Promise.all([
    getFeaturedData(),
    getHomepageContent(),
    getHeroSlides(),
    getPromotionSettings(),
    getActiveHeroBanner()
  ])

  // Decidir qual hero usar: slides do CMS têm prioridade, depois promoções
  const hasHeroSlides = heroSlides && heroSlides.length > 0
  const usePromotedHero = !hasHeroSlides && promotionSettings.system_enabled && activeHeroBanner

  return (
    <SiteLayout>
      {/* Dynamic Hero Section - Usa promoção ativa ou carousel padrão */}
      {usePromotedHero ? (
        <DynamicHeroBanner fallbackContent={defaultHeroContent} />
      ) : (
        <HeroCarouselDynamic slides={heroSlides} />
      )}

      {/* Featured Products Section */}
      <Section background="white" padding="md">
        <h2 className="text-3xl md:text-4xl font-bold font-heading text-center mb-10 bg-gradient-to-r from-brand-600 via-brand-700 to-accent-600 bg-clip-text text-transparent">
          {homepageContent.productsTitle}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="text-center mt-12">
          <Button
            asChild
            variant="outline"
            className="border-brand-500 text-brand-600 hover:bg-gradient-to-r hover:from-brand-500 hover:to-accent-500 hover:text-white px-8 py-3 text-lg font-semibold rounded-full transition-all duration-300 bg-transparent shadow-md hover:shadow-lg hover:border-transparent"
          >
            <Link href="/products">Ver Todos os Produtos</Link>
          </Button>
        </div>
      </Section>

      {/* Featured Braiders Section - Sempre mostrar trancistas */}
      <Section background="gray" padding="md">
        <h2 className="text-3xl md:text-4xl font-bold font-heading text-center mb-10 bg-gradient-to-r from-brand-600 via-brand-700 to-accent-600 bg-clip-text text-transparent">
          Nossos Profissionais de Beleza em Destaque
        </h2>
        <p className="text-lg md:text-xl text-center max-w-3xl mx-auto mb-12 text-gray-700 leading-relaxed">
          Encontre especialistas talentosos em tranças, tratamentos capilares e cuidados de beleza africanos
        </p>
        
        {/* Mostrar trancistas promovidas se sistema estiver ativo, senão mostrar tradicionais */}
        {promotionSettings.system_enabled ? (
          <div>
            <PromotedBraidersSection limit={4} showTitle={false} />
            {/* Garantir pelo menos 4 trancistas tradicionais sempre */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center mt-6">
              {featuredBraiders.slice(0, 4).map((braider) => (
                <BraiderCard key={braider.id} braider={braider} />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
            {featuredBraiders.slice(0, 4).map((braider) => (
              <BraiderCard key={braider.id} braider={braider} />
            ))}
          </div>
        )}
        
        <div className="text-center mt-12">
          <Button
            asChild
            variant="outline"
            className="border-brand-500 text-brand-600 hover:bg-gradient-to-r hover:from-brand-500 hover:to-accent-500 hover:text-white px-8 py-3 text-lg font-semibold rounded-full transition-all duration-300 bg-transparent shadow-md hover:shadow-lg hover:border-transparent"
          >
            <Link href="/braiders">Ver Todos os Profissionais</Link>
          </Button>
        </div>
      </Section>

      {/* Call to Action: Become a Braider */}
      <Section className="bg-gradient-to-br from-brand-50 via-brand-100 to-accent-50" padding="md">
        <div className="text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold font-heading bg-gradient-to-r from-brand-700 to-brand-800 bg-clip-text text-transparent">
            É Profissional de Beleza? Junte-se à Tuwi!
          </h2>
          <p className="text-lg md:text-xl max-w-3xl mx-auto text-brand-700 leading-relaxed">
            Expanda o seu negócio em Portugal e conecte-se com clientes que valorizam a sua expertise em beleza e cuidados capilares
          </p>
          <BraiderRegisterButton 
            className="bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white px-8 py-3 text-lg font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          />
        </div>
      </Section>

      {/* About Us / Call to Action Section */}
      <Section className="bg-gradient-to-br from-brand-800 via-brand-900 to-slate-800 text-white" padding="md">
        <div className="text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold font-heading bg-gradient-to-r from-accent-200 to-brand-200 bg-clip-text text-transparent">
            Beleza Sem Limites, Tradição Sem Fronteiras
          </h2>
          <p className="text-lg md:text-xl max-w-3xl mx-auto text-brand-100 leading-relaxed">
            Na Tuwi, celebramos a diversidade da beleza africana. Conectamos-te aos melhores profissionais especializados em tranças, tratamentos capilares e cuidados únicos para o teu cabelo.
          </p>
          <Button
            asChild
            className="bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white px-8 py-3 text-lg font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Link href="/about">Saiba Mais Sobre Nós</Link>
          </Button>
        </div>
      </Section>
    </SiteLayout>
  )
}
