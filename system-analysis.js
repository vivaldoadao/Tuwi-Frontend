#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 ANÁLISE PROFUNDA DO SISTEMA WILNARA TRANÇAS')
console.log('='.repeat(60))

async function analyzeDatabase() {
  console.log('\n📊 1. ANÁLISE DO BANCO DE DADOS')
  console.log('-'.repeat(40))
  
  const tables = [
    'users', 'braiders', 'services', 'bookings', 'products', 'orders',
    'ratings', 'braider_rating_stats', 'rating_reports', 'messages',
    'conversations', 'user_presence', 'braider_availability'
  ]
  
  const analysis = {
    tablesStatus: {},
    totalRecords: {},
    criticalIssues: [],
    recommendations: []
  }
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        analysis.tablesStatus[table] = '❌ ERRO'
        analysis.criticalIssues.push(`Tabela ${table}: ${error.message}`)
      } else {
        analysis.tablesStatus[table] = '✅ OK'
        analysis.totalRecords[table] = count || 0
      }
    } catch (err) {
      analysis.tablesStatus[table] = '❌ ERRO'
      analysis.criticalIssues.push(`Tabela ${table}: ${err.message}`)
    }
  }
  
  // Print results
  console.log('\n📋 Status das Tabelas:')
  Object.entries(analysis.tablesStatus).forEach(([table, status]) => {
    const count = analysis.totalRecords[table] || 0
    console.log(`   ${status} ${table.padEnd(20)} (${count} registros)`)
  })
  
  return analysis
}

async function analyzeUsers() {
  console.log('\n👥 2. ANÁLISE DE USUÁRIOS')
  console.log('-'.repeat(40))
  
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('role, "isActive", "createdAt"')
    
    if (error) {
      console.log('❌ Erro ao analisar usuários:', error.message)
      return
    }
    
    const userStats = {
      total: users.length,
      admin: users.filter(u => u.role === 'admin').length,
      braider: users.filter(u => u.role === 'braider').length,
      customer: users.filter(u => u.role === 'customer').length,
      active: users.filter(u => u.isActive).length,
      inactive: users.filter(u => !u.isActive).length,
      recent: users.filter(u => {
        const created = new Date(u.createdAt)
        const week = new Date()
        week.setDate(week.getDate() - 7)
        return created > week
      }).length
    }
    
    console.log('📊 Estatísticas de Usuários:')
    console.log(`   Total: ${userStats.total}`)
    console.log(`   👑 Admins: ${userStats.admin}`)
    console.log(`   💇‍♀️ Trancistas: ${userStats.braider}`)
    console.log(`   👤 Clientes: ${userStats.customer}`)
    console.log(`   ✅ Ativos: ${userStats.active}`)
    console.log(`   ❌ Inativos: ${userStats.inactive}`)
    console.log(`   🆕 Últimos 7 dias: ${userStats.recent}`)
    
    return userStats
  } catch (error) {
    console.log('❌ Erro inesperado:', error.message)
  }
}

async function analyzeBraiders() {
  console.log('\n💇‍♀️ 3. ANÁLISE DE TRANCISTAS')
  console.log('-'.repeat(40))
  
  try {
    const { data: braiders, error } = await supabase
      .from('braiders')
      .select('status, user_name, location, average_rating, total_reviews, created_at')
    
    if (error) {
      console.log('❌ Erro ao analisar trancistas:', error.message)
      return
    }
    
    const braiderStats = {
      total: braiders.length,
      approved: braiders.filter(b => b.status === 'approved').length,
      pending: braiders.filter(b => b.status === 'pending').length,
      rejected: braiders.filter(b => b.status === 'rejected').length,
      withRatings: braiders.filter(b => b.total_reviews > 0).length,
      avgRating: braiders.reduce((sum, b) => sum + (b.average_rating || 0), 0) / braiders.length,
      withLocation: braiders.filter(b => b.location).length
    }
    
    console.log('📊 Estatísticas de Trancistas:')
    console.log(`   Total: ${braiderStats.total}`)
    console.log(`   ✅ Aprovadas: ${braiderStats.approved}`)
    console.log(`   ⏳ Pendentes: ${braiderStats.pending}`)
    console.log(`   ❌ Rejeitadas: ${braiderStats.rejected}`)
    console.log(`   ⭐ Com avaliações: ${braiderStats.withRatings}`)
    console.log(`   📍 Com localização: ${braiderStats.withLocation}`)
    console.log(`   🎯 Rating médio: ${braiderStats.avgRating.toFixed(2)}`)
    
    return braiderStats
  } catch (error) {
    console.log('❌ Erro inesperado:', error.message)
  }
}

