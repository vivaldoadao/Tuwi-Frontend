"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft,
  Megaphone,
  Eye,
  Save,
  AlertCircle
} from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { ImageUploadPreview } from "@/components/image-upload-preview"
import Link from "next/link"

interface HeroBannerData {
  title: string
  subtitle: string
  description: string
  imageUrl: string
  ctaText: string
  ctaLink: string
  secondaryCtaText: string
  secondaryCtaLink: string
}

export default function CreateHeroBannerPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [bannerData, setBannerData] = useState<HeroBannerData>({
    title: 'WILNARA TRANÇAS',
    subtitle: 'Serviços Profissionais de Tranças',
    description: 'Transforme seu visual com nossas tranças artesanais. Qualidade, beleza e tradição em cada fio.',
    imageUrl: '',
    ctaText: 'Ver Meus Serviços',
    ctaLink: `/braiders/${user?.id}`,
    secondaryCtaText: 'Entre em Contato',
    secondaryCtaLink: '/contact'
  })

  const handleImageUpload = (imageUrl: string) => {
    setBannerData(prev => ({
      ...prev,
      imageUrl
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!bannerData.imageUrl) {
      toast.error('Por favor, adicione uma imagem para o banner')
      return
    }

    try {
      setLoading(true)

      // Primeiro verificar configurações do sistema
      const settingsResponse = await fetch('/api/promotions/settings')
      let systemSettings = null
      
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        const settingsMap = settingsData.settings || {}
        systemSettings = {
          payments_enabled: settingsMap.payments_enabled?.value === true
        }
      }

      // Criar promoção do tipo hero_banner
      const promotionData = {
        type: 'hero_banner',
        title: `Banner Hero - ${bannerData.subtitle}`,
        description: `Banner promocional: ${bannerData.description}`,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 dias
        content_data: bannerData,
        price: 29.99, // Preço padrão para banner hero
        duration_days: 14,
        metadata: {
          created_via: 'hero_builder',
          banner_type: 'custom'
        }
      }

      // Se pagamentos estão habilitados, usar Stripe
      if (systemSettings?.payments_enabled && promotionData.price > 0) {
        const checkoutResponse = await fetch('/api/promotions/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ promotion_data: promotionData })
        })

        if (!checkoutResponse.ok) {
          const error = await checkoutResponse.json()
          throw new Error(error.error || 'Falha ao criar sessão de pagamento')
        }

        const { checkout_url } = await checkoutResponse.json()
        
        toast.success('Redirecionando para pagamento...')
        
        // Redirect para Stripe Checkout
        window.location.href = checkout_url
        return
      }

      // Modo gratuito - criar promoção diretamente
      const response = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promotionData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Falha ao criar banner')
      }

      toast.success('Banner criado e enviado para aprovação!')
      router.push('/braider-dashboard/promotions')

    } catch (error) {
      console.error('Error creating hero banner:', error)
      toast.error('Erro ao criar banner hero')
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== 'braider') {
    return (
      <div className="text-center py-8">
        <p>Esta página é apenas para trancistas registradas.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/braider-dashboard/promotions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-heading text-gray-900 flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-orange-600" />
            Criar Banner Hero
          </h1>
          <p className="text-gray-600 mt-1">
            Crie um banner promocional para a página principal
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Configurar Banner</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Título Principal</Label>
                  <Input
                    value={bannerData.title}
                    onChange={(e) => setBannerData({...bannerData, title: e.target.value})}
                    placeholder="Ex: WILNARA TRANÇAS"
                    required
                  />
                </div>

                <div>
                  <Label>Subtítulo</Label>
                  <Input
                    value={bannerData.subtitle}
                    onChange={(e) => setBannerData({...bannerData, subtitle: e.target.value})}
                    placeholder="Ex: Box Braids Profissionais"
                    required
                  />
                </div>

                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={bannerData.description}
                    onChange={(e) => setBannerData({...bannerData, description: e.target.value})}
                    placeholder="Descrição atrativa do seu serviço..."
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <ImageUploadPreview
                    value={bannerData.imageUrl}
                    onChange={handleImageUpload}
                    folder="hero-banners"
                    label="Imagem de Fundo"
                    placeholder="Faça upload da imagem do banner (recomendado: 1920x1080px)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Botão Principal - Texto</Label>
                    <Input
                      value={bannerData.ctaText}
                      onChange={(e) => setBannerData({...bannerData, ctaText: e.target.value})}
                      placeholder="Ex: Ver Serviços"
                      required
                    />
                  </div>
                  <div>
                    <Label>Botão Principal - Link</Label>
                    <Input
                      value={bannerData.ctaLink}
                      onChange={(e) => setBannerData({...bannerData, ctaLink: e.target.value})}
                      placeholder="/braiders/seu-id"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Botão Secundário - Texto</Label>
                    <Input
                      value={bannerData.secondaryCtaText}
                      onChange={(e) => setBannerData({...bannerData, secondaryCtaText: e.target.value})}
                      placeholder="Ex: Contato"
                    />
                  </div>
                  <div>
                    <Label>Botão Secundário - Link</Label>
                    <Input
                      value={bannerData.secondaryCtaLink}
                      onChange={(e) => setBannerData({...bannerData, secondaryCtaLink: e.target.value})}
                      placeholder="/contact"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800">Importante:</p>
                    <ul className="mt-1 text-amber-700 space-y-1">
                      <li>• O banner será enviado para aprovação antes de ir ao ar</li>
                      <li>• Recomendamos imagens de alta qualidade (1920x1080px)</li>
                      <li>• O banner ficará ativo por 14 dias após aprovação</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={loading || !bannerData.imageUrl}
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Criando Banner...' : 'Criar e Enviar para Aprovação'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview do Banner
            </CardTitle>
            <p className="text-sm text-gray-500">Como seu banner aparecerá na homepage</p>
          </CardHeader>
          <CardContent>
            <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8 rounded-xl overflow-hidden min-h-[400px] flex items-center">
              {/* Background Image */}
              {bannerData.imageUrl && (
                <div className="absolute inset-0">
                  <img 
                    src={bannerData.imageUrl} 
                    alt="Banner background" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40"></div>
                </div>
              )}
              
              <div className="relative z-10 max-w-2xl">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 font-heading">
                  {bannerData.title || 'Seu Título'}
                </h1>
                <h2 className="text-2xl md:text-3xl mb-4 text-purple-200">
                  {bannerData.subtitle || 'Seu Subtítulo'}
                </h2>
                <p className="mb-8 opacity-90 text-lg leading-relaxed">
                  {bannerData.description || 'Sua descrição aparecerá aqui...'}
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-shadow cursor-pointer">
                    {bannerData.ctaText || 'CTA Principal'}
                  </div>
                  {bannerData.secondaryCtaText && (
                    <div className="border-2 border-white text-white px-8 py-3 rounded-full hover:bg-white hover:text-purple-600 transition-colors cursor-pointer">
                      {bannerData.secondaryCtaText}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Status da imagem:</span>
                <Badge className={bannerData.imageUrl ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {bannerData.imageUrl ? '✅ Imagem carregada' : '❌ Sem imagem'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Botões configurados:</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {bannerData.secondaryCtaText ? '2 botões' : '1 botão'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}