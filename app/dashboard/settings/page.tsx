"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { 
  Settings, 
  Store, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Mail, 
  Users, 
  Database,
  Save,
  RefreshCw,
  Upload,
  Download,
  CheckCircle,
  Info,
  Lock,
  Phone,
  DollarSign,
  TrendingUp,
  BarChart3,
  Target
} from "lucide-react"

export default function DashboardSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    // Store Information
    storeName: "Wilnara Tranças",
    storeDescription: "Marketplace especializado em tranças e cuidados capilares afro-brasileiros",
    storeEmail: "contato@wilnaratrancas.com",
    storePhone: "+351 900 000 000",
    storeAddress: "Rua das Tranças, 123, Lisboa",
    
    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    marketingEmails: false,
    
    // Security
    twoFactorAuth: false,
    sessionTimeout: "30",
    
    // Theme & Appearance
    theme: "light",
    language: "pt",
    timezone: "Europe/Lisbon",
    
    // Business Settings
    currency: "EUR",
    taxRate: "23",
    commissionRate: "5",
    minimumOrder: "25",
    
    // Privacy
    analyticsEnabled: true,
    dataCollection: true,
    cookieConsent: true,
  })

  const handleSave = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setLoading(false)
  }

  const handleReset = () => {
    // Reset to default values
    console.log("Resetting settings...")
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-slate-500 via-gray-600 to-zinc-700 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Settings className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold font-heading mb-2">
                  Configurações ⚙️
                </h1>
                <p className="text-white/90 text-lg">
                  Gerencie todas as configurações da plataforma
                </p>
                <p className="text-white/80 text-sm mt-1">
                  Personalize a experiência e funcionalidades
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">12</div>
              <div className="text-white/80 font-medium">Seções</div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">Ativo</div>
              <div className="text-white/80 text-sm">Status</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">v2.1.0</div>
              <div className="text-white/80 text-sm">Versão</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">99.9%</div>
              <div className="text-white/80 text-sm">Uptime</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">256</div>
              <div className="text-white/80 text-sm">Usuários</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Store Information */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
                <Store className="h-5 w-5" />
                Informações da Loja
              </CardTitle>
              <CardDescription>
                Configure as informações básicas da sua loja
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="storeName" className="text-sm font-semibold text-gray-900">
                    Nome da Loja
                  </Label>
                  <Input
                    id="storeName"
                    value={settings.storeName}
                    onChange={(e) => setSettings({...settings, storeName: e.target.value})}
                    className="h-11 bg-white border-gray-200 rounded-xl"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="storeEmail" className="text-sm font-semibold text-gray-900">
                    Email de Contato
                  </Label>
                  <Input
                    id="storeEmail"
                    type="email"
                    value={settings.storeEmail}
                    onChange={(e) => setSettings({...settings, storeEmail: e.target.value})}
                    className="h-11 bg-white border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeDescription" className="text-sm font-semibold text-gray-900">
                  Descrição da Loja
                </Label>
                <Textarea
                  id="storeDescription"
                  value={settings.storeDescription}
                  onChange={(e) => setSettings({...settings, storeDescription: e.target.value})}
                  rows={3}
                  className="bg-white border-gray-200 rounded-xl"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="storePhone" className="text-sm font-semibold text-gray-900">
                    Telefone
                  </Label>
                  <Input
                    id="storePhone"
                    value={settings.storePhone}
                    onChange={(e) => setSettings({...settings, storePhone: e.target.value})}
                    className="h-11 bg-white border-gray-200 rounded-xl"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="storeAddress" className="text-sm font-semibold text-gray-900">
                    Endereço
                  </Label>
                  <Input
                    id="storeAddress"
                    value={settings.storeAddress}
                    onChange={(e) => setSettings({...settings, storeAddress: e.target.value})}
                    className="h-11 bg-white border-gray-200 rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Settings */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Configurações Comerciais
              </CardTitle>
              <CardDescription>
                Configure taxas, comissões e políticas comerciais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-sm font-semibold text-gray-900">
                    Moeda
                  </Label>
                  <Select value={settings.currency} onValueChange={(value) => setSettings({...settings, currency: value})}>
                    <SelectTrigger className="h-11 bg-white border-gray-200 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="USD">Dólar ($)</SelectItem>
                      <SelectItem value="BRL">Real (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taxRate" className="text-sm font-semibold text-gray-900">
                    Taxa de Imposto (%)
                  </Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={settings.taxRate}
                    onChange={(e) => setSettings({...settings, taxRate: e.target.value})}
                    className="h-11 bg-white border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="commissionRate" className="text-sm font-semibold text-gray-900">
                    Comissão da Plataforma (%)
                  </Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    value={settings.commissionRate}
                    onChange={(e) => setSettings({...settings, commissionRate: e.target.value})}
                    className="h-11 bg-white border-gray-200 rounded-xl"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="minimumOrder" className="text-sm font-semibold text-gray-900">
                    Valor Mínimo do Pedido (€)
                  </Label>
                  <Input
                    id="minimumOrder"
                    type="number"
                    value={settings.minimumOrder}
                    onChange={(e) => setSettings({...settings, minimumOrder: e.target.value})}
                    className="h-11 bg-white border-gray-200 rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
              <CardDescription>
                Configure como e quando receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Notificações por Email</p>
                      <p className="text-sm text-gray-600">Receber alertas importantes por email</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Notificações por SMS</p>
                      <p className="text-sm text-gray-600">Receber alertas urgentes por SMS</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => setSettings({...settings, smsNotifications: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Notificações Push</p>
                      <p className="text-sm text-gray-600">Receber notificações no navegador</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => setSettings({...settings, pushNotifications: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Emails de Marketing</p>
                      <p className="text-sm text-gray-600">Receber ofertas e novidades</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.marketingEmails}
                    onCheckedChange={(checked) => setSettings({...settings, marketingEmails: checked})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance & Localization */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Aparência e Localização
              </CardTitle>
              <CardDescription>
                Personalize a aparência e configurações regionais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="theme" className="text-sm font-semibold text-gray-900">
                    Tema
                  </Label>
                  <Select value={settings.theme} onValueChange={(value) => setSettings({...settings, theme: value})}>
                    <SelectTrigger className="h-11 bg-white border-gray-200 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Escuro</SelectItem>
                      <SelectItem value="auto">Automático</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language" className="text-sm font-semibold text-gray-900">
                    Idioma
                  </Label>
                  <Select value={settings.language} onValueChange={(value) => setSettings({...settings, language: value})}>
                    <SelectTrigger className="h-11 bg-white border-gray-200 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt">Português</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="text-sm font-semibold text-gray-900">
                    Fuso Horário
                  </Label>
                  <Select value={settings.timezone} onValueChange={(value) => setSettings({...settings, timezone: value})}>
                    <SelectTrigger className="h-11 bg-white border-gray-200 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Lisbon">Lisboa (GMT+0)</SelectItem>
                      <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                      <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Security */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-red-600" />
                  <span className="font-semibold text-gray-900">2FA</span>
                </div>
                <Switch
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => setSettings({...settings, twoFactorAuth: checked})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout" className="text-sm font-semibold text-gray-900">
                  Timeout da Sessão (min)
                </Label>
                <Select value={settings.sessionTimeout} onValueChange={(value) => setSettings({...settings, sessionTimeout: value})}>
                  <SelectTrigger className="h-11 bg-white border-gray-200 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="240">4 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Analytics */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
                <Database className="h-5 w-5" />
                Privacidade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-gray-900">Analytics</span>
                </div>
                <Switch
                  checked={settings.analyticsEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, analyticsEnabled: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-gray-900">Coleta de Dados</span>
                </div>
                <Switch
                  checked={settings.dataCollection}
                  onCheckedChange={(checked) => setSettings({...settings, dataCollection: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-purple-600" />
                  <span className="font-semibold text-gray-900">Cookies</span>
                </div>
                <Switch
                  checked={settings.cookieConsent}
                  onCheckedChange={(checked) => setSettings({...settings, cookieConsent: checked})}
                />
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Status do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-gray-900">API</span>
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  Online
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-gray-900">Database</span>
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  Online
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-gray-900">CDN</span>
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  Online
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-bold font-heading text-gray-900">
                Ações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl h-12 font-semibold"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Configurações
              </Button>
              
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full rounded-xl h-12 font-semibold"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Restaurar Padrões
              </Button>
              
              <Separator />
              
              <Button
                variant="outline"
                className="w-full rounded-xl"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Configurações
              </Button>
              
              <Button
                variant="outline"
                className="w-full rounded-xl"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar Configurações
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