async function analyzeBookings() {
  console.log('\n📅 4. ANÁLISE DE AGENDAMENTOS')
  console.log('-'.repeat(40))
  
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('status, service_type, total_amount, booking_date, created_at')
    
    if (error) {
      console.log('❌ Erro ao analisar agendamentos:', error.message)
      return
    }
    
    const bookingStats = {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      domicilio: bookings.filter(b => b.service_type === 'domicilio').length,
      trancista: bookings.filter(b => b.service_type === 'trancista').length,
      totalRevenue: bookings.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0),
      thisMonth: bookings.filter(b => {
        const created = new Date(b.created_at)
        const thisMonth = new Date()
        return created.getMonth() === thisMonth.getMonth() && created.getFullYear() === thisMonth.getFullYear()
      }).length
    }
    
    console.log('📊 Estatísticas de Agendamentos:')
    console.log(`   Total: ${bookingStats.total}`)
    console.log(`   ⏳ Pendentes: ${bookingStats.pending}`)
    console.log(`   ✅ Confirmados: ${bookingStats.confirmed}`)
    console.log(`   🎉 Completados: ${bookingStats.completed}`)
    console.log(`   ❌ Cancelados: ${bookingStats.cancelled}`)
    console.log(`   🏠 Domicílio: ${bookingStats.domicilio}`)
    console.log(`   🏪 Estúdio: ${bookingStats.trancista}`)
    console.log(`   💰 Receita total: €${bookingStats.totalRevenue.toFixed(2)}`)
    console.log(`   📆 Este mês: ${bookingStats.thisMonth}`)
    
    return bookingStats
  } catch (error) {
    console.log('❌ Erro inesperado:', error.message)
  }
}

async function analyzeProducts() {
  console.log('\n🛍️ 5. ANÁLISE DE PRODUTOS')
  console.log('-'.repeat(40))
  
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('name, price, stock_quantity, is_active, category')
    
    if (error) {
      console.log('❌ Erro ao analisar produtos:', error.message)
      return
    }
    
    const productStats = {
      total: products.length,
      active: products.filter(p => p.is_active).length,
      inactive: products.filter(p => !p.is_active).length,
      inStock: products.filter(p => p.stock_quantity > 0).length,
      outOfStock: products.filter(p => p.stock_quantity <= 0).length,
      lowStock: products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length,
      avgPrice: products.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0) / products.length,
      totalValue: products.reduce((sum, p) => sum + ((parseFloat(p.price) || 0) * (p.stock_quantity || 0)), 0)
    }
    
    console.log('📊 Estatísticas de Produtos:')
    console.log(`   Total: ${productStats.total}`)
    console.log(`   ✅ Ativos: ${productStats.active}`)
    console.log(`   ❌ Inativos: ${productStats.inactive}`)
    console.log(`   📦 Em estoque: ${productStats.inStock}`)
    console.log(`   🚫 Sem estoque: ${productStats.outOfStock}`)
    console.log(`   ⚠️ Estoque baixo: ${productStats.lowStock}`)
    console.log(`   💰 Preço médio: €${productStats.avgPrice.toFixed(2)}`)
    console.log(`   💎 Valor total: €${productStats.totalValue.toFixed(2)}`)
    
    return productStats
  } catch (error) {
    console.log('❌ Erro inesperado:', error.message)
  }
}

