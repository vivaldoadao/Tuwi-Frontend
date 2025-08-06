import { SiteLayout } from "@/components/layouts/site-layout"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Users, Award, ShoppingBag, Sparkles } from "lucide-react"

export default function AboutPage() {
  return (
    <SiteLayout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="text-center space-y-6">
            <Badge className="bg-accent-500 text-white text-sm px-4 py-2 rounded-full mb-4">
              Nossa História
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold font-heading mb-6">
              Sobre a{" "}
              <span className="bg-gradient-to-r from-accent-300 to-accent-400 bg-clip-text text-transparent">
                Wilnara Tranças
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Uma jornada de paixão pela arte das tranças, conectando tradição e modernidade 
              para realçar a beleza natural de cada mulher.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          
          {/* Story Section */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-heading">
                Nossa Missão
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Bem-vindo à <strong>Wilnara Tranças</strong>, seu destino online para postiços femininos de alta qualidade e tranças
                artesanais. Nascemos da paixão por realçar a beleza natural e a individualidade de cada mulher, oferecendo
                produtos que combinam tradição, modernidade e estilo.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Nossa missão é empoderar você a expressar sua identidade através de penteados versáteis e deslumbrantes.
                Acreditamos que cada trança e cada postiço contam uma história, e estamos aqui para ajudar você a criar a sua.
              </p>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-accent-100 to-brand-100 rounded-3xl p-8 shadow-lg">
                <Image
                  src="/placeholder.svg?height=400&width=400&text=Nossa+História"
                  alt="História da Wilnara Tranças"
                  width={400}
                  height={400}
                  className="rounded-2xl mx-auto"
                />
              </div>
            </div>
          </div>

          {/* Values Section */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-heading mb-4">
                Nossos Valores
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Os princípios que guiam nossa jornada e definem quem somos como marca e comunidade.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-3xl overflow-hidden group">
                <CardContent className="p-8 text-center">
                  <div className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Paixão pela Arte</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Cada trança é criada com amor e dedicação, respeitando as tradições ancestrais 
                    e abraçando técnicas modernas para resultados excepcionais.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-3xl overflow-hidden group">
                <CardContent className="p-8 text-center">
                  <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Qualidade Premium</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Trabalhamos apenas com materiais de primeira linha e técnicas que garantem 
                    durabilidade, conforto e um acabamento impecável em cada produto.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-3xl overflow-hidden group">
                <CardContent className="p-8 text-center">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Comunidade Forte</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Mais que uma loja, somos uma comunidade que celebra a diversidade, 
                    conecta pessoas e fortalece a autoestima através da beleza autêntica.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl p-8 md:p-12 mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-heading mb-4">
                Nossa Jornada em Números
              </h2>
              <p className="text-lg text-gray-600">
                Conquistas que refletem nosso compromisso com a excelência e satisfação das clientes.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-white rounded-2xl p-6 shadow-md">
                  <div className="text-3xl md:text-4xl font-bold text-accent-600 mb-2">500+</div>
                  <div className="text-sm text-gray-600">Clientes Satisfeitas</div>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white rounded-2xl p-6 shadow-md">
                  <div className="text-3xl md:text-4xl font-bold text-brand-600 mb-2">50+</div>
                  <div className="text-sm text-gray-600">Produtos Únicos</div>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white rounded-2xl p-6 shadow-md">
                  <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">4.9</div>
                  <div className="text-sm text-gray-600">Avaliação Média</div>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white rounded-2xl p-6 shadow-md">
                  <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">3+</div>
                  <div className="text-sm text-gray-600">Anos de Experiência</div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-heading mb-6">
              Pronta para Descobrir Sua Beleza?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Explore nossa coleção e descubra a variedade de estilos, cores e texturas que temos a oferecer. 
              Seja para um visual clássico, ousado ou natural, a Wilnara Tranças tem a opção perfeita para você.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Link href="/products">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Ver Produtos
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-brand-600 text-brand-700 hover:bg-brand-600 hover:text-white px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300"
              >
                <Link href="/contact">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Fale Conosco
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}
