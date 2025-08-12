/**
 * SISTEMA DE ANALYTICS - Tracking automático de métricas
 * 
 * Este módulo coleta métricas desde o primeiro dia, incluindo:
 * - Métricas de agendamentos e monetização
 * - Métricas de promoções e sistema de destaque
 * - Analytics avançados com ROI e conversões
 */

import { createClient } from '@/lib/supabase/client'
import { createServerClient } from '@supabase/ssr'

// Types para Analytics Básicos
interface BookingMetrics {
  braiderId: string
  totalBookings: number
  completedBookings: number 
  cancelledBookings: number
  totalRevenue: number
  potentialCommission: number
  averageBookingValue: number
}

// Types para Analytics de Promoções
interface PromotionMetrics {
  promotion_id: string
  views_count: number
  clicks_count: number
  contacts_count: number
  conversions_count: number
  ctr: number // Click-through rate
  cvr: number // Conversion rate
  cost_per_click?: number
  cost_per_conversion?: number
  revenue_generated?: number
  roi?: number // Return on investment
}

interface AnalyticsEvent {
  type: 'booking_created' | 'booking_completed' | 'booking_cancelled' | 'profile_view' | 'contact_attempt' | 
        'promotion_view' | 'promotion_click' | 'promotion_contact' | 'promotion_conversion'
  braiderId: string
  bookingId?: string
  promotionId?: string
  value?: number
  metadata?: Record<string, any>
}

interface PromotionAnalyticsReport {
  total_promotions: number
  active_promotions: number
  total_views: number
  total_clicks: number
  total_contacts: number
  total_conversions: number
  average_ctr: number
  average_cvr: number
  total_revenue: number
  total_investment: number
  overall_roi: number
  top_performing: Array<{
    id: string
    title: string
    type: string
    metrics: PromotionMetrics
  }>
}

class AnalyticsTracker {
  private supabase = createClient()

  /**
   * Rastrear evento de analytics
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      console.log('📊 Tracking analytics event:', event.type, event)

      switch (event.type) {
        case 'booking_created':
          await this.handleBookingCreated(event)
          break
        case 'booking_completed':
          await this.handleBookingCompleted(event)
          break  
        case 'booking_cancelled':
          await this.handleBookingCancelled(event)
          break
        case 'profile_view':
          await this.handleProfileView(event)
          break
        case 'contact_attempt':
          await this.handleContactAttempt(event)
          break
        case 'promotion_view':
          await this.handlePromotionView(event)
          break
        case 'promotion_click':
          await this.handlePromotionClick(event)
          break
        case 'promotion_contact':
          await this.handlePromotionContact(event)
          break
        case 'promotion_conversion':
          await this.handlePromotionConversion(event)
          break
      }

      // Atualizar métricas mensais
      await this.updateMonthlyMetrics(event.braiderId)
      
    } catch (error) {
      console.error('❌ Error tracking analytics event:', error)
      // Não falhar a operação principal se analytics falhar
    }
  }

  /**
   * Processar booking criado
   */
  private async handleBookingCreated(event: AnalyticsEvent): Promise<void> {
    if (!event.bookingId || !event.value) return

    // Criar transação simulada para cálculo de comissão
    const commissionRate = await this.getCommissionRate()
    const commissionAmount = event.value * commissionRate
    const braiderPayout = event.value - commissionAmount

    const { error } = await this.supabase
      .from('platform_transactions')
      .insert([{
        braider_id: event.braiderId,
        booking_id: event.bookingId,
        service_amount: event.value,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        braider_payout: braiderPayout,
        is_simulated: true,
        status: 'simulated'
      }])

    if (error) {
      console.error('Error creating simulated transaction:', error)
    }
  }

  /**
   * Processar booking completado
   */
  private async handleBookingCompleted(event: AnalyticsEvent): Promise<void> {
    // Atualizar status da transação se existir
    if (event.bookingId) {
      await this.supabase
        .from('platform_transactions')
        .update({ status: 'completed' })
        .eq('booking_id', event.bookingId)
    }
  }