async function analyzeOrders() {
  console.log('\n🛒 6. ANÁLISE DE PEDIDOS')
  console.log('-'.repeat(40))
  
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('status, total_amount, payment_status, created_at')
    
    if (error) {
      console.log('❌ Erro ao analisar pedidos:', error.message)
      return
    }
    
    const orderStats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      paidOrders: orders.filter(o => o.payment_status === 'completed').length,
      totalRevenue: orders.filter(o => o.payment_status === 'completed').reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0),
      thisMonth: orders.filter(o => {
        const created = new Date(o.created_at)
        const thisMonth = new Date()
        return created.getMonth() === thisMonth.getMonth() && created.getFullYear() === thisMonth.getFullYear()
      }).length
    }
    
    console.log('📊 Estatísticas de Pedidos:')
    console.log(`   Total: ${orderStats.total}`)
    console.log(`   ⏳ Pendentes: ${orderStats.pending}`)
    console.log(`   🔄 Processando: ${orderStats.processing}`)
    console.log(`   🚚 Enviados: ${orderStats.shipped}`)
    console.log(`   ✅ Entregues: ${orderStats.delivered}`)
    console.log(`   ❌ Cancelados: ${orderStats.cancelled}`)
    console.log(`   💳 Pagos: ${orderStats.paidOrders}`)
    console.log(`   💰 Receita: €${orderStats.totalRevenue.toFixed(2)}`)
    console.log(`   📆 Este mês: ${orderStats.thisMonth}`)
    
    return orderStats
  } catch (error) {
    console.log('❌ Erro inesperado:', error.message)
  }
}

async function analyzeRatings() {
  console.log('\n⭐ 7. ANÁLISE DO SISTEMA DE AVALIAÇÕES')
  console.log('-'.repeat(40))
  
  try {
    const { data: ratings, error } = await supabase
      .from('ratings')
      .select('overall_rating, status, created_at, braider_id')
    
    if (error) {
      console.log('❌ Erro ao analisar avaliações:', error.message)
      return
    }
    
    const ratingStats = {
      total: ratings.length,
      active: ratings.filter(r => r.status === 'active').length,
      hidden: ratings.filter(r => r.status === 'hidden').length,
      flagged: ratings.filter(r => r.status === 'flagged').length,
      avgRating: ratings.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / ratings.length,
      rating5: ratings.filter(r => r.overall_rating === 5).length,
      rating4: ratings.filter(r => r.overall_rating === 4).length,
      rating3: ratings.filter(r => r.overall_rating === 3).length,
      rating2: ratings.filter(r => r.overall_rating === 2).length,
      rating1: ratings.filter(r => r.overall_rating === 1).length,
      uniqueBraiders: new Set(ratings.map(r => r.braider_id)).size
    }
    
    console.log('📊 Estatísticas de Avaliações:')
    console.log(`   Total: ${ratingStats.total}`)
    console.log(`   ✅ Ativas: ${ratingStats.active}`)
    console.log(`   👁️ Ocultas: ${ratingStats.hidden}`)
    console.log(`   🚩 Reportadas: ${ratingStats.flagged}`)
    console.log(`   🎯 Média geral: ${ratingStats.avgRating.toFixed(2)}`)
    console.log(`   ⭐⭐⭐⭐⭐ 5 estrelas: ${ratingStats.rating5}`)
    console.log(`   ⭐⭐⭐⭐ 4 estrelas: ${ratingStats.rating4}`)
    console.log(`   ⭐⭐⭐ 3 estrelas: ${ratingStats.rating3}`)
    console.log(`   ⭐⭐ 2 estrelas: ${ratingStats.rating2}`)
    console.log(`   ⭐ 1 estrela: ${ratingStats.rating1}`)
    console.log(`   👥 Trancistas avaliadas: ${ratingStats.uniqueBraiders}`)
    
    return ratingStats
  } catch (error) {
    console.log('❌ Erro inesperado:', error.message)
  }
}

