import { SiteLayout } from "@/components/layouts/site-layout"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Users, Award, ShoppingBag, Sparkles } from "lucide-react"
import { getAboutContent } from "@/lib/cms-content"

// 🚀 ISR CONFIGURATION
export const revalidate = 3600 // 1 hora

export default async function AboutPage() {
  const content = await getAboutContent()
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
              {content.heroTitle}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              {content.heroSubtitle}
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
                {content.missionTitle}
              </h2>
              <div 
                className="text-lg text-gray-700 leading-relaxed prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: content.missionContent }}
              />
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-accent-100 to-brand-100 rounded-3xl p-8 shadow-lg">
                <Image
                  src={content.missionImage}
                  alt="História da Tuwi"
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
                Os princípios que guiam a nossa jornada e definem quem somos como plataforma de beleza diversa e inclusiva.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {content.values.map((value, index) => {
                const iconMap: Record<string, any> = {
                  'Heart': Heart,
                  'Award': Award, 
                  'Users': Users
                }
                const IconComponent = iconMap[value.icon] || Heart
                const colorClasses = [
                  'from-accent-500 to-accent-600',
                  'from-brand-500 to-brand-600',
                  'from-purple-500 to-purple-600'
                ]
                
                return (
                  <Card key={index} className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-3xl overflow-hidden group">
                    <CardContent className="p-8 text-center">
                      <div className={`bg-gradient-to-br ${colorClasses[index % 3]} rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                      <p className="text-gray-600 leading-relaxed">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Statistics Section */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl p-8 md:p-12 mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-heading mb-4">
                Nossa Jornada em Números
              </h2>
              <p className="text-lg text-gray-600">
                Conquistas que refletem o nosso compromisso com a excelência em conectar clientes e profissionais de beleza.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {content.statistics.map((stat, index) => {
                const colorMap: Record<string, string> = {
                  'accent': 'text-accent-600',
                  'brand': 'text-brand-600',
                  'purple': 'text-purple-600',
                  'green': 'text-green-600'
                }
                
                return (
                  <div key={index} className="text-center">
                    <div className="bg-white rounded-2xl p-6 shadow-md">
                      <div className={`text-3xl md:text-4xl font-bold mb-2 ${colorMap[stat.color] || 'text-gray-600'}`}>
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-heading mb-6">
              Pronta para Transformar Sua Beleza?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Explore a nossa plataforma e descubra a variedade de profissionais especializados em cuidados africanos que temos para oferecer. 
              Seja para tranças, tratamentos capilares ou cuidados especializados, a Tuwi conecta-te aos melhores profissionais da tua região em Portugal.
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