  /**
   * Processar booking cancelado
   */
  private async handleBookingCancelled(event: AnalyticsEvent): Promise<void> {
    // Atualizar status da transação se existir
    if (event.bookingId) {
      await this.supabase
        .from('platform_transactions')
        .update({ status: 'failed' })
        .eq('booking_id', event.bookingId)
    }
  }

  /**
   * Processar visualização de perfil
   */
  private async handleProfileView(event: AnalyticsEvent): Promise<void> {
    // Incrementar contador de views para o mês atual
    const currentMonth = this.getCurrentMonthStart()
    
    const { error } = await this.supabase.rpc('increment_profile_views', {
      braider_uuid: event.braiderId,
      month_date: currentMonth
    })

    if (error) {
      console.error('Error incrementing profile views:', error)
    }
  }

  /**
   * Processar tentativa de contato
   */
  private async handleContactAttempt(event: AnalyticsEvent): Promise<void> {
    // Incrementar contador de tentativas de contato
    const currentMonth = this.getCurrentMonthStart()
    
    const { error } = await this.supabase.rpc('increment_contact_attempts', {
      braider_uuid: event.braiderId,
      month_date: currentMonth
    })

    if (error) {
      console.error('Error incrementing contact attempts:', error)
    }
  }

  /**
   * Processar visualização de promoção
   */
  private async handlePromotionView(event: AnalyticsEvent): Promise<void> {
    if (!event.promotionId) return

    try {
      // Incrementar contador de visualizações
      const { error } = await this.supabase.rpc('increment_promotion_counter', {
        promotion_id: event.promotionId,
        field_name: 'views_count'
      })

      if (error) {
        console.error('Error incrementing promotion views:', error)
      }

      // Registrar evento detalhado
      await this.supabase.from('promotion_analytics').insert({
        promotion_id: event.promotionId,
        event_type: 'view',
        data: event.metadata || {},
        created_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error in handlePromotionView:', error)
    }
  }

  /**
   * Processar clique em promoção
   */
  private async handlePromotionClick(event: AnalyticsEvent): Promise<void> {
    if (!event.promotionId) return

    try {
      // Incrementar contador de cliques
      const { error } = await this.supabase.rpc('increment_promotion_counter', {
        promotion_id: event.promotionId,
        field_name: 'clicks_count'
      })

      if (error) {
        console.error('Error incrementing promotion clicks:', error)
      }

      // Registrar evento detalhado
      await this.supabase.from('promotion_analytics').insert({
        promotion_id: event.promotionId,
        event_type: 'click',
        data: event.metadata || {},
        created_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error in handlePromotionClick:', error)
    }
  }

  /**
   * Processar contato via promoção
   */
  private async handlePromotionContact(event: AnalyticsEvent): Promise<void> {
    if (!event.promotionId) return

    try {
      // Incrementar contador de contatos
      const { error } = await this.supabase.rpc('increment_promotion_counter', {
        promotion_id: event.promotionId,
        field_name: 'contacts_count'
      })

      if (error) {
        console.error('Error incrementing promotion contacts:', error)
      }

      // Registrar evento detalhado
      await this.supabase.from('promotion_analytics').insert({
        promotion_id: event.promotionId,
        event_type: 'contact',
        data: event.metadata || {},
        created_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error in handlePromotionContact:', error)
    }
  }

  /**
   * Processar conversão de promoção
   */
  private async handlePromotionConversion(event: AnalyticsEvent): Promise<void> {
    if (!event.promotionId) return

    try {
      // Incrementar contador de conversões
      const { error } = await this.supabase.rpc('increment_promotion_counter', {
        promotion_id: event.promotionId,
        field_name: 'conversions_count'
      })

      if (error) {
        console.error('Error incrementing promotion conversions:', error)
      }

      // Atualizar receita gerada se fornecida
      if (event.value && event.value > 0) {
        await this.supabase.rpc('increment_promotion_revenue', {
          promotion_id: event.promotionId,
          revenue_amount: event.value
        })
      }

      // Registrar evento detalhado
      await this.supabase.from('promotion_analytics').insert({
        promotion_id: event.promotionId,
        event_type: 'conversion',
        data: { 
          value: event.value,
          ...event.metadata 
        },
        created_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error in handlePromotionConversion:', error)
    }
  }

  /**
   * Atualizar métricas mensais de um braider
   */
  private async updateMonthlyMetrics(braiderId: string): Promise<void> {
    try {
      const { error } = await this.supabase.rpc('update_braider_monthly_metrics', {
        braider_uuid: braiderId,
        target_month: this.getCurrentMonthStart()
      })

      if (error) {
        console.error('Error updating monthly metrics:', error)
      }
    } catch (error) {
      console.error('Error in updateMonthlyMetrics:', error)
    }
  }

  /**
   * Obter métricas de um braider para um mês específico
   */
  async getBraiderMetrics(braiderId: string, monthYear?: string): Promise<BookingMetrics | null> {
    try {
      const targetMonth = monthYear || this.getCurrentMonthStart()

      const { data, error } = await this.supabase
        .from('braider_metrics')
        .select('*')
        .eq('braider_id', braiderId)
        .eq('month_year', targetMonth)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching braider metrics:', error)
        return null
      }

      if (!data) {
        // Retornar métricas vazias se não existir registro
        return {
          braiderId,
          totalBookings: 0,
          completedBookings: 0,
          cancelledBookings: 0,
          totalRevenue: 0,
          potentialCommission: 0,
          averageBookingValue: 0
        }
      }

      return {
        braiderId: data.braider_id,
        totalBookings: data.total_bookings || 0,
        completedBookings: data.completed_bookings || 0,
        cancelledBookings: data.cancelled_bookings || 0,
        totalRevenue: parseFloat(data.total_revenue || '0'),
        potentialCommission: parseFloat(data.potential_commission || '0'),
        averageBookingValue: parseFloat(data.average_booking_value || '0')
      }
    } catch (error) {
      console.error('Error in getBraiderMetrics:', error)
      return null
    }
  }

  /**
   * Obter histórico de métricas de um braider
   */
  async getBraiderMetricsHistory(braiderId: string, monthsBack: number = 12): Promise<BookingMetrics[]> {
    try {
      const { data, error } = await this.supabase
        .from('braider_metrics')
        .select('*')
        .eq('braider_id', braiderId)
        .gte('month_year', this.getMonthsAgo(monthsBack))
        .order('month_year', { ascending: false })

      if (error) {
        console.error('Error fetching braider metrics history:', error)
        return []
      }

      return (data || []).map(item => ({
        braiderId: item.braider_id,
        totalBookings: item.total_bookings || 0,
        completedBookings: item.completed_bookings || 0,
        cancelledBookings: item.cancelled_bookings || 0,
        totalRevenue: parseFloat(item.total_revenue || '0'),
        potentialCommission: parseFloat(item.potential_commission || '0'),
        averageBookingValue: parseFloat(item.average_booking_value || '0')
      }))
    } catch (error) {
      console.error('Error in getBraiderMetricsHistory:', error)
      return []
    }
  }

  /**
   * Verificar se monetização está ativa
   */
  async isMonetizationEnabled(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('is_monetization_enabled')
      
      if (error) {
        console.error('Error checking monetization status:', error)
        return false
      }

      return data === true
    } catch (error) {
      console.error('Error in isMonetizationEnabled:', error)
      return false
    }
  }

  /**
   * Obter taxa de comissão atual
   */
  private async getCommissionRate(): Promise<number> {
    try {
      const { data, error } = await this.supabase.rpc('get_commission_rate')
      
      if (error) {
        console.error('Error getting commission rate:', error)
        return 0.1 // Default 10%
      }

      return parseFloat(data || '0.1')
    } catch (error) {
      console.error('Error in getCommissionRate:', error)
      return 0.1
    }
  }

  /**
   * Utilitário: obter início do mês atual
   */
  private getCurrentMonthStart(): string {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    return monthStart.toISOString().split('T')[0]
  }

  /**
   * Utilitário: obter data de X meses atrás
   */
  private getMonthsAgo(months: number): string {
    const now = new Date()
    const monthsAgo = new Date(now.getFullYear(), now.getMonth() - months, 1)
    return monthsAgo.toISOString().split('T')[0]
  }

  /**
   * Obter métricas de uma promoção específica
   */
  async getPromotionMetrics(promotionId: string): Promise<PromotionMetrics | null> {
    try {
      const { data: promotion, error } = await this.supabase
        .from('promotions')
        .select(`
          id,
          views_count,
          clicks_count,
          contacts_count,
          conversions_count,
          investment_amount,
          revenue_generated
        `)
        .eq('id', promotionId)
        .single()

      if (error || !promotion) {
        return null
      }

      // Calcular métricas derivadas
      const views = promotion.views_count || 0
      const clicks = promotion.clicks_count || 0
      const contacts = promotion.contacts_count || 0
      const conversions = promotion.conversions_count || 0
      const investment = promotion.investment_amount || 0
      const revenue = promotion.revenue_generated || 0

      const ctr = views > 0 ? (clicks / views) * 100 : 0
      const cvr = clicks > 0 ? (conversions / clicks) * 100 : 0
      const cost_per_click = clicks > 0 ? investment / clicks : 0
      const cost_per_conversion = conversions > 0 ? investment / conversions : 0
      const roi = investment > 0 ? ((revenue - investment) / investment) * 100 : 0

      return {
        promotion_id: promotionId,
        views_count: views,
        clicks_count: clicks,
        contacts_count: contacts,
        conversions_count: conversions,
        ctr: Number(ctr.toFixed(2)),
        cvr: Number(cvr.toFixed(2)),
        cost_per_click: Number(cost_per_click.toFixed(2)),
        cost_per_conversion: Number(cost_per_conversion.toFixed(2)),
        revenue_generated: revenue,
        roi: Number(roi.toFixed(2))
      }
    } catch (error) {
      console.error('Error getting promotion metrics:', error)
      return null
    }
  }

  /**
   * Gerar relatório de analytics de promoções
   */
  async generatePromotionAnalyticsReport(
    dateFrom?: string,
    dateTo?: string
  ): Promise<PromotionAnalyticsReport | null> {
    try {
      const fromDate = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const toDate = dateTo || new Date().toISOString()

      // Criar cliente server para admin queries
      const serverClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            get() { return undefined },
            set() {},
            remove() {}
          }
        }
      )

      const { data: promotions, error } = await serverClient
        .from('promotions')
        .select(`
          id,
          title,
          type,
          views_count,
          clicks_count,
          contacts_count,
          conversions_count,
          investment_amount,
          revenue_generated,
          status
        `)
        .gte('created_at', fromDate)
        .lte('created_at', toDate)

      if (error) {
        console.error('Error fetching promotions for report:', error)
        return null
      }

      const allPromotions = promotions || []
      const activePromotions = allPromotions.filter(p => p.status === 'active')

      // Calcular totais
      const totalViews = allPromotions.reduce((sum, p) => sum + (p.views_count || 0), 0)
      const totalClicks = allPromotions.reduce((sum, p) => sum + (p.clicks_count || 0), 0)
      const totalContacts = allPromotions.reduce((sum, p) => sum + (p.contacts_count || 0), 0)
      const totalConversions = allPromotions.reduce((sum, p) => sum + (p.conversions_count || 0), 0)
      const totalRevenue = allPromotions.reduce((sum, p) => sum + (p.revenue_generated || 0), 0)
      const totalInvestment = allPromotions.reduce((sum, p) => sum + (p.investment_amount || 0), 0)

      const averageCtr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0
      const averageCvr = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
      const overallRoi = totalInvestment > 0 ? ((totalRevenue - totalInvestment) / totalInvestment) * 100 : 0

      // Top performing promotions
      const topPerforming = allPromotions
        .map(p => ({
          id: p.id,
          title: p.title,
          type: p.type,
          metrics: {
            promotion_id: p.id,
            views_count: p.views_count || 0,
            clicks_count: p.clicks_count || 0,
            contacts_count: p.contacts_count || 0,
            conversions_count: p.conversions_count || 0,
            ctr: p.views_count > 0 ? ((p.clicks_count || 0) / p.views_count) * 100 : 0,
            cvr: p.clicks_count > 0 ? ((p.conversions_count || 0) / p.clicks_count) * 100 : 0,
            revenue_generated: p.revenue_generated || 0,
            roi: p.investment_amount > 0 ? (((p.revenue_generated || 0) - p.investment_amount) / p.investment_amount) * 100 : 0
          }
        }))
        .sort((a, b) => b.metrics.roi - a.metrics.roi)
        .slice(0, 10)

      return {
        total_promotions: allPromotions.length,
        active_promotions: activePromotions.length,
        total_views: totalViews,
        total_clicks: totalClicks,
        total_contacts: totalContacts,
        total_conversions: totalConversions,
        average_ctr: Number(averageCtr.toFixed(2)),
        average_cvr: Number(averageCvr.toFixed(2)),
        total_revenue: totalRevenue,
        total_investment: totalInvestment,
        overall_roi: Number(overallRoi.toFixed(2)),
        top_performing: topPerforming
      }
    } catch (error) {
      console.error('Error generating promotion analytics report:', error)
      return null
    }
  }

  /**
   * Obter métricas dashboard em tempo real (promoções + agendamentos)
   */
  async getDashboardMetrics(): Promise<{
    bookings: { today: any, thisWeek: any, thisMonth: any }
    promotions: PromotionAnalyticsReport | null
  }> {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Para bookings - usaríamos métodos existentes ou novos específicos
    const bookingsMetrics = {
      today: null, // Implementar se necessário
      thisWeek: null,
      thisMonth: null
    }

    // Para promoções
    const promotionsReport = await this.generatePromotionAnalyticsReport(monthAgo, now.toISOString())

    return {
      bookings: bookingsMetrics,
      promotions: promotionsReport
    }
  }

  /**
   * Criar cliente server para operações administrativas
   */
  private createServerClient() {
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined },
          set() {},
          remove() {}
        }
      }
    )
  }
}

// Instância singleton
export const analyticsTracker = new AnalyticsTracker()

// Hooks para facilitar uso em componentes React
export function useAnalyticsTracker() {
  return {
    // Métodos existentes (bookings/monetização)
    trackEvent: analyticsTracker.trackEvent.bind(analyticsTracker),
    getBraiderMetrics: analyticsTracker.getBraiderMetrics.bind(analyticsTracker),
    getBraiderMetricsHistory: analyticsTracker.getBraiderMetricsHistory.bind(analyticsTracker),
    isMonetizationEnabled: analyticsTracker.isMonetizationEnabled.bind(analyticsTracker),
    
    // Novos métodos para promoções
    getPromotionMetrics: analyticsTracker.getPromotionMetrics.bind(analyticsTracker),
    generatePromotionAnalyticsReport: analyticsTracker.generatePromotionAnalyticsReport.bind(analyticsTracker),
    getDashboardMetrics: analyticsTracker.getDashboardMetrics.bind(analyticsTracker)
  }
}

// Exportar tipos para uso em outros arquivos
export type { 
  BookingMetrics, 
  PromotionMetrics, 
  AnalyticsEvent, 
  PromotionAnalyticsReport 
}