async function analyzeSystemHealth() {
  console.log('\n🏥 8. SAÚDE DO SISTEMA')
  console.log('-'.repeat(40))
  
  const healthChecks = {
    database: '🔄 Verificando...',
    authentication: '🔄 Verificando...',
    rls: '🔄 Verificando...',
    functions: '🔄 Verificando...',
    storage: '🔄 Verificando...'
  }
  
  // Database connectivity
  try {
    await supabase.from('users').select('id').limit(1)
    healthChecks.database = '✅ OK'
  } catch (error) {
    healthChecks.database = '❌ ERRO'
  }
  
  // RLS policies
  try {
    const { data, error } = await supabase.auth.getUser()
    if (!error) {
      healthChecks.authentication = '✅ OK'
    } else {
      healthChecks.authentication = '⚠️ Sem autenticação'
    }
  } catch (error) {
    healthChecks.authentication = '❌ ERRO'
  }
  
  // Functions
  try {
    await supabase.rpc('get_braider_with_stats', { braider_uuid: '00000000-0000-0000-0000-000000000000' })
    healthChecks.functions = '✅ OK'
  } catch (error) {
    healthChecks.functions = '❌ ERRO'
  }
  
  console.log('🏥 Verificações de Saúde:')
  Object.entries(healthChecks).forEach(([check, status]) => {
    console.log(`   ${status} ${check.charAt(0).toUpperCase() + check.slice(1)}`)
  })
  
  return healthChecks
}

function analyzeCodebase() {
  console.log('\n💻 9. ANÁLISE DO CÓDIGO')
  console.log('-'.repeat(40))
  
  const analysis = {
    components: 0,
    pages: 0,
    apiRoutes: 0,
    utils: 0,
    types: 0
  }
  
  // Count components
  if (fs.existsSync('./components')) {
    analysis.components = fs.readdirSync('./components').filter(f => f.endsWith('.tsx')).length
  }
  
  // Count pages
  if (fs.existsSync('./app')) {
    const countPages = (dir) => {
      let count = 0
      const items = fs.readdirSync(dir)
      for (const item of items) {
        const fullPath = path.join(dir, item)
        if (fs.statSync(fullPath).isDirectory()) {
          count += countPages(fullPath)
        } else if (item === 'page.tsx' || item === 'page.ts') {
          count++
        }
      }
      return count
    }
    analysis.pages = countPages('./app')
  }
  
  // Count API routes
  if (fs.existsSync('./app/api')) {
    const countRoutes = (dir) => {
      let count = 0
      const items = fs.readdirSync(dir)
      for (const item of items) {
        const fullPath = path.join(dir, item)
        if (fs.statSync(fullPath).isDirectory()) {
          count += countRoutes(fullPath)
        } else if (item === 'route.ts' || item === 'route.tsx') {
          count++
        }
      }
      return count
    }
    analysis.apiRoutes = countRoutes('./app/api')
  }
  
  // Count utils
  if (fs.existsSync('./lib')) {
    analysis.utils = fs.readdirSync('./lib').filter(f => f.endsWith('.ts') || f.endsWith('.tsx')).length
  }
  
  console.log('📊 Estatísticas do Código:')
  console.log(`   🧩 Componentes: ${analysis.components}`)
  console.log(`   📄 Páginas: ${analysis.pages}`)
  console.log(`   🛠️ Rotas API: ${analysis.apiRoutes}`)
  console.log(`   📚 Utilitários: ${analysis.utils}`)
  
  return analysis
}

