"use client"

import { SiteLayout } from "@/components/layouts/site-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, HeadphonesIcon } from "lucide-react"
import { useState } from "react"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitStatus('success')
      setFormData({ name: '', email: '', subject: '', message: '' })
      
      // Reset status after 3 seconds
      setTimeout(() => setSubmitStatus('idle'), 3000)
    }, 2000)
  }

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
              Fale{" "}
              <span className="bg-gradient-to-r from-accent-300 to-accent-400 bg-clip-text text-transparent">
                Conosco
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Tem alguma dúvida, sugestão ou precisa de ajuda? Nossa equipe está pronta para atendê-la 
              com todo carinho e dedicação.
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
                <p className="text-gray-600 mb-2">contato@wilnaratranças.com</p>
                <p className="text-sm text-gray-500">Resposta em até 24h</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-3xl overflow-hidden group">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Phone className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Telefone</h3>
                <p className="text-gray-600 mb-2">+351 912 345 678</p>
                <p className="text-sm text-gray-500">Seg-Sex: 9h às 18h</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-3xl overflow-hidden group">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <HeadphonesIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Suporte</h3>
                <p className="text-gray-600 mb-2">Atendimento especializado</p>
                <p className="text-sm text-gray-500">WhatsApp e Chat online</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Contact Form */}
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            
            {/* Contact Form */}
            <Card className="bg-white shadow-xl border-0 rounded-3xl overflow-hidden">
              <CardContent className="p-8 md:p-12">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 font-heading mb-4">
                    Envie sua Mensagem
                  </h2>
                  <p className="text-gray-600">
                    Preencha o formulário abaixo e nossa equipe retornará o contato em breve.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-900 font-medium">
                        Nome Completo *
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Seu nome completo"
                        required
                        className="h-12 bg-gray-50 border-gray-200 focus:border-accent-500 focus:ring-accent-500 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-900 font-medium">
                        Email *
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="seu@email.com"
                        required
                        className="h-12 bg-gray-50 border-gray-200 focus:border-accent-500 focus:ring-accent-500 rounded-xl"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-gray-900 font-medium">
                      Assunto *
                    </Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Sobre o que você gostaria de falar?"
                      required
                      className="h-12 bg-gray-50 border-gray-200 focus:border-accent-500 focus:ring-accent-500 rounded-xl"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-gray-900 font-medium">
                      Mensagem *
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Descreva sua dúvida, sugestão ou pedido de ajuda..."
                      rows={6}
                      required
                      className="bg-gray-50 border-gray-200 focus:border-accent-500 focus:ring-accent-500 rounded-xl resize-none"
                    />
                  </div>

                  {submitStatus === 'success' && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <p className="text-green-800 text-center font-medium">
                        ✅ Mensagem enviada com sucesso! Retornaremos em breve.
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Enviando...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Send className="mr-2 h-5 w-5" />
                        Enviar Mensagem
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

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
                      <span className="font-medium">9h às 18h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sábado</span>
                      <span className="font-medium">9h às 15h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Domingo</span>
                      <span className="font-medium text-red-500">Fechado</span>
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
                      <strong>Wilnara Tranças</strong><br />
                      Rua das Flores, 123<br />
                      1200-001 Lisboa, Portugal
                    </p>
                    <p className="text-sm text-gray-500">
                      * Atendimento presencial apenas com agendamento prévio
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
