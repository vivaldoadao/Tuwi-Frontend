"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  Crown, 
  Megaphone, 
  Gift, 
  Star,
  Euro, 
  Eye, 
  MousePointer, 
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Plus,
  Calendar,
  Target,
  BarChart3,
  ShoppingCart,
  CreditCard,
  Zap,
  Loader2
} from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { toast } from "react-hot-toast"

interface PromotionPackage {
  id: string
  name: string
  description: string
  type: 'profile_highlight' | 'hero_banner' | 'combo'
  duration_days: number
  price: number
  original_price: number | null
  features: string[]
  is_featured: boolean
  color: string
  icon: string
}

interface PromotionCombo {
  id: string
  name: string
  description: string
  included_types: string[]
  regular_price: number
  combo_price: number
  discount_percentage: number
  duration_days: number
  features: string[]
  is_active: boolean
  created_at: string
}

interface ComboCalculation {
  combo: PromotionCombo
  original_price: number
  combo_discount: number
  coupon_discount: number
  final_price: number
  total_savings: number
  promotions_to_create: any[]
}

interface UserSubscription {
  id: string
  combo_id: string
  combo_name: string
  status: 'active' | 'past_due' | 'cancelled' | 'trial'
  billing_cycle: 'monthly' | 'quarterly' | 'yearly'
  cycle_price: number
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  cancelled_at?: string
  total_amount_paid: number
  total_promotions_created: number
  auto_renew_promotions: boolean
  created_at: string
}

interface MyPromotion {
  id: string
  type: 'profile_highlight' | 'hero_banner' | 'combo_package'
  title: string
  description: string
  status: 'pending' | 'active' | 'expired' | 'cancelled' | 'rejected'
  price: number
  views_count: number
  clicks_count: number
  contacts_count: number
  start_date: string
  end_date: string
  created_at: string
  content_data: any
}

interface SystemSettings {
  system_enabled: boolean
  payments_enabled: boolean
  free_trial_enabled: boolean
}

