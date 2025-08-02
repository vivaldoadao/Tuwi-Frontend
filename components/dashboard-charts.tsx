"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import { TrendingUp, Users, ShoppingCart, Euro } from "lucide-react"
import type { DashboardStats } from "@/lib/data-supabase"

interface DashboardChartsProps {
  stats: DashboardStats
  loading?: boolean
}

export function DashboardCharts({ stats, loading }: DashboardChartsProps) {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-xl"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Revenue and User Growth - Large Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by Month */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <Euro className="h-5 w-5 text-brand-primary" />
              Receita por Mês
            </CardTitle>
            <CardDescription>Evolução das vendas nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenueByMonth}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A0522D" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#A0522D" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#666"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#666"
                    fontSize={12}
                    tickFormatter={(value) => `€${value}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`€${value.toFixed(2)}`, 'Receita']}
                    labelStyle={{ color: '#333' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ddd',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#A0522D" 
                    strokeWidth={3}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <Users className="h-5 w-5 text-brand-primary" />
              Crescimento de Usuários
            </CardTitle>
            <CardDescription>Novos registros por mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#666"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#666"
                    fontSize={12}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value}`, 'Usuários']}
                    labelStyle={{ color: '#333' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ddd',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#DAA520" 
                    strokeWidth={3}
                    dot={{ fill: '#DAA520', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, fill: '#DAA520' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution and Sales by Day */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Orders by Status - Pie Chart */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <ShoppingCart className="h-5 w-5 text-brand-primary" />
              Status dos Pedidos
            </CardTitle>
            <CardDescription>Distribuição por status atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.ordersByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                    label={(entry) => `${entry.status}: ${entry.count}`}
                    labelLine={false}
                  >
                    {stats.ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [`${value}`, 'Pedidos']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ddd',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sales by Day */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <TrendingUp className="h-5 w-5 text-brand-primary" />
              Vendas por Dia
            </CardTitle>
            <CardDescription>Últimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.salesByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="day" 
                    stroke="#666"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#666"
                    fontSize={12}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value}`, 'Vendas']}
                    labelStyle={{ color: '#333' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ddd',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="sales" 
                    fill="#5A2D2D"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <TrendingUp className="h-5 w-5 text-brand-primary" />
            Produtos Mais Vendidos
          </CardTitle>
          <CardDescription>Top 5 produtos por vendas e receita</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={stats.topProducts} 
                layout="horizontal"
                margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  type="number"
                  stroke="#666"
                  fontSize={12}
                />
                <YAxis 
                  type="category"
                  dataKey="name" 
                  stroke="#666"
                  fontSize={12}
                  width={90}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'sales' ? `${value} vendas` : `€${value}`, 
                    name === 'sales' ? 'Vendas' : 'Receita'
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="sales" fill="#DAA520" name="sales" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}