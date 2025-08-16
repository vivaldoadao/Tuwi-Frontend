"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Send } from "lucide-react"

export default function ContactForm() {
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
  )
}