export default function BraiderPromotionsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [packages, setPackages] = useState<PromotionPackage[]>([])
  const [combos, setCombos] = useState<PromotionCombo[]>([])
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([])
  const [myPromotions, setMyPromotions] = useState<MyPromotion[]>([])
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<PromotionPackage | null>(null)
  const [selectedCombo, setSelectedCombo] = useState<PromotionCombo | null>(null)
  const [comboCalculation, setComboCalculation] = useState<ComboCalculation | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isComboModalOpen, setIsComboModalOpen] = useState(false)
  const [submittingAction, setSubmittingAction] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'subscription'>('card')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly')
  
  // Estados para validação de duplicatas
  const [existingActivePromotions, setExistingActivePromotions] = useState<MyPromotion[]>([])
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)
  const [duplicatePromotion, setDuplicatePromotion] = useState<MyPromotion | null>(null)
  
  // Estados para extensão de promoções
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false)
  const [promotionToExtend, setPromotionToExtend] = useState<MyPromotion | null>(null)
  const [extensionDays, setExtensionDays] = useState(7)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    content_data: {}
  })

  useEffect(() => {
    if (user?.role === 'braider') {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch packages, combos, subscriptions, settings e minhas promoções em paralelo
      const [packagesRes, combosRes, subscriptionsRes, promotionsRes, settingsRes] = await Promise.all([
        fetch('/api/promotions/packages'),
        fetch('/api/promotions/combos'),
        fetch('/api/promotions/subscriptions'),
        fetch('/api/promotions'),
        fetch('/api/promotions/settings')
      ])

      if (packagesRes.ok) {
        const packagesData = await packagesRes.json()
        setPackages(packagesData.packages || [])
      }

      if (combosRes.ok) {
        const combosData = await combosRes.json()
        setCombos(combosData.combos || [])
      }

      if (subscriptionsRes.ok) {
        const subscriptionsData = await subscriptionsRes.json()
        setSubscriptions(subscriptionsData.subscriptions || [])
      }

      if (promotionsRes.ok) {
        const promotionsData = await promotionsRes.json()
        setMyPromotions(promotionsData.promotions || [])
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        const settingsMap = settingsData.settings || {}
        
        // Check if payments_enabled exists, if not, default to true (paid mode)
        let paymentsEnabled = settingsMap.payments_enabled?.value === true || settingsMap.payments_enabled?.value === 'true'
        
        // If payments_enabled is undefined, default to paid mode
        if (settingsMap.payments_enabled === undefined) {
          console.log('payments_enabled not found in settings, defaulting to paid mode')
          paymentsEnabled = true
        }

        const parsedSettings = {
          system_enabled: settingsMap.system_enabled?.value === true || settingsMap.system_enabled?.value === 'true',
          payments_enabled: paymentsEnabled,
          free_trial_enabled: settingsMap.free_trial_enabled?.value === true || settingsMap.free_trial_enabled?.value === 'true'
        }
        setSettings(parsedSettings)
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  // Verificar se já existe promoção ativa do mesmo tipo
  const checkForExistingPromotion = (packageType: string) => {
    const now = new Date()
    const existing = myPromotions.find(promo => 
      promo.type === packageType && 
      promo.status === 'active' && 
      new Date(promo.end_date) > now
    )
    
    if (existing) {
      setDuplicatePromotion(existing)
      
      // Para profile_highlight, bloquear completamente
      if (packageType === 'profile_highlight') {
        toast.error(`Você já possui uma promoção de "Destaque de Perfil" ativa até ${new Date(existing.end_date).toLocaleDateString('pt-BR')}. Apenas uma promoção deste tipo pode estar ativa por vez.`)
        return false
      }
      
      // Para outros tipos, mostrar aviso mas permitir
      if (packageType === 'hero_banner') {
        setShowDuplicateWarning(true)
        return 'warning'
      }
      
      if (packageType === 'combo_package') {
        setShowDuplicateWarning(true) 
        return 'warning'
      }
    }
    
    return true
  }

  // Verificar status do pacote para o usuário
  const getPackageStatus = (packageType: string) => {
    const now = new Date()
    const activePromotion = myPromotions.find(promo => 
      promo.type === packageType && 
      promo.status === 'active' && 
      new Date(promo.end_date) > now
    )
    
    const pendingPromotion = myPromotions.find(promo => 
      promo.type === packageType && 
      promo.status === 'pending'
    )
    
    if (activePromotion) {
      const daysLeft = Math.ceil((new Date(activePromotion.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return { 
        status: 'active', 
        promotion: activePromotion, 
        daysLeft,
        endDate: new Date(activePromotion.end_date).toLocaleDateString('pt-BR')
      }
    }
    
    if (pendingPromotion) {
      return { 
        status: 'pending', 
        promotion: pendingPromotion 
      }
    }
    
    return { status: 'available' }
  }

  // Função para abrir modal de extensão
  const handleExtendPromotion = (promotion: MyPromotion) => {
    setPromotionToExtend(promotion)
    setExtensionDays(7) // Default 7 dias
    setIsExtendModalOpen(true)
  }

  // Função para submeter extensão
  const handleSubmitExtension = async () => {
    if (!promotionToExtend) return

    try {
      setSubmittingAction('extending-promotion')
      
      const response = await fetch('/api/promotions/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promotion_id: promotionToExtend.id,
          additional_days: extensionDays
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Falha ao estender promoção')
      }

      const result = await response.json()
      toast.success(`Promoção estendida até ${result.new_end_date}!`)

      // Atualizar a lista de promoções
      setMyPromotions(prev => 
        prev.map(promo => 
          promo.id === promotionToExtend.id 
            ? { ...promo, end_date: result.promotion.end_date }
            : promo
        )
      )

      setIsExtendModalOpen(false)
      setPromotionToExtend(null)

    } catch (error) {
      console.error('Error extending promotion:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao estender promoção'
      toast.error(errorMessage)
    } finally {
      setSubmittingAction('')
    }
  }

  const handlePurchasePackage = (pkg: PromotionPackage) => {
    // Verificar duplicatas antes de continuar
    const duplicateCheck = checkForExistingPromotion(pkg.type)
    
    if (duplicateCheck === false) {
      // Bloqueado (profile_highlight com duplicata)
      return
    }
    
    setSelectedPackage(pkg)
    
    // Pré-preencher formulário baseado no tipo
    const defaultStartDate = new Date().toISOString().split('T')[0]
    const defaultEndDate = new Date(Date.now() + pkg.duration_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    setFormData({
      title: `${pkg.name} - ${user?.name || 'Minha Promoção'}`,
      description: pkg.description,
      start_date: defaultStartDate,
      end_date: defaultEndDate,
      content_data: pkg.type === 'hero_banner' ? {
        title: 'WILNARA TRANÇAS',
        subtitle: 'Serviços Profissionais',
        description: 'Transforme seu visual com nossas tranças artesanais.',
        imageUrl: '',
        ctaText: 'Ver Serviços',
        ctaLink: '/braiders/' + user?.id,
        secondaryCtaText: 'Contato',
        secondaryCtaLink: '/contact'
      } : {}
    })
    
    setIsCreateModalOpen(true)
  }

  const handleSubmitPromotion = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPackage) return

    setSubmittingAction('creating-promotion')
    try {
      const promotionData = {
        type: selectedPackage.type,
        title: formData.title,
        description: formData.description,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        content_data: formData.content_data,
        package_id: selectedPackage.id,
        price: selectedPackage.price,
        duration_days: selectedPackage.duration_days,
        target_type: 'specific_user',
        target_value: user?.email, // Explicitamente definir que é para o próprio usuário
        metadata: {
          package_name: selectedPackage.name,
          purchased_via: 'braider_dashboard'
        }
      }

      // Se pagamentos estão habilitados, usar Stripe
      if (settings?.payments_enabled && selectedPackage.price > 0) {
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
        throw new Error(error.error || 'Falha ao criar promoção')
      }

      const result = await response.json()
      toast.success(result.message || 'Promoção criada com sucesso!')

      setIsCreateModalOpen(false)
      setSelectedPackage(null)
      
      // Add new promotion to the list instead of reloading everything
      if (result.promotion) {
        setMyPromotions((prev: MyPromotion[]) => [result.promotion, ...prev])
      }

    } catch (error) {
      console.error('Error creating promotion:', error)
      toast.error('Erro ao criar promoção')
    } finally {
      setSubmittingAction('')
    }
  }

  const handlePurchaseCombo = async (combo: PromotionCombo) => {
    setSelectedCombo(combo)
    
    // Calcular preço sem cupom inicialmente
    try {
      const response = await fetch(`/api/promotions/combos/${combo.id}/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon_code: '' })
      })
      
      if (response.ok) {
        const calculation = await response.json()
        setComboCalculation(calculation)
      }
    } catch (error) {
      console.error('Error calculating combo price:', error)
    }
    
    setCouponCode('')
    setPaymentMethod('card')
    setBillingCycle('monthly')
    setIsComboModalOpen(true)
  }

  const handleApplyCoupon = async () => {
    if (!selectedCombo) return
    
    try {
      const response = await fetch(`/api/promotions/combos/${selectedCombo.id}/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon_code: couponCode })
      })
      
      if (response.ok) {
        const calculation = await response.json()
        setComboCalculation(calculation)
        if (calculation.coupon_discount > 0) {
          toast.success('Cupom aplicado com sucesso!')
        } else {
          toast('Cupom válido mas não aplicável a este combo')
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Cupom inválido')
      }
    } catch (error) {
      console.error('Error applying coupon:', error)
      toast.error('Erro ao aplicar cupom')
    }
  }

  const handleSubmitCombo = async () => {
    if (!selectedCombo) return
    
    try {
      const response = await fetch(`/api/promotions/combos/${selectedCombo.id}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupon_code: couponCode || undefined,
          payment_method: paymentMethod,
          billing_cycle: billingCycle
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Falha ao processar compra')
      }
      
      const result = await response.json()
      
      if (result.checkout_url) {
        toast.success('Redirecionando para pagamento...')
        window.location.href = result.checkout_url
      } else if (result.client_secret) {
        toast.success('Assinatura criada! Confirme o pagamento')
        // TODO: Integrar com Elements do Stripe para assinaturas
      } else {
        toast.success('Combo adquirido com sucesso!')
        setIsComboModalOpen(false)
        // Refresh only the promotions if needed, but avoid full page reload
      }
      
    } catch (error) {
      console.error('Error purchasing combo:', error)
      toast.error('Erro ao comprar combo')
    }
  }

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta assinatura? Ela permanecerá ativa até o final do período atual.')) {
      return
    }
    
    try {
      const response = await fetch(`/api/promotions/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Falha ao cancelar assinatura')
      }
      
      toast.success('Assinatura cancelada com sucesso')
      // Update subscription list locally instead of full reload
      setSubscriptions((prev: UserSubscription[]) => prev.filter(sub => sub.id !== subscriptionId))
      
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      toast.error('Erro ao cancelar assinatura')
    }
  }

  const getSubscriptionStatusBadge = (subscription: UserSubscription) => {
    const variants = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Ativa' },
      trial: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Trial' },
      past_due: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: 'Pagamento Pendente' },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Cancelada' }
    }

    const variant = variants[subscription.status] || variants.active
    const Icon = variant.icon

    return (
      <Badge className={variant.color}>
        <Icon className="h-3 w-3 mr-1" />
        {variant.label}
        {subscription.cancel_at_period_end && subscription.status === 'active' && ' (Cancel. no final)'}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pendente' },
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Ativa' },
      expired: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, label: 'Expirada' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelada' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejeitada' }
    }

    const variant = variants[status as keyof typeof variants] || variants.pending
    const Icon = variant.icon

    return (
      <Badge className={variant.color}>
        <Icon className="h-3 w-3 mr-1" />
        {variant.label}
      </Badge>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'profile_highlight': return Crown
      case 'hero_banner': return Megaphone
      case 'combo_package': case 'combo': return Gift
      default: return Star
    }
  }

  // Calcular estatísticas pessoais
  const totalSpent = myPromotions.reduce((sum, p) => sum + p.price, 0)
  const activePromotions = myPromotions.filter(p => p.status === 'active').length
  const totalViews = myPromotions.reduce((sum, p) => sum + p.views_count, 0)
  const totalClicks = myPromotions.reduce((sum, p) => sum + p.clicks_count, 0)

  if (user?.role !== 'braider') {
    return (
      <div className="text-center py-8">
        <p>Esta página é apenas para trancistas registradas.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando suas promoções...</p>
        </div>
      </div>
    )
  }

  if (!settings?.system_enabled) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">Sistema de promoções temporariamente desativado.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-gray-900 flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-green-600" />
            Marketplace de Promoções
          </h1>
          <p className="text-gray-600 mt-1">
            Compre promoções para destacar seu perfil e atrair mais clientes
          </p>
          {!settings?.payments_enabled && (
            <Badge className="bg-green-100 text-green-800 mt-2">
              🎉 Período GRATUITO ativo!
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={fetchData}
            variant="outline"
            disabled={loading}
          >
            Atualizar
          </Button>
          <Button
            onClick={() => {
              console.log('Current settings state:', settings)
              toast('Settings: ' + JSON.stringify(settings))
            }}
            variant="ghost"
            size="sm"
          >
            Debug Settings
          </Button>
          <Button
            onClick={fetchData}
            variant="ghost"
            size="sm"
            disabled={loading}
          >
            {loading ? "Carregando..." : "Atualizar Dados"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promoções Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePromotions}</div>
            <p className="text-xs text-muted-foreground">
              {myPromotions.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gasto Total</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalSpent}</div>
            <p className="text-xs text-muted-foreground">
              {settings?.payments_enabled ? 'Investimento' : 'Período gratuito'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total de views
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interações</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks}</div>
            <p className="text-xs text-muted-foreground">
              Clicks recebidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="packages" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="packages">🛒 Marketplace</TabsTrigger>
          <TabsTrigger value="combos">💎 Combos</TabsTrigger>
          <TabsTrigger value="subscriptions">📅 Assinaturas</TabsTrigger>
          <TabsTrigger value="my-promotions">✨ Ativas</TabsTrigger>
          <TabsTrigger value="analytics">📊 Relatórios</TabsTrigger>
        </TabsList>

        {/* Packages Tab */}
        <TabsContent value="packages" className="space-y-6">
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-600" />
                🛒 Marketplace de Promoções
              </CardTitle>
              <p className="text-gray-700">
                <strong>Como funciona:</strong> Compre uma promoção → Pagamento via Stripe → Sua promoção fica ativa automaticamente!
              </p>
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-100 p-2 rounded-lg mt-2">
                <CheckCircle className="h-4 w-4" />
                Ativação automática após pagamento • Sem aprovação manual • Resultados imediatos
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg) => {
                  const TypeIcon = getTypeIcon(pkg.type)
                  const hasDiscount = pkg.original_price && pkg.original_price > pkg.price
                  const packageStatus = getPackageStatus(pkg.type)

                  return (
                    <Card key={pkg.id} className={`relative overflow-hidden hover:shadow-lg transition-shadow ${
                      packageStatus.status === 'active' ? 'ring-2 ring-green-200 bg-green-50/20' : 
                      packageStatus.status === 'pending' ? 'ring-2 ring-amber-200 bg-amber-50/20' : ''
                    }`}>
                      
                      {/* Status Badge baseado no status da promoção */}
                      {packageStatus.status === 'active' && (
                        <div className="absolute top-4 right-4 z-10">
                          <Badge className="bg-green-500 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativa
                          </Badge>
                        </div>
                      )}
                      
                      {packageStatus.status === 'pending' && (
                        <div className="absolute top-4 right-4 z-10">
                          <Badge className="bg-amber-500 text-white">
                            <Clock className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        </div>
                      )}
                      
                      {packageStatus.status === 'available' && pkg.is_featured && (
                        <div className="absolute top-4 right-4 z-10">
                          <Badge className="bg-yellow-500 text-white">
                            <Star className="h-3 w-3 mr-1" />
                            Popular
                          </Badge>
                        </div>
                      )}
                      
                      <div 
                        className={`absolute top-0 left-0 right-0 h-2 ${
                          packageStatus.status === 'active' ? 'bg-gradient-to-r from-green-400 to-green-600' :
                          packageStatus.status === 'pending' ? 'bg-gradient-to-r from-amber-400 to-amber-600' : ''
                        }`}
                        style={packageStatus.status === 'available' ? { backgroundColor: pkg.color } : undefined}
                      />

                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div 
                            className="p-3 rounded-lg text-white"
                            style={{ backgroundColor: pkg.color }}
                          >
                            <TypeIcon className="h-6 w-6" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{pkg.name}</CardTitle>
                            {packageStatus.status === 'active' ? (
                              <p className="text-sm text-green-600 font-medium">
                                Termina em {packageStatus.daysLeft} dias ({packageStatus.endDate})
                              </p>
                            ) : packageStatus.status === 'pending' ? (
                              <p className="text-sm text-amber-600 font-medium">
                                Aguardando aprovação
                              </p>
                            ) : (
                              <p className="text-sm text-gray-500">{pkg.duration_days} dias</p>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <p className="text-gray-600">{pkg.description}</p>

                        {/* Mostrar preço apenas se não tiver promoção ativa/pendente */}
                        {packageStatus.status === 'available' && (
                          <div className="flex items-center gap-2">
                            {!settings?.payments_enabled ? (
                              <div className="text-2xl font-bold text-green-600">GRATUITO</div>
                            ) : (
                              <>
                                <div className="text-3xl font-bold">€{pkg.price}</div>
                                {hasDiscount && (
                                  <div className="text-gray-500 line-through">€{pkg.original_price}</div>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        <div className="space-y-2">
                          <p className="font-medium text-sm">Inclui:</p>
                          <ul className="space-y-1">
                            {pkg.features.slice(0, 4).map((feature, index) => (
                              <li key={index} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>{feature.replace('_', ' ')}</span>
                              </li>
                            ))}
                            {pkg.features.length > 4 && (
                              <li className="text-sm text-gray-500">
                                +{pkg.features.length - 4} funcionalidades
                              </li>
                            )}
                          </ul>
                        </div>

                        {/* Botão dinâmico baseado no status */}
                        {packageStatus.status === 'active' ? (
                          <div className="space-y-2">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="flex items-center gap-2 text-green-700">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">Promoção Ativa</span>
                              </div>
                              <div className="text-xs text-green-600 mt-1">
                                Termina em {packageStatus.daysLeft} dias ({packageStatus.endDate})
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => packageStatus.promotion && handleExtendPromotion(packageStatus.promotion)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Estender
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => handlePurchasePackage(pkg)}
                              >
                                <ShoppingCart className="h-3 w-3 mr-1" />
                                Comprar Nova
                              </Button>
                            </div>
                          </div>
                        ) : packageStatus.status === 'pending' ? (
                          <div className="space-y-2">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                              <div className="flex items-center gap-2 text-amber-700">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm font-medium">Aguardando Aprovação</span>
                              </div>
                              <div className="text-xs text-amber-600 mt-1">
                                Sua promoção está sendo analisada
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={() => handlePurchasePackage(pkg)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Comprar Adicional
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            className="w-full font-semibold" 
                            onClick={() => handlePurchasePackage(pkg)}
                            style={{ backgroundColor: pkg.color }}
                            size="lg"
                          >
                            {settings?.payments_enabled ? (
                              <>
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Comprar por €{pkg.price}
                              </>
                            ) : (
                              <>
                                <Zap className="h-4 w-4 mr-2" />
                                Ativar Grátis
                              </>
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Combos Tab */}
        <TabsContent value="combos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Combos Promocionais</CardTitle>
              <p className="text-gray-600">
                Economize comprando múltiplos tipos de promoção juntos
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {combos.map((combo) => {
                  const hasDiscount = combo.discount_percentage > 0
                  const savings = combo.regular_price - combo.combo_price

                  return (
                    <Card key={combo.id} className="relative overflow-hidden hover:shadow-lg transition-shadow border-2 border-green-200">
                      {hasDiscount && (
                        <div className="absolute top-4 right-4 z-10">
                          <Badge className="bg-red-500 text-white">
                            <Gift className="h-3 w-3 mr-1" />
                            -{combo.discount_percentage}%
                          </Badge>
                        </div>
                      )}
                      
                      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 to-blue-500" />

                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-lg bg-gradient-to-r from-green-400 to-blue-500 text-white">
                            <Gift className="h-6 w-6" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{combo.name}</CardTitle>
                            <p className="text-sm text-gray-500">{combo.duration_days} dias cada</p>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <p className="text-gray-600">{combo.description}</p>

                        <div className="space-y-2">
                          <p className="font-medium text-sm">Inclui Promoções:</p>
                          <div className="flex flex-wrap gap-2">
                            {combo.included_types.map((type, index) => {
                              const TypeIcon = getTypeIcon(type)
                              const typeNames = {
                                'profile_highlight': 'Destaque Perfil',
                                'hero_banner': 'Banner Hero'
                              }
                              return (
                                <Badge key={index} variant="outline" className="flex items-center gap-1">
                                  <TypeIcon className="h-3 w-3" />
                                  {typeNames[type as keyof typeof typeNames] || type}
                                </Badge>
                              )
                            })}
                          </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Preço individual:</span>
                            <span className="line-through text-gray-500">€{combo.regular_price}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">Preço do combo:</span>
                            {!settings?.payments_enabled ? (
                              <span className="text-2xl font-bold text-green-600">GRATUITO</span>
                            ) : (
                              <span className="text-2xl font-bold text-green-600">€{combo.combo_price}</span>
                            )}
                          </div>
                          {settings?.payments_enabled && savings > 0 && (
                            <div className="text-center text-sm text-green-600 font-medium">
                              💰 Economia de €{savings.toFixed(2)}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <p className="font-medium text-sm">Funcionalidades:</p>
                          <ul className="space-y-1">
                            {combo.features?.slice(0, 4).map((feature, index) => (
                              <li key={index} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>{feature}</span>
                              </li>
                            ))}
                            {(combo.features?.length || 0) > 4 && (
                              <li className="text-sm text-gray-500">
                                +{(combo.features?.length || 0) - 4} funcionalidades
                              </li>
                            )}
                          </ul>
                        </div>

                        <Button 
                          className="w-full bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600" 
                          onClick={() => handlePurchaseCombo(combo)}
                        >
                          <Gift className="h-4 w-4 mr-2" />
                          {settings?.payments_enabled ? 'Comprar Combo' : 'Ativar Combo Grátis'}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}

                {combos.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum combo disponível no momento</p>
                    <p className="text-sm">Verifique novamente mais tarde!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Minhas Assinaturas ({subscriptions.length})
              </CardTitle>
              <p className="text-gray-600">
                Gerencie suas assinaturas ativas e histórico de pagamentos
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscriptions.map((subscription) => {
                  const daysLeft = Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  const isActive = subscription.status === 'active'
                  
                  return (
                    <div key={subscription.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Calendar className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{subscription.combo_name}</h3>
                            <p className="text-sm text-gray-600">
                              Assinatura {subscription.billing_cycle === 'monthly' ? 'Mensal' : 
                                         subscription.billing_cycle === 'quarterly' ? 'Trimestral' : 'Anual'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(subscription.current_period_start).toLocaleDateString()} - {new Date(subscription.current_period_end).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getSubscriptionStatusBadge(subscription)}
                          <Badge variant="outline">€{subscription.cycle_price}</Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Total Pago</p>
                          <p className="font-semibold">€{subscription.total_amount_paid}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Promoções Criadas</p>
                          <p className="font-semibold">{subscription.total_promotions_created}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Renovação Automática</p>
                          <p className="font-semibold">
                            {subscription.auto_renew_promotions ? '✓ Ativa' : '× Desativa'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">{isActive ? 'Próximo Ciclo' : 'Status'}</p>
                          <p className="font-semibold">
                            {isActive ? `${daysLeft} dias` : 
                             subscription.cancelled_at ? 'Cancelada' : 'Inativa'}
                          </p>
                        </div>
                      </div>

                      {isActive && (
                        <div className="pt-2 border-t">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${Math.max(0, Math.min(100, (daysLeft / 30) * 100))}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-gray-600">
                              {daysLeft > 0 ? `${daysLeft} dias restantes` : 'Renovando...'}
                            </span>
                            {!subscription.cancel_at_period_end && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelSubscription(subscription.id)}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {subscriptions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Você não possui assinaturas ativas</p>
                    <p className="text-sm">Adquira um combo com assinatura para economizar!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Promotions Tab */}
        <TabsContent value="my-promotions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Minhas Promoções ({myPromotions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myPromotions.map((promotion) => {
                  const TypeIcon = getTypeIcon(promotion.type)
                  const daysLeft = Math.ceil((new Date(promotion.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  
                  return (
                    <div key={promotion.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <TypeIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{promotion.title}</h3>
                            <p className="text-sm text-gray-600">{promotion.description}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(promotion.start_date).toLocaleDateString()} - {new Date(promotion.end_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(promotion.status)}
                          <Badge variant="outline">€{promotion.price}</Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {promotion.views_count} views
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointer className="h-4 w-4" />
                          {promotion.clicks_count} clicks
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          {promotion.contacts_count} contatos
                        </span>
                        {promotion.status === 'active' && daysLeft > 0 && (
                          <span className="flex items-center gap-1 text-green-600">
                            <Calendar className="h-4 w-4" />
                            {daysLeft} dias restantes
                          </span>
                        )}
                      </div>

                      {promotion.status === 'active' && (
                        <div className="pt-2 border-t space-y-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${Math.max(0, Math.min(100, (daysLeft / 30) * 100))}%` }}
                            />
                          </div>
                          
                          {/* Botão Estender */}
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExtendPromotion(promotion)}
                              className="text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Estender
                            </Button>
                            <span className="text-xs text-gray-500">
                              Adicionar mais dias à esta promoção
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {myPromotions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Você ainda não possui promoções</p>
                    <p className="text-sm">Comece comprando seu primeiro pacote!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics das Suas Promoções
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{totalViews}</div>
                  <p className="text-gray-600">Total de Views</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{totalClicks}</div>
                  <p className="text-gray-600">Total de Clicks</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0.0'}%
                  </div>
                  <p className="text-gray-600">Taxa de Clique (CTR)</p>
                </div>
              </div>

              {myPromotions.length > 0 ? (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Performance por Promoção:</h4>
                  <div className="space-y-2">
                    {myPromotions
                      .filter(p => p.views_count > 0)
                      .sort((a, b) => b.views_count - a.views_count)
                      .slice(0, 5)
                      .map((promotion) => (
                        <div key={promotion.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span className="font-medium">{promotion.title}</span>
                          <div className="flex gap-4 text-sm text-gray-600">
                            <span>{promotion.views_count} views</span>
                            <span>{promotion.clicks_count} clicks</span>
                            <span className="text-purple-600">
                              {promotion.views_count > 0 ? ((promotion.clicks_count / promotion.views_count) * 100).toFixed(1) : '0.0'}% CTR
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum dado de analytics disponível</p>
                  <p className="text-sm">Suas estatísticas aparecerão após criar promoções</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Promotion Modal */}
      {selectedPackage && (
        <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
          setIsCreateModalOpen(open)
          if (!open) {
            // Limpar estados de duplicata ao fechar modal
            setDuplicatePromotion(null)
            setShowDuplicateWarning(false)
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Promoção - {selectedPackage.name}</DialogTitle>
              <DialogDescription>
                Configure os detalhes da sua promoção
              </DialogDescription>
            </DialogHeader>

            {/* Aviso para promoções existentes */}
            {duplicatePromotion && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-amber-800">
                      Promoção Existente Detectada
                    </h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Você já possui uma promoção "{duplicatePromotion.title}" do tipo {' '}
                      <span className="font-medium">
                        {selectedPackage.type === 'hero_banner' && 'Banner Destaque'}
                        {selectedPackage.type === 'profile_highlight' && 'Destaque de Perfil'}
                        {selectedPackage.type === 'combo' && 'Pacote Combo'}
                      </span>
                      {' '}ativa até {new Date(duplicatePromotion.end_date).toLocaleDateString('pt-BR')}.
                    </p>
                    {selectedPackage.type !== 'profile_highlight' && (
                      <p className="text-sm text-amber-700 mt-1">
                        <strong>Você pode continuar</strong>, mas considere se realmente precisa de duas promoções do mesmo tipo ativas simultaneamente.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitPromotion} className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Título da Promoção</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data de Início</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Data de Fim</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Resumo do Pacote:</h4>
                <div className="flex justify-between text-sm">
                  <span>Duração:</span>
                  <span>{selectedPackage.duration_days} dias</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Preço:</span>
                  <span className="font-bold">
                    {settings?.payments_enabled ? `€${selectedPackage.price}` : 'GRATUITO'}
                  </span>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submittingAction === 'creating-promotion'}>
                  {submittingAction === 'creating-promotion' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    settings?.payments_enabled ? 'Comprar & Ativar' : 'Ativar Gratuitamente'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Purchase Combo Modal */}
      {selectedCombo && (
        <Dialog open={isComboModalOpen} onOpenChange={setIsComboModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-green-600" />
                Comprar Combo - {selectedCombo.name}
              </DialogTitle>
              <DialogDescription>
                Configure sua compra do combo promocional
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Resumo do Combo */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Resumo do Combo
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Inclui:</span>
                    <span>{selectedCombo.included_types.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duração:</span>
                    <span>{selectedCombo.duration_days} dias cada</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Desconto:</span>
                    <span className="text-green-600 font-semibold">{selectedCombo.discount_percentage}%</span>
                  </div>
                </div>
              </div>

              {/* Cupom de Desconto */}
              {settings?.payments_enabled && (
                <div className="space-y-3">
                  <Label className="text-base font-medium">Cupom de Desconto (opcional)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite o código do cupom"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="uppercase"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleApplyCoupon}
                      disabled={!couponCode.trim()}
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              )}

              {/* Método de Pagamento */}
              {settings?.payments_enabled && (
                <div className="space-y-3">
                  <Label className="text-base font-medium">Método de Pagamento</Label>
                  <Select value={paymentMethod} onValueChange={(value: 'card' | 'subscription') => setPaymentMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Pagamento Único</SelectItem>
                      <SelectItem value="subscription">Assinatura Recorrente</SelectItem>
                    </SelectContent>
                  </Select>

                  {paymentMethod === 'subscription' && (
                    <div className="ml-4 space-y-2">
                      <Label className="text-sm">Ciclo de Cobrança</Label>
                      <Select value={billingCycle} onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') => setBillingCycle(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="quarterly">Trimestral (15% desconto)</SelectItem>
                          <SelectItem value="yearly">Anual (25% desconto)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {/* Cálculo de Preços */}
              {comboCalculation && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold mb-3">Resumo do Pedido</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Preço original:</span>
                      <span>€{comboCalculation.original_price}</span>
                    </div>
                    {comboCalculation.combo_discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Desconto combo:</span>
                        <span>-€{comboCalculation.combo_discount}</span>
                      </div>
                    )}
                    {comboCalculation.coupon_discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Desconto cupom:</span>
                        <span>-€{comboCalculation.coupon_discount}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-green-600">
                        {settings?.payments_enabled ? `€${comboCalculation.final_price}` : 'GRATUITO'}
                      </span>
                    </div>
                    {comboCalculation.total_savings > 0 && (
                      <div className="text-center text-green-600 text-sm font-medium">
                        💰 Você economiza €{comboCalculation.total_savings}!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsComboModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmitCombo}
                className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600"
              >
                <Gift className="h-4 w-4 mr-2" />
                {settings?.payments_enabled ? 'Finalizar Compra' : 'Ativar Gratuitamente'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Extensão de Promoção */}
      {promotionToExtend && (
        <Dialog open={isExtendModalOpen} onOpenChange={setIsExtendModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Estender Promoção</DialogTitle>
              <DialogDescription>
                Adicione mais dias à promoção "{promotionToExtend.title}"
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Término atual:</span>
                  <span className="font-medium">
                    {new Date(promotionToExtend.end_date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Novo término:</span>
                  <span className="font-medium text-green-600">
                    {new Date(new Date(promotionToExtend.end_date).getTime() + (extensionDays * 24 * 60 * 60 * 1000)).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="extension-days">Dias para adicionar:</Label>
                <Select value={extensionDays.toString()} onValueChange={(value) => setExtensionDays(Number(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="15">15 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                    <SelectItem value="60">60 dias</SelectItem>
                    <SelectItem value="90">90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Extensão Gratuita</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Esta extensão será aplicada imediatamente sem custo adicional.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsExtendModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitExtension}
                disabled={submittingAction === 'extending-promotion'}
              >
                {submittingAction === 'extending-promotion' ? (
                  <>
                    <Calendar className="mr-2 h-4 w-4 animate-pulse" />
                    Estendendo...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Estender por {extensionDays} dias
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}