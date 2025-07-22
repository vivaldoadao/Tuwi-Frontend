import Image from "next/image"
import Link from "next/link"
import SiteHeader from "@/components/site-header"
import ProductCard from "@/components/product-card"
import BraiderCard from "@/components/braider-card"
import { Button } from "@/components/ui/button"
import { getFeaturedProducts, getFeaturedBraiders } from "@/lib/data"

export default function HomePage() {
  const featuredProducts = getFeaturedProducts()
  const featuredBraiders = getFeaturedBraiders()

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full h-[500px] md:h-[600px] flex items-center justify-center text-center p-4 bg-brand-background">
          <Image
            src="/hero-braids.png"
            alt="Mulher com tranças"
            layout="fill"
            objectFit="cover"
            className="absolute inset-0 z-0 opacity-70"
            unoptimized={true}
            width={1200}
            height={1800}
          />
          <div className="relative z-10 max-w-3xl space-y-6 bg-black/50 p-8 rounded-lg shadow-xl">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-lg">
              WILNARA TRANÇAS
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              Realce sua beleza natural com nossas tranças e postiços de alta qualidade. Estilo, conforto e durabilidade
              em cada fio.
            </p>
            <Button
              asChild
              className="bg-brand-accent hover:bg-brand-primary text-brand-primary hover:text-white px-8 py-3 text-lg font-semibold rounded-full transition-colors shadow-lg"
            >
              <Link href="/products">Compre Agora</Link>
            </Button>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="py-12 md:py-20 bg-white text-gray-900">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-brand-primary">
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
                className="border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white px-8 py-3 text-lg font-semibold rounded-full transition-colors bg-transparent"
              >
                <Link href="/products">Ver Todos os Produtos</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Featured Braiders Section */}
        <section className="py-12 md:py-20 bg-gray-100 text-gray-900">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-brand-primary">
              Conheça Nossas Trancistas em Destaque
            </h2>
            <p className="text-lg md:text-xl text-center max-w-3xl mx-auto mb-12 text-gray-700">
              Encontre profissionais talentosas e apaixonadas pela arte das tranças. Agende seu serviço com quem entende
              do assunto e transforme seu visual!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8 justify-items-center">
              {featuredBraiders.map((braider) => (
                <BraiderCard key={braider.id} braider={braider} />
              ))}
            </div>
            <div className="text-center mt-12">
              <Button
                asChild
                variant="outline"
                className="border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white px-8 py-3 text-lg font-semibold rounded-full transition-colors bg-transparent"
              >
                <Link href="/braiders">Ver Todas as Trancistas</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Call to Action: Become a Braider */}
        <section className="py-12 md:py-20 bg-brand-background text-white">
          <div className="container px-4 md:px-6 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-accent">
              É Trancista? Junte-se à Nossa Comunidade!
            </h2>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-white/90">
              Amplie seu alcance, gerencie seus agendamentos e conecte-se com novos clientes. Cadastre-se agora e faça
              parte da Wilnara Tranças!
            </p>
            <Button
              asChild
              className="bg-brand-accent hover:bg-white text-brand-primary hover:text-brand-primary px-8 py-3 text-lg font-semibold rounded-full transition-colors shadow-lg"
            >
              <Link href="/register-braider">Cadastre-se como Trancista</Link>
            </Button>
          </div>
        </section>

        {/* About Us / Call to Action Section (Existing) */}
        <section className="py-12 md:py-20 bg-brand-primary text-white">
          <div className="container px-4 md:px-6 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-accent">
              A Beleza da Tradição, o Estilo da Modernidade
            </h2>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-white/90">
              Na Wilnara Tranças, celebramos a arte e a cultura das tranças, oferecendo produtos que realçam sua
              identidade e confiança. Descubra a diferença de um trabalho feito com paixão e dedicação.
            </p>
            <Button
              asChild
              className="bg-brand-accent hover:bg-white text-brand-primary hover:text-brand-primary px-8 py-3 text-lg font-semibold rounded-full transition-colors shadow-lg"
            >
              <Link href="/about">Saiba Mais Sobre Nós</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-brand-primary text-white py-8">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/wilnara-logo.png"
              alt="Wilnara Tranças Logo"
              width={30}
              height={30}
              className="rounded-full"
              unoptimized={true}
            />
            <span className="text-lg font-bold text-brand-accent">WILNARA TRANÇAS</span>
          </div>
          <nav className="flex gap-6 text-sm">
            <Link href="#" className="hover:text-brand-accent transition-colors">
              Política de Privacidade
            </Link>
            <Link href="#" className="hover:text-brand-accent transition-colors">
              Termos de Serviço
            </Link>
            <Link href="#" className="hover:text-brand-accent transition-colors">
              FAQ
            </Link>
          </nav>
          <p className="text-sm text-white/80">
            © {new Date().getFullYear()} Wilnara Tranças. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
