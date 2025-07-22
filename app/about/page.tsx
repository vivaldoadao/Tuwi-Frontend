import SiteHeader from "@/components/site-header"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-20">
        <div className="container px-4 md:px-6">
          <h1 className="text-4xl font-bold text-center mb-10 text-brand-primary">Sobre Nós</h1>
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto space-y-6">
            <p className="text-lg leading-relaxed text-gray-700">
              Bem-vindo à Wilnara Tranças, seu destino online para postiços femininos de alta qualidade e tranças
              artesanais. Nascemos da paixão por realçar a beleza natural e a individualidade de cada mulher, oferecendo
              produtos que combinam tradição, modernidade e estilo.
            </p>
            <p className="text-lg leading-relaxed text-gray-700">
              Nossa missão é empoderar você a expressar sua identidade através de penteados versáteis e deslumbrantes.
              Acreditamos que cada trança e cada postiço contam uma história, e estamos aqui para ajudar você a criar a
              sua. Trabalhamos com materiais premium e técnicas que garantem durabilidade, conforto e um acabamento
              impecável.
            </p>
            <p className="text-lg leading-relaxed text-gray-700">
              Explore nossa coleção e descubra a variedade de estilos, cores e texturas que temos a oferecer. Seja para
              um visual clássico, ousado ou natural, a Wilnara Tranças tem a opção perfeita para você. Junte-se à nossa
              comunidade e celebre a beleza das tranças conosco!
            </p>
            <div className="text-center pt-6">
              <Button
                asChild
                className="bg-brand-accent hover:bg-brand-background text-brand-primary hover:text-white px-8 py-3 text-lg font-semibold rounded-full transition-colors shadow-lg"
              >
                <Link href="/contact">Fale Conosco</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
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
          <p className="text-sm text-white/80">
            © {new Date().getFullYear()} Wilnara Tranças. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
