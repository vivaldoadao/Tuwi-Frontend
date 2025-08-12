import { SiteLayout } from "@/components/layouts/site-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, HeadphonesIcon } from "lucide-react"
import { getContactContent } from "@/lib/cms-content"
import ContactForm from "@/components/contact-form"

// 🚀 ISR CONFIGURATION
export const revalidate = 3600 // 1 hora

export default async function ContactPage() {
  const content = await getContactContent()

  return (
    <SiteLayout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="text-center space-y-6">
            <Badge className="bg-accent-500 text-white text-sm px-4 py-2 rounded-full mb-4">
              Entre em Contato
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

      <div className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          
          {/* Contact Info Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-3xl overflow-hidden group">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Email</h3>
                <p className="text-gray-600 mb-2">{content.email}</p>
                <p className="text-sm text-gray-500">Resposta em até 24h</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-3xl overflow-hidden group">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Phone className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Telefone</h3>
                <p className="text-gray-600 mb-2">{content.phone}</p>
                <p className="text-sm text-gray-500">Seg-Sex: {content.hours.weekdays}</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-3xl overflow-hidden group">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <HeadphonesIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Suporte</h3>
                <p className="text-gray-600 mb-2">{content.support}</p>
                <p className="text-sm text-gray-500">WhatsApp e Chat online</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Contact Form */}
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            
            {/* Contact Form */}
            <ContactForm />

            {/* Additional Information */}
            <div className="space-y-8">
              
              {/* Business Hours */}
              <Card className="bg-white shadow-lg border-0 rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Horário de Atendimento</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Segunda a Sexta</span>
                      <span className="font-medium">{content.hours.weekdays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sábado</span>
                      <span className="font-medium">{content.hours.saturday}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Domingo</span>
                      <span className="font-medium text-red-500">{content.hours.sunday}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ Quick Links */}
              <Card className="bg-gradient-to-br from-accent-50 to-brand-50 border-0 rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Perguntas Frequentes</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Como cuidar das tranças?</h4>
                      <p className="text-sm text-gray-600">Dicas completas de manutenção e durabilidade.</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Prazo de entrega</h4>
                      <p className="text-sm text-gray-600">Informações sobre prazos e envio.</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Política de troca</h4>
                      <p className="text-sm text-gray-600">Como proceder em caso de problemas.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location Info */}
              <Card className="bg-white shadow-lg border-0 rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Localização</h3>
                  </div>
                  <div className="space-y-3">
                    <p className="text-gray-600">
                      <strong>{content.location.name}</strong><br />
                      {content.location.address}<br />
                      {content.location.postal}
                    </p>
                    <p className="text-sm text-gray-500">
                      * {content.location.note}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}
