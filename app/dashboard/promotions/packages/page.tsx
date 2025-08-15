"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  Star,
  Crown,
  Megaphone,
  Gift,
  Euro,
  Save,
  X,
  Users,
  Percent,
  Clock,
  Zap
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
  is_active: boolean
  is_featured: boolean
  sort_order: number
  color: string
  icon: string
  created_at: string
  updated_at: string
}

interface PromotionCombo {
  id: string
  name: string
  description: string
  included_types: string[]
  profile_highlight_days: number
  hero_banner_days: number
  combo_package_days: number
  regular_price: number
  combo_price: number
  discount_percentage: number
  badge_text: string
  highlight_color: string
  features: string[]
  is_active: boolean
  is_featured: boolean
  sort_order: number
  min_subscription_months: number
  max_uses_per_user: number | null
  created_at: string
  updated_at: string
}

interface PromotionSubscription {
  id: string
  user_id: string
  combo_id: string | null
  package_id: string | null
  billing_cycle: 'monthly' | 'quarterly' | 'yearly'
  cycle_price: number
  currency: string
  status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'suspended' | 'expired'
  trial_ends_at: string | null
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  cancelled_at: string | null
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  auto_renew_promotions: boolean
  next_promotion_start: string | null
  total_promotions_created: number
  total_amount_paid: number
  created_at: string
  updated_at: string
  // Campos calculados
  user_name?: string
  user_email?: string
  combo_name?: string
  package_name?: string
}

const typeOptions = [
  { value: 'profile_highlight', label: 'Perfil em Destaque', icon: Crown, color: '#8B5CF6' },
  { value: 'hero_banner', label: 'Banner Hero', icon: Megaphone, color: '#F59E0B' },
  { value: 'combo', label: 'Pacote Combo', icon: Gift, color: '#EC4899' }
]

const iconOptions = [
  'star', 'crown', 'megaphone', 'gift', 'trending-up', 'zap', 'rocket', 'diamond'
]

