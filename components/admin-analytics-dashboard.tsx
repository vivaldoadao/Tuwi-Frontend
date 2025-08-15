"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  MessageCircle,
  ShoppingCart,
  DollarSign,
  Target,
  Calendar,
  RefreshCw,
  Download,
  Filter
} from "lucide-react"
import { useAnalyticsTracker, type PromotionAnalyticsReport } from "@/lib/analytics-tracker"

interface AnalyticsDashboardProps {
  className?: string
}

export function AdminAnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [promotionsReport, setPromotionsReport] = useState<PromotionAnalyticsReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")
  const [selectedMetric, setSelectedMetric] = useState("views")
  
  const { generatePromotionAnalyticsReport, getDashboardMetrics } = useAnalyticsTracker()

  // Carregar dados iniciais
  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      
      const now = new Date()
      let fromDate: string
      
      switch (timeRange) {
        case "7d":
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
          break
        case "30d":
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
          break
        case "90d":
          fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
          break
        default:
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }
      
      const report = await generatePromotionAnalyticsReport(fromDate, now.toISOString())
      setPromotionsReport(report)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Dados para gráficos
  const getChartData = () => {
    if (!promotionsReport) return []
    
    return promotionsReport.top_performing.slice(0, 8).map((promo, index) => ({
      name: promo.title.length > 20 ? promo.title.substring(0, 20) + "..." : promo.title,
      views: promo.metrics.views_count,
      clicks: promo.metrics.clicks_count,
      contacts: promo.metrics.contacts_count,
      conversions: promo.metrics.conversions_count,
      ctr: promo.metrics.ctr,
      cvr: promo.metrics.cvr,
      roi: promo.metrics.roi,
      revenue: promo.metrics.revenue_generated
    }))
  }

  const pieData = promotionsReport ? [
    { name: "Profile Highlight", value: promotionsReport.top_performing.filter(p => p.type === 'profile_highlight').length, color: "#8B5CF6" },
    { name: "Hero Banner", value: promotionsReport.top_performing.filter(p => p.type === 'hero_banner').length, color: "#EC4899" },
    { name: "Combo Package", value: promotionsReport.top_performing.filter(p => p.type === 'combo_package').length, color: "#06B6D4" }
  ] : []

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-PT').format(value)
  }

  const getChangeIndicator = (current: number, isPositive = true) => {
    if (isPositive) {
      return <TrendingUp className="h-4 w-4 text-green-500" />
    } else {
      return <TrendingDown className="h-4 w-4 text-red-500" />
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics de Promoções</h1>
          <p className="text-muted-foreground">
            Métricas detalhadas do sistema de destaque e promoções
          </p>
        </div>
        
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={loadAnalyticsData} disabled={loading} size="icon" variant="outline">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Métricas Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {promotionsReport ? formatNumber(promotionsReport.total_views) : '0'}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getChangeIndicator(promotionsReport?.total_views || 0)}
              <span className="ml-1">+12% vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cliques</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {promotionsReport ? formatNumber(promotionsReport.total_clicks) : '0'}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getChangeIndicator(promotionsReport?.total_clicks || 0)}
              <span className="ml-1">CTR: {promotionsReport?.average_ctr || 0}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversões</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {promotionsReport ? formatNumber(promotionsReport.total_conversions) : '0'}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getChangeIndicator(promotionsReport?.total_conversions || 0)}
              <span className="ml-1">CVR: {promotionsReport?.average_cvr || 0}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {promotionsReport?.overall_roi || 0}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getChangeIndicator(promotionsReport?.overall_roi || 0, (promotionsReport?.overall_roi || 0) > 0)}
              <span className="ml-1">
                Receita: {formatCurrency(promotionsReport?.total_revenue || 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para diferentes visualizações */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="types">Tipos de Promoção</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="top-performing">Top Promoções</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance das Promoções</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(Number(value)) : formatNumber(Number(value)),
                      name
                    ]} />
                    <Legend />
                    <Bar dataKey="views" name="Views" fill="#8B5CF6" />
                    <Bar dataKey="clicks" name="Cliques" fill="#EC4899" />
                    <Bar dataKey="conversions" name="Conversões" fill="#06B6D4" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pieData.map((type, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }}></div>
                        <span className="font-medium">{type.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{type.value} ativas</div>
                        <div className="text-sm text-muted-foreground">
                          {((type.value / (promotionsReport?.active_promotions || 1)) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendência de ROI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`, 'ROI']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="roi" 
                      stroke="#8B5CF6" 
                      strokeWidth={2}
                      name="ROI (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-performing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Promoções</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {promotionsReport?.top_performing.slice(0, 10).map((promo, index) => (
                  <div key={promo.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{promo.title}</div>
                        <div className="text-sm text-muted-foreground">
                          <Badge variant="outline">{promo.type}</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-sm font-medium">{formatNumber(promo.metrics.views_count)}</div>
                        <div className="text-xs text-muted-foreground">Views</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">{promo.metrics.ctr}%</div>
                        <div className="text-xs text-muted-foreground">CTR</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">{promo.metrics.cvr}%</div>
                        <div className="text-xs text-muted-foreground">CVR</div>
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${(promo.metrics?.roi ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {promo.metrics?.roi ?? 0}%
                        </div>
                        <div className="text-xs text-muted-foreground">ROI</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}