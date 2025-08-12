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
  title: 'Wilnara Tranças - Produtos e Serviços de Tranças Profissionais',
  description: 'Descubra os melhores produtos e serviços de tranças com nossas trancistas profissionais. Agendamentos online, produtos premium e atendimento especializado.',
  keywords: 'tranças, box braids, goddess braids, trancistas, agendamento online',
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
        name: "Box Braids Premium",
        description: "Tranças box braids profissionais de alta qualidade",
        longDescription: "Tranças box braids profissionais de alta qualidade com material premium",
        price: 45.99,
        imageUrl: "/placeholder.svg?height=300&width=300&text=Box+Braids"
      },
      {
        id: "2", 
        name: "Goddess Braids Luxo",
        description: "Goddess braids elegantes para ocasiões especiais",
        longDescription: "Goddess braids elegantes para ocasiões especiais com acabamento perfeito",
        price: 65.99,
        imageUrl: "/placeholder.svg?height=300&width=300&text=Goddess+Braids"
      }
    ]

    const mockBraiders: Braider[] = [
      {
        id: "mock-1",
        name: "Maria Silva",
        bio: "Especialista em tranças africanas com mais de 10 anos de experiência.",
        location: "São Paulo, SP",
        contactEmail: "maria@example.com",
        contactPhone: "(11) 99999-1234",
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

  // Decidir qual hero usar: promoção ou carousel padrão
  const usePromotedHero = promotionSettings.system_enabled && activeHeroBanner

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
        <h2 className="text-3xl md:text-4xl font-bold font-heading text-center mb-10 text-brand-800">
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
            className="border-brand-600 text-brand-700 hover:bg-brand-600 hover:text-white px-8 py-3 text-lg font-semibold rounded-full transition-all duration-300 bg-transparent shadow-md hover:shadow-lg"
          >
            <Link href="/products">Ver Todos os Produtos</Link>
          </Button>
        </div>
      </Section>

      {/* Promoted Braiders Section - Exibe perfis em destaque se sistema estiver ativo */}
      {promotionSettings.system_enabled ? (
        <Section background="gray" padding="md">
          <PromotedBraidersSection limit={6} />
        </Section>
      ) : (
        /* Featured Braiders Section - Fallback tradicional */
        <Section background="gray" padding="md">
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-center mb-10 text-brand-800">
            {homepageContent.braidersTitle}
          </h2>
          <p className="text-lg md:text-xl text-center max-w-3xl mx-auto mb-12 text-gray-700 leading-relaxed">
            {homepageContent.braidersSubtitle}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
            {featuredBraiders.map((braider) => (
              <BraiderCard key={braider.id} braider={braider} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Button
              asChild
              variant="outline"
              className="border-brand-600 text-brand-700 hover:bg-brand-600 hover:text-white px-8 py-3 text-lg font-semibold rounded-full transition-all duration-300 bg-transparent shadow-md hover:shadow-lg"
            >
              <Link href="/braiders">Ver Todas as Trancistas</Link>
            </Button>
          </div>
        </Section>
      )}

      {/* Call to Action: Become a Braider */}
      <Section background="brand" padding="md">
        <div className="text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-accent-400">
            {homepageContent.ctaBraiderTitle}
          </h2>
          <p className="text-lg md:text-xl max-w-3xl mx-auto text-white/90 leading-relaxed">
            {homepageContent.ctaBraiderSubtitle}
          </p>
          <BraiderRegisterButton 
            className="bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white px-8 py-3 text-lg font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          />
        </div>
      </Section>

      {/* About Us / Call to Action Section */}
      <Section className="bg-brand-800 text-white" padding="md">
        <div className="text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-accent-400">
            {homepageContent.aboutTitle}
          </h2>
          <p className="text-lg md:text-xl max-w-3xl mx-auto text-white/90 leading-relaxed">
            {homepageContent.aboutSubtitle}
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