function generateRecommendations(dbAnalysis, userStats, braiderStats, bookingStats, productStats, orderStats, ratingStats) {
  console.log('\n💡 10. RECOMENDAÇÕES')
  console.log('-'.repeat(40))
  
  const recommendations = []
  
  // Database recommendations
  if (dbAnalysis.criticalIssues.length > 0) {
    recommendations.push('🔥 CRÍTICO: Resolver problemas de banco de dados')
  }
  
  // User recommendations
  if (userStats && userStats.admin === 0) {
    recommendations.push('👑 Criar pelo menos um usuário administrador')
  }
  
  // Braider recommendations
  if (braiderStats && braiderStats.approved === 0) {
    recommendations.push('💇‍♀️ Aprovar trancistas para tornar a plataforma funcional')
  }
  
  if (braiderStats && braiderStats.withRatings < braiderStats.approved * 0.5) {
    recommendations.push('⭐ Incentivar avaliações para melhorar credibilidade')
  }
  
  // Product recommendations
  if (productStats && productStats.lowStock > productStats.total * 0.3) {
    recommendations.push('📦 Reabastecer produtos com estoque baixo')
  }
  
  // Order recommendations
  if (orderStats && orderStats.pending > orderStats.total * 0.2) {
    recommendations.push('🛒 Processar pedidos pendentes')
  }
  
  // Rating recommendations
  if (ratingStats && ratingStats.total < 10) {
    recommendations.push('⭐ Implementar campanha para coletar mais avaliações')
  }
  
  // General recommendations
  recommendations.push('🔄 Implementar backup automático do banco de dados')
  recommendations.push('📊 Configurar monitoramento de performance')
  recommendations.push('🛡️ Auditar políticas de segurança RLS')
  recommendations.push('📱 Testar responsividade em dispositivos móveis')
  
  console.log('📋 Lista de Recomendações:')
  recommendations.forEach((rec, index) => {
    console.log(`   ${index + 1}. ${rec}`)
  })
  
  return recommendations
}

async function main() {
  try {
    const dbAnalysis = await analyzeDatabase()
    const userStats = await analyzeUsers()
    const braiderStats = await analyzeBraiders()
    const bookingStats = await analyzeBookings()
    const productStats = await analyzeProducts()
    const orderStats = await analyzeOrders()
    const ratingStats = await analyzeRatings()
    const healthChecks = await analyzeSystemHealth()
    const codeAnalysis = analyzeCodebase()
    const recommendations = generateRecommendations(dbAnalysis, userStats, braiderStats, bookingStats, productStats, orderStats, ratingStats)
    
    console.log('\n🎯 RESUMO EXECUTIVO')
    console.log('='.repeat(60))
    console.log(`📊 Total de tabelas analisadas: ${Object.keys(dbAnalysis.tablesStatus).length}`)
    console.log(`👥 Total de usuários: ${userStats?.total || 0}`)
    console.log(`💇‍♀️ Total de trancistas: ${braiderStats?.total || 0}`)
    console.log(`📅 Total de agendamentos: ${bookingStats?.total || 0}`)
    console.log(`🛍️ Total de produtos: ${productStats?.total || 0}`)
    console.log(`🛒 Total de pedidos: ${orderStats?.total || 0}`)
    console.log(`⭐ Total de avaliações: ${ratingStats?.total || 0}`)
    console.log(`💻 Total de componentes: ${codeAnalysis.components}`)
    console.log(`🛠️ Total de rotas API: ${codeAnalysis.apiRoutes}`)
    console.log(`💡 Total de recomendações: ${recommendations.length}`)
    
    if (dbAnalysis.criticalIssues.length > 0) {
      console.log('\n🚨 PROBLEMAS CRÍTICOS:')
      dbAnalysis.criticalIssues.forEach(issue => console.log(`   ❌ ${issue}`))
    } else {
      console.log('\n✅ Nenhum problema crítico detectado!')
    }
    
    console.log('\n🏁 Análise concluída!')
    
  } catch (error) {
    console.error('💥 Erro durante a análise:', error)
  }
}

// Execute if called directly
if (require.main === module) {
  main().then(() => {
    process.exit(0)
  })
}

module.exports = main