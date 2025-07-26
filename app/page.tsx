import Link from "next/link"
import { SiteLayout } from "@/components/layouts/site-layout"
import ProductCard from "@/components/product-card"
import BraiderCard from "@/components/braider-card"
import HeroCarouselOptimized from "@/components/hero-carousel-optimized"
import { Section } from "@/components/common/section"
import { Button } from "@/components/ui/button"
import type { Product, Braider } from "@/lib/data"

function getFeaturedData(): { featuredProducts: Product[], featuredBraiders: Braider[] } {
  // Dados mock para evitar timeouts - substitua por dados reais quando estiver pronto
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
    },
    {
      id: "3",
      name: "Twist Braids Modernas", 
      description: "Twist braids contemporâneas e versáteis",
      longDescription: "Twist braids contemporâneas e versáteis para todos os estilos",
      price: 39.99,
      imageUrl: "/placeholder.svg?height=300&width=300&text=Twist+Braids"
    },
    {
      id: "4",
      name: "Postiços Naturais",
      description: "Postiços de cabelo natural para complementar suas tranças",
      longDescription: "Postiços de cabelo natural de alta qualidade para complementar suas tranças",
      price: 29.99,
      imageUrl: "/placeholder.svg?height=300&width=300&text=Postiços"
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
      status: "approved"
    },
    {
      id: "mock-2",
      name: "Ana Costa",
      bio: "Trancista profissional especializada em box braids e twist braids.",
      location: "Rio de Janeiro, RJ", 
      contactEmail: "ana@example.com",
      contactPhone: "(21) 99999-5678",
      profileImageUrl: "/placeholder.svg?height=200&width=200&text=Ana",
      services: [],
      portfolioImages: ["/placeholder.svg?height=300&width=300&text=Portfolio2"],
      status: "approved"
    },
    {
      id: "mock-3",
      name: "Joana Santos",
      bio: "Especialista em protective styles e tranças Nagô, com técnicas ancestrais.",
      location: "Salvador, BA",
      contactEmail: "joana@example.com",
      contactPhone: "(71) 99999-9012",
      profileImageUrl: "/placeholder.svg?height=200&width=200&text=Joana",
      services: [],
      portfolioImages: ["/placeholder.svg?height=300&width=300&text=Portfolio3"],
      status: "approved"
    },
    {
      id: "mock-4", 
      name: "Camila Oliveira",
      bio: "Criadora de estilos únicos com foco em fulani braids e cornrows artísticas.",
      location: "Brasília, DF",
      contactEmail: "camila@example.com", 
      contactPhone: "(61) 99999-3456",
      profileImageUrl: "/placeholder.svg?height=200&width=200&text=Camila",
      services: [],
      portfolioImages: ["/placeholder.svg?height=300&width=300&text=Portfolio4"],
      status: "approved"
    }
  ]

  return {
    featuredProducts: mockProducts,
    featuredBraiders: mockBraiders
  }
}

export default function HomePage() {
  const { featuredProducts, featuredBraiders } = getFeaturedData()

  return (
    <SiteLayout>
      {/* Modern Hero Carousel Section */}
      <HeroCarouselOptimized />

      {/* Featured Products Section */}
      <Section background="white" padding="md">
        <h2 className="text-3xl md:text-4xl font-bold font-heading text-center mb-10 text-brand-800">
          Nossos Produtos em Destaque
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

      {/* Featured Braiders Section */}
      <Section background="gray" padding="md">
        <h2 className="text-3xl md:text-4xl font-bold font-heading text-center mb-10 text-brand-800">
          Conheça Nossas Trancistas em Destaque
        </h2>
        <p className="text-lg md:text-xl text-center max-w-3xl mx-auto mb-12 text-gray-700 leading-relaxed">
          Encontre profissionais talentosas e apaixonadas pela arte das tranças. Agende seu serviço com quem entende
          do assunto e transforme seu visual!
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

      {/* Call to Action: Become a Braider */}
      <Section background="brand" padding="md">
        <div className="text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-accent-400">
            É Trancista? Junte-se à Nossa Comunidade!
          </h2>
          <p className="text-lg md:text-xl max-w-3xl mx-auto text-white/90 leading-relaxed">
            Amplie seu alcance, gerencie seus agendamentos e conecte-se com novos clientes. Cadastre-se agora e faça
            parte da Wilnara Tranças!
          </p>
          <Button
            asChild
            className="bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white px-8 py-3 text-lg font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Link href="/register-braider">Cadastre-se como Trancista</Link>
          </Button>
        </div>
      </Section>

      {/* About Us / Call to Action Section */}
      <Section className="bg-brand-800 text-white" padding="md">
        <div className="text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-accent-400">
            A Beleza da Tradição, o Estilo da Modernidade
          </h2>
          <p className="text-lg md:text-xl max-w-3xl mx-auto text-white/90 leading-relaxed">
            Na Wilnara Tranças, celebramos a arte e a cultura das tranças, oferecendo produtos que realçam sua
            identidade e confiança. Descubra a diferença de um trabalho feito com paixão e dedicação.
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