export default function PackagesPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("packages")
  
  // Packages state
  const [packages, setPackages] = useState<PromotionPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPackage, setEditingPackage] = useState<PromotionPackage | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'profile_highlight',
    duration_days: 7,
    price: 0,
    original_price: null as number | null,
    features: [''],
    is_featured: false,
    sort_order: 0,
    color: '#3B82F6',
    icon: 'star'
  })

  // Combos state
  const [combos, setCombos] = useState<PromotionCombo[]>([])
  const [loadingCombos, setLoadingCombos] = useState(true)
  const [editingCombo, setEditingCombo] = useState<PromotionCombo | null>(null)
  const [isCreateComboModalOpen, setIsCreateComboModalOpen] = useState(false)
  const [comboFormData, setComboFormData] = useState({
    name: '',
    description: '',
    included_types: ['profile_highlight'],
    profile_highlight_days: 7,
    hero_banner_days: 0,
    combo_package_days: 0,
    regular_price: 0,
    combo_price: 0,
    badge_text: 'COMBO',
    highlight_color: '#10B981',
    features: [''],
    is_featured: false,
    sort_order: 0,
    min_subscription_months: 1,
    max_uses_per_user: undefined
  })

  // Subscriptions state  
  const [subscriptions, setSubscriptions] = useState<PromotionSubscription[]>([])
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true)

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPackages()
      fetchCombos()
      fetchSubscriptions()
    }
  }, [user])

  const fetchPackages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/promotions/packages?admin=true')
      
      if (response.ok) {
        const data = await response.json()
        setPackages(data.packages || [])
      } else {
        throw new Error('Failed to fetch packages')
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
      toast.error('Erro ao carregar pacotes')
    } finally {
      setLoading(false)
    }
  }

  const fetchCombos = async () => {
    try {
      setLoadingCombos(true)
      const response = await fetch('/api/promotions/combos?include_inactive=true')
      
      if (response.ok) {
        const data = await response.json()
        setCombos(data.combos || [])
      } else {
        throw new Error('Failed to fetch combos')
      }
    } catch (error) {
      console.error('Error fetching combos:', error)
      toast.error('Erro ao carregar combos')
    } finally {
      setLoadingCombos(false)
    }
  }

  const fetchSubscriptions = async () => {
    try {
      setLoadingSubscriptions(true)
      const response = await fetch('/api/promotions/subscriptions?admin=true')
      
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions || [])
      } else {
        throw new Error('Failed to fetch subscriptions')
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
      toast.error('Erro ao carregar assinaturas')
    } finally {
      setLoadingSubscriptions(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const method = editingPackage ? 'PUT' : 'POST'
      const url = '/api/promotions/packages'
      
      const payload = {
        ...formData,
        features: formData.features.filter(f => f.trim() !== ''),
        original_price: formData.original_price || null,
        ...(editingPackage && { id: editingPackage.id })
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save package')
      }

      toast.success(`Pacote ${editingPackage ? 'atualizado' : 'criado'} com sucesso!`)
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        type: 'profile_highlight',
        duration_days: 7,
        price: 0,
        original_price: null,
        features: [''],
        is_featured: false,
        sort_order: 0,
        color: '#3B82F6',
        icon: 'star'
      })
      
      setEditingPackage(null)
      setIsCreateModalOpen(false)
      fetchPackages()

    } catch (error) {
      console.error('Error saving package:', error)
      toast.error('Erro ao salvar pacote')
    }
  }

  const handleEdit = (pkg: PromotionPackage) => {
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      type: pkg.type,
      duration_days: pkg.duration_days,
      price: pkg.price,
      original_price: pkg.original_price,
      features: pkg.features.length > 0 ? pkg.features : [''],
      is_featured: pkg.is_featured,
      sort_order: pkg.sort_order,
      color: pkg.color,
      icon: pkg.icon
    })
    setEditingPackage(pkg)
    setIsCreateModalOpen(true)
  }

  const handleDelete = async (packageId: string) => {
    if (!confirm('Tem certeza que deseja desativar este pacote?')) return

    try {
      const response = await fetch(`/api/promotions/packages?id=${packageId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete package')
      
      toast.success('Pacote desativado com sucesso!')
      fetchPackages()

    } catch (error) {
      console.error('Error deleting package:', error)
      toast.error('Erro ao desativar pacote')
    }
  }

  const addFeature = () => {
    setFormData({
      ...formData,
      features: [...formData.features, '']
    })
  }

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features]
    newFeatures[index] = value
    setFormData({
      ...formData,
      features: newFeatures
    })
  }

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    })
  }

  const getTypeInfo = (type: string) => {
    return typeOptions.find(opt => opt.value === type) || typeOptions[0]
  }

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p>Acesso negado. Apenas administradores podem acessar esta página.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-gray-900 flex items-center gap-3">
            <Package className="h-8 w-8 text-green-600" />
            Gestão de Promoções
          </h1>
          <p className="text-gray-600 mt-1">
            Crie e gerencie pacotes, combos e assinaturas de promoção
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="packages" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Pacotes
          </TabsTrigger>
          <TabsTrigger value="combos" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Combos
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Assinaturas
          </TabsTrigger>
        </TabsList>

        {/* Packages Tab */}
        <TabsContent value="packages" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Pacotes Individuais</h2>
              <p className="text-gray-600">Gerencie pacotes de promoção individual</p>
            </div>
            <Button
              onClick={() => {
                setEditingPackage(null)
                setFormData({
                  name: '',
                  description: '',
                  type: 'profile_highlight',
                  duration_days: 7,
                  price: 0,
                  original_price: null,
                  features: [''],
                  is_featured: false,
                  sort_order: 0,
                  color: '#3B82F6',
                  icon: 'star'
                })
                setIsCreateModalOpen(true)
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Pacote
            </Button>
          </div>

      {/* Packages Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando pacotes...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const typeInfo = getTypeInfo(pkg.type)
            const TypeIcon = typeInfo.icon

            return (
              <Card key={pkg.id} className="relative overflow-hidden">
                <div 
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: pkg.color }}
                />
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-lg text-white"
                        style={{ backgroundColor: pkg.color }}
                      >
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                        <p className="text-sm text-gray-500">{typeInfo.label}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      {pkg.is_featured && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Star className="h-3 w-3 mr-1" />
                          Destaque
                        </Badge>
                      )}
                      <Badge className={pkg.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {pkg.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-gray-600 text-sm">{pkg.description}</p>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4 text-gray-500" />
                      <span className="font-bold text-xl">€{pkg.price}</span>
                      {pkg.original_price && (
                        <span className="text-gray-500 line-through">€{pkg.original_price}</span>
                      )}
                    </div>
                    <Badge variant="outline">
                      {pkg.duration_days} dias
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Funcionalidades:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {pkg.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Star className="h-3 w-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                      {pkg.features.length > 3 && (
                        <li className="text-gray-400 italic">
                          +{pkg.features.length - 3} funcionalidades
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(pkg)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(pkg.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
        </TabsContent>

        {/* Combos Tab */}
        <TabsContent value="combos" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Combos de Promoção</h2>
              <p className="text-gray-600">Gerencie combos com múltiplos tipos de promoção</p>
            </div>
            <Button
              onClick={() => {
                setEditingCombo(null)
                setComboFormData({
                  name: '',
                  description: '',
                  included_types: ['profile_highlight'],
                  profile_highlight_days: 7,
                  hero_banner_days: 0,
                  combo_package_days: 0,
                  regular_price: 0,
                  combo_price: 0,
                  badge_text: 'COMBO',
                  highlight_color: '#10B981',
                  features: [''],
                  is_featured: false,
                  sort_order: 0,
                  min_subscription_months: 1,
                  max_uses_per_user: undefined
                })
                setIsCreateComboModalOpen(true)
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Combo
            </Button>
          </div>

          {/* Combos Grid */}
          {loadingCombos ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando combos...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {combos.map((combo) => (
                <Card key={combo.id} className="relative overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 right-0 h-2"
                    style={{ backgroundColor: combo.highlight_color }}
                  />
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="p-3 rounded-lg text-white"
                          style={{ backgroundColor: combo.highlight_color }}
                        >
                          <Gift className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{combo.name}</CardTitle>
                          <p className="text-sm text-gray-500">
                            {combo.included_types.join(' + ')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          {combo.discount_percentage}% OFF
                        </Badge>
                        {combo.is_featured && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Destaque
                          </Badge>
                        )}
                        <Badge className={combo.is_active ? 'bg-green-100 text-green-800 text-xs' : 'bg-red-100 text-red-800 text-xs'}>
                          {combo.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-gray-600 text-sm">{combo.description}</p>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Euro className="h-4 w-4 text-gray-500" />
                        <span className="font-bold text-xl text-green-600">€{combo.combo_price}</span>
                        <span className="text-gray-500 line-through text-sm">€{combo.regular_price}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {combo.badge_text}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {combo.profile_highlight_days > 0 && (
                        <div className="flex items-center gap-1">
                          <Crown className="h-3 w-3 text-purple-500" />
                          <span>{combo.profile_highlight_days}d Destaque</span>
                        </div>
                      )}
                      {combo.hero_banner_days > 0 && (
                        <div className="flex items-center gap-1">
                          <Megaphone className="h-3 w-3 text-orange-500" />
                          <span>{combo.hero_banner_days}d Banner</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Funcionalidades:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {combo.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Star className="h-3 w-3 text-green-500" />
                            {feature}
                          </li>
                        ))}
                        {combo.features.length > 3 && (
                          <li className="text-gray-400 italic">
                            +{combo.features.length - 3} funcionalidades
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Implementar edição de combo
                          toast('Edição de combos será implementada')
                        }}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Implementar desativação de combo
                          toast('Desativação de combos será implementada')
                        }}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Assinaturas Ativas</h2>
              <p className="text-gray-600">Gerencie assinaturas de promoção dos usuários</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-sm">
                {subscriptions.filter(s => s.status === 'active').length} Ativas
              </Badge>
              <Badge variant="outline" className="text-sm">
                {subscriptions.filter(s => s.status === 'trial').length} Trial
              </Badge>
              <Badge variant="outline" className="text-sm">
                {subscriptions.filter(s => s.status === 'cancelled').length} Canceladas
              </Badge>
            </div>
          </div>

          {/* Subscriptions Table */}
          {loadingSubscriptions ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando assinaturas...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plano
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ciclo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Preço
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Próximo Ciclo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subscriptions.map((subscription) => (
                      <tr key={subscription.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {subscription.user_name || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {subscription.user_email || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {subscription.combo_name || subscription.package_name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            className={`text-xs ${
                              subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                              subscription.status === 'trial' ? 'bg-blue-100 text-blue-800' :
                              subscription.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {subscription.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subscription.billing_cycle}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          €{subscription.cycle_price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(subscription.current_period_end).toLocaleDateString('pt-PT')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              toast('Detalhes da assinatura será implementado')
                            }}
                          >
                            Ver Detalhes
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'Editar Pacote' : 'Criar Novo Pacote'}
            </DialogTitle>
            <DialogDescription>
              Configure as informações do pacote de promoção
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome do Pacote</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData({...formData, type: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Duração (dias)</Label>
                <Input
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({...formData, duration_days: parseInt(e.target.value)})}
                  min={1}
                  required
                />
              </div>
              <div>
                <Label>Preço (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                  min={0}
                  required
                />
              </div>
              <div>
                <Label>Preço Original (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.original_price || ''}
                  onChange={(e) => setFormData({...formData, original_price: e.target.value ? parseFloat(e.target.value) : null})}
                  min={0}
                />
              </div>
            </div>

            <div>
              <Label className="flex items-center justify-between">
                Funcionalidades
                <Button type="button" size="sm" onClick={addFeature}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </Label>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder="Ex: badge_destaque, analytics_basicas..."
                    />
                    {formData.features.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removeFeature(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Cor</Label>
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                />
              </div>
              <div>
                <Label>Ícone</Label>
                <Select 
                  value={formData.icon} 
                  onValueChange={(value) => setFormData({...formData, icon: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        {icon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value)})}
                  min={0}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData({...formData, is_featured: checked})}
              />
              <Label>Pacote em destaque</Label>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {editingPackage ? 'Atualizar' : 'Criar'} Pacote
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}