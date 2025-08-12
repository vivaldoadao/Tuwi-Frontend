/**
 * Sistema de Notificações para Promoções - Wilnara Tranças
 * 
 * Notificações automáticas para:
 * - Promoções expirando
 * - Performance baixa
 * - Sugestões de otimização
 * - Lembretes de renovação
 */

import { createServerClient } from '@supabase/ssr'
import { sendEmail } from '@/lib/email-service'

// Interfaces
export interface NotificationConfig {
  email_enabled: boolean
  in_app_enabled: boolean
  push_enabled: boolean
  expiration_days_before: number
  performance_threshold_ctr: number
  performance_threshold_roi: number
}

export interface NotificationTemplate {
  type: 'expiring' | 'expired' | 'low_performance' | 'renewal_reminder' | 'performance_report'
  subject: string
  body: string
  cta_text?: string
  cta_url?: string
}

export interface PromotionNotification {
  id: string
  user_id: string
  promotion_id: string
  type: string
  title: string
  message: string
  metadata: any
  sent_at: string
  read_at?: string
  action_taken?: boolean
}

class PromotionNotificationService {
  private supabase = createServerClient(
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

  /**
   * Verificar e enviar todas as notificações pendentes
   */
  async processAllNotifications(): Promise<{
    expiring: number
    expired: number
    lowPerformance: number
    renewals: number
    reports: number
  }> {
    console.log('🔔 Processing all promotion notifications...')

    const results = {
      expiring: 0,
      expired: 0,
      lowPerformance: 0,
      renewals: 0,
      reports: 0
    }

    try {
      // 1. Notificações de expiração
      results.expiring = await this.processExpiringNotifications()

      // 2. Notificações de promoções já expiradas
      results.expired = await this.processExpiredNotifications()

      // 3. Alertas de baixa performance
      results.lowPerformance = await this.processLowPerformanceAlerts()

      // 4. Lembretes de renovação
      results.renewals = await this.processRenewalReminders()

      // 5. Relatórios semanais de performance
      results.reports = await this.processWeeklyReports()

      console.log('✅ All notifications processed:', results)
      return results

    } catch (error) {
      console.error('❌ Error processing notifications:', error)
      return results
    }
  }

  /**
   * Processar notificações de promoções expirando
   */
  private async processExpiringNotifications(): Promise<number> {
    try {
      // Buscar configurações de notificação
      const config = await this.getNotificationConfig()
      const daysBefore = config.expiration_days_before

      // Buscar promoções expirando
      const { data: expiringPromotions, error } = await this.supabase
        .rpc('get_expiring_promotions', { days_before: daysBefore })

      if (error) {
        console.error('Error fetching expiring promotions:', error)
        return 0
      }

      let sentCount = 0

      for (const promo of expiringPromotions || []) {
        // Verificar se já foi enviada notificação hoje
        const alreadySent = await this.wasNotificationSentToday(
          promo.user_id, 
          promo.id, 
          'expiring'
        )

        if (!alreadySent) {
          await this.sendExpiringNotification(promo)
          sentCount++
        }
      }

      return sentCount

    } catch (error) {
      console.error('Error processing expiring notifications:', error)
      return 0
    }
  }

  /**
   * Processar notificações de promoções expiradas
   */
  private async processExpiredNotifications(): Promise<number> {
    try {
      // Executar expiração automática e obter IDs
      const { data: expiredResult } = await this.supabase
        .rpc('expire_promotions')

      if (!expiredResult || !expiredResult.expired_ids?.length) {
        return 0
      }

      let sentCount = 0

      // Buscar dados das promoções expiradas
      const { data: expiredPromotions } = await this.supabase
        .from('promotions')
        .select(`
          id,
          user_id,
          title,
          type,
          end_date,
          views_count,
          clicks_count,
          conversions_count
        `)
        .in('id', expiredResult.expired_ids)

      for (const promo of expiredPromotions || []) {
        await this.sendExpiredNotification(promo)
        sentCount++
      }

      return sentCount

    } catch (error) {
      console.error('Error processing expired notifications:', error)
      return 0
    }
  }

  /**
   * Processar alertas de baixa performance
   */
  private async processLowPerformanceAlerts(): Promise<number> {
    try {
      const config = await this.getNotificationConfig()

      // Buscar promoções ativas com baixa performance
      const { data: lowPerformancePromotions } = await this.supabase
        .from('promotions')
        .select('*')
        .eq('status', 'active')
        .gt('views_count', 100) // Só alertar se tiver views suficientes
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Últimos 7 dias

      if (!lowPerformancePromotions?.length) {
        return 0
      }

      let sentCount = 0

      for (const promo of lowPerformancePromotions) {
        const ctr = promo.views_count > 0 ? (promo.clicks_count / promo.views_count) * 100 : 0
        const roi = promo.investment_amount > 0 ? 
          ((promo.revenue_generated - promo.investment_amount) / promo.investment_amount) * 100 : 0

        // Verificar se performance está baixa
        if (ctr < config.performance_threshold_ctr || roi < config.performance_threshold_roi) {
          const alreadySent = await this.wasNotificationSentToday(
            promo.user_id,
            promo.id,
            'low_performance'
          )

          if (!alreadySent) {
            await this.sendLowPerformanceAlert(promo, { ctr, roi })
            sentCount++
          }
        }
      }

      return sentCount

    } catch (error) {
      console.error('Error processing low performance alerts:', error)
      return 0
    }
  }

  /**
   * Processar lembretes de renovação
   */
  private async processRenewalReminders(): Promise<number> {
    try {
      // Buscar promoções que expiraram há 1-3 dias
      const { data: expiredPromotions } = await this.supabase
        .from('promotions')
        .select('*')
        .eq('status', 'expired')
        .gte('end_date', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
        .lte('end_date', new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString())

      let sentCount = 0

      for (const promo of expiredPromotions || []) {
        const alreadySent = await this.wasNotificationSentToday(
          promo.user_id,
          promo.id,
          'renewal_reminder'
        )

        if (!alreadySent) {
          await this.sendRenewalReminder(promo)
          sentCount++
        }
      }

      return sentCount

    } catch (error) {
      console.error('Error processing renewal reminders:', error)
      return 0
    }
  }

  /**
   * Processar relatórios semanais
   */
  private async processWeeklyReports(): Promise<number> {
    try {
      // Só processar nas segundas-feiras
      const today = new Date()
      if (today.getDay() !== 1) return 0

      // Buscar todos os usuários com promoções ativas ou recentes
      const { data: activeUsers } = await this.supabase
        .from('promotions')
        .select('user_id')
        .or('status.eq.active,status.eq.expired')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      if (!activeUsers?.length) return 0

      const uniqueUsers = [...new Set(activeUsers.map(p => p.user_id))]
      let sentCount = 0

      for (const userId of uniqueUsers) {
        const alreadySent = await this.wasNotificationSentThisWeek(userId, 'performance_report')

        if (!alreadySent) {
          await this.sendWeeklyReport(userId)
          sentCount++
        }
      }

      return sentCount

    } catch (error) {
      console.error('Error processing weekly reports:', error)
      return 0
    }
  }

  /**
   * Enviar notificação de promoção expirando
   */
  private async sendExpiringNotification(promo: any): Promise<void> {
    try {
      const template = this.getEmailTemplate('expiring', {
        title: promo.title,
        type: promo.type,
        days_left: promo.days_left,
        user_name: promo.user_name
      })

      // Enviar email
      await sendEmail(
        promo.user_email,
        template.subject,
        template.body
      )

      // Criar notificação in-app
      await this.createInAppNotification({
        user_id: promo.user_id,
        promotion_id: promo.id,
        type: 'expiring',
        title: 'Promoção Expirando',
        message: `Sua promoção "${promo.title}" expira em ${promo.days_left} dias.`,
        metadata: {
          days_left: promo.days_left,
          promotion_type: promo.type,
          original_type: 'expiring'
        }
      })

    } catch (error) {
      console.error('Error sending expiring notification:', error)
    }
  }

  /**
   * Enviar notificação de promoção expirada
   */
  private async sendExpiredNotification(promo: any): Promise<void> {
    try {
      const template = this.getEmailTemplate('expired', {
        title: promo.title,
        type: promo.type,
        views: promo.views_count || 0,
        clicks: promo.clicks_count || 0,
        conversions: promo.conversions_count || 0
      })

      await sendEmail(
        (await this.getUserEmail(promo.user_id)),
        template.subject,
        template.body
      )

      await this.createInAppNotification({
        user_id: promo.user_id,
        promotion_id: promo.id,
        type: 'expired',
        title: 'Promoção Expirada',
        message: `Sua promoção "${promo.title}" expirou. Veja os resultados e considere renovar.`,
        metadata: {
          final_stats: {
            views: promo.views_count,
            clicks: promo.clicks_count,
            conversions: promo.conversions_count
          },
          original_type: 'expired'
        }
      })

    } catch (error) {
      console.error('Error sending expired notification:', error)
    }
  }

  /**
   * Enviar alerta de baixa performance
   */
  private async sendLowPerformanceAlert(promo: any, metrics: { ctr: number, roi: number }): Promise<void> {
    try {
      const suggestions = this.generateOptimizationSuggestions(promo, metrics)
      
      const template = this.getEmailTemplate('low_performance', {
        title: promo.title,
        ctr: metrics.ctr.toFixed(2),
        roi: metrics.roi.toFixed(2),
        suggestions
      })

      await sendEmail(
        (await this.getUserEmail(promo.user_id)),
        template.subject,
        template.body
      )

      await this.createInAppNotification({
        user_id: promo.user_id,
        promotion_id: promo.id,
        type: 'low_performance',
        title: 'Performance Baixa Detectada',
        message: `Sua promoção "${promo.title}" pode ser otimizada. Veja nossas sugestões.`,
        metadata: {
          current_ctr: metrics.ctr,
          current_roi: metrics.roi,
          suggestions,
          original_type: 'low_performance'
        }
      })

    } catch (error) {
      console.error('Error sending low performance alert:', error)
    }
  }

  /**
   * Enviar lembrete de renovação
   */
  private async sendRenewalReminder(promo: any): Promise<void> {
    try {
      const template = this.getEmailTemplate('renewal_reminder', {
        title: promo.title,
        type: promo.type
      })

      await sendEmail(
        (await this.getUserEmail(promo.user_id)),
        template.subject,
        template.body
      )

      await this.createInAppNotification({
        user_id: promo.user_id,
        promotion_id: promo.id,
        type: 'renewal_reminder',
        title: 'Renove sua Promoção',
        message: `Que tal renovar sua promoção "${promo.title}"? Os resultados foram promissores!`,
        metadata: {
          original_promotion: promo.id,
          renewal_discount: 10, // 10% desconto na renovação
          original_type: 'renewal_reminder'
        }
      })

    } catch (error) {
      console.error('Error sending renewal reminder:', error)
    }
  }

  /**
   * Enviar relatório semanal
   */
  private async sendWeeklyReport(userId: string): Promise<void> {
    try {
      // Buscar dados da semana
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: weeklyData } = await this.supabase
        .from('promotions')
        .select('*')
        .eq('user_id', userId)
        .gte('updated_at', weekAgo)

      if (!weeklyData?.length) return

      const summary = this.generateWeeklySummary(weeklyData)
      
      const template = this.getEmailTemplate('performance_report', {
        ...summary,
        user_email: await this.getUserEmail(userId)
      })

      await sendEmail(
        await this.getUserEmail(userId),
        template.subject,
        template.body
      )

      await this.createInAppNotification({
        user_id: userId,
        promotion_id: null,
        type: 'performance_report',
        title: 'Relatório Semanal Disponível',
        message: `Seu relatório de performance da semana está pronto!`,
        metadata: { 
          summary,
          original_type: 'performance_report'
        }
      })

    } catch (error) {
      console.error('Error sending weekly report:', error)
    }
  }

  /**
   * Criar notificação in-app usando a tabela notifications existente
   */
  private async createInAppNotification(notification: Omit<PromotionNotification, 'id' | 'sent_at'>): Promise<void> {
    try {
      // Inserir na tabela notifications padrão
      await this.supabase.from('notifications').insert({
        user_id: notification.user_id,
        type: this.mapPromotionTypeToNotificationType(notification.type),
        title: notification.title,
        message: notification.message,
        is_important: notification.type.includes('expired') || notification.type.includes('low_performance'),
        action_url: notification.promotion_id ? `/braider/promotions?highlight=${notification.promotion_id}` : '/braider/promotions',
        action_label: 'Ver Promoções',
        metadata: {
          ...notification.metadata,
          promotion_id: notification.promotion_id,
          notification_source: 'promotion_system'
        }
      })
      
      console.log('✅ In-app notification created for user:', notification.user_id)
    } catch (error) {
      console.error('Error creating in-app notification:', error)
    }
  }

  /**
   * Mapear tipo de notificação de promoção para tipo de notificação geral
   */
  private mapPromotionTypeToNotificationType(promotionType: string): string {
    const typeMap: { [key: string]: string } = {
      'expiring': 'warning',
      'expired': 'info', 
      'low_performance': 'warning',
      'renewal_reminder': 'info',
      'performance_report': 'info'
    }
    
    return typeMap[promotionType] || 'info'
  }

  /**
   * Verificar se notificação já foi enviada hoje
   */
  private async wasNotificationSentToday(userId: string, promotionId: string, type: string): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data } = await this.supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('metadata->>promotion_id', promotionId)
        .eq('metadata->>notification_source', 'promotion_system')
        .eq('metadata->>original_type', type)
        .gte('created_at', today)
        .limit(1)

      return !!data?.length

    } catch (error) {
      console.error('Error checking notification history:', error)
      return false
    }
  }

  /**
   * Verificar se notificação semanal já foi enviada
   */
  private async wasNotificationSentThisWeek(userId: string, type: string): Promise<boolean> {
    try {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1) // Segunda-feira
      
      const { data } = await this.supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('metadata->>notification_source', 'promotion_system')
        .eq('metadata->>original_type', type)
        .gte('created_at', weekStart.toISOString())
        .limit(1)

      return !!data?.length

    } catch (error) {
      console.error('Error checking weekly notification history:', error)
      return false
    }
  }

  /**
   * Obter configurações de notificação
   */
  private async getNotificationConfig(): Promise<NotificationConfig> {
    try {
      const { data } = await this.supabase
        .from('notification_settings')
        .select('*')
        .eq('type', 'promotion_notifications')
        .single()

      return data?.config || {
        email_enabled: true,
        in_app_enabled: true,
        push_enabled: false,
        expiration_days_before: 2,
        performance_threshold_ctr: 2.0,
        performance_threshold_roi: 10.0
      }

    } catch (error) {
      console.error('Error fetching notification config:', error)
      return {
        email_enabled: true,
        in_app_enabled: true,
        push_enabled: false,
        expiration_days_before: 2,
        performance_threshold_ctr: 2.0,
        performance_threshold_roi: 10.0
      }
    }
  }

  /**
   * Obter email do usuário
   */
  private async getUserEmail(userId: string): Promise<string> {
    try {
      const { data } = await this.supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single()

      return data?.email || ''

    } catch (error) {
      console.error('Error fetching user email:', error)
      return ''
    }
  }

  /**
   * Gerar template de email
   */
  private getEmailTemplate(type: string, variables: any): NotificationTemplate {
    const templates: { [key: string]: NotificationTemplate } = {
      expiring: {
        type: 'expiring',
        subject: `⚠️ Sua promoção "${variables.title}" expira em ${variables.days_left} dias`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #8B5CF6;">Promoção Expirando</h2>
            <p>Olá ${variables.user_name},</p>
            <p>Sua promoção <strong>"${variables.title}"</strong> expira em <strong>${variables.days_left} dias</strong>.</p>
            <p>Para continuar obtendo mais visibilidade, considere renovar sua promoção.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/braider/promotions" 
               style="background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 16px 0;">
              Renovar Promoção
            </a>
          </div>
        `,
        cta_text: 'Renovar Promoção',
        cta_url: '/braider/promotions'
      },
      expired: {
        type: 'expired',
        subject: `📊 Promoção "${variables.title}" expirada - Veja os resultados`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #EC4899;">Promoção Finalizada</h2>
            <p>Sua promoção <strong>"${variables.title}"</strong> foi finalizada.</p>
            <h3>Resultados Finais:</h3>
            <ul>
              <li><strong>Visualizações:</strong> ${variables.views}</li>
              <li><strong>Cliques:</strong> ${variables.clicks}</li>
              <li><strong>Conversões:</strong> ${variables.conversions}</li>
            </ul>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/braider/promotions" 
               style="background: #EC4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 16px 0;">
              Ver Detalhes
            </a>
          </div>
        `
      },
      low_performance: {
        type: 'low_performance',
        subject: `📈 Como melhorar o desempenho da promoção "${variables.title}"`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #F59E0B;">Oportunidade de Melhoria</h2>
            <p>Sua promoção <strong>"${variables.title}"</strong> pode ter melhor performance.</p>
            <p><strong>Performance atual:</strong></p>
            <ul>
              <li>Taxa de clique: ${variables.ctr}%</li>
              <li>ROI: ${variables.roi}%</li>
            </ul>
            <h3>Sugestões:</h3>
            <ul>
              ${variables.suggestions.map((s: string) => `<li>${s}</li>`).join('')}
            </ul>
          </div>
        `
      },
      renewal_reminder: {
        type: 'renewal_reminder',
        subject: `🔄 Que tal renovar "${variables.title}"?`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10B981;">Renovação Disponível</h2>
            <p>Sua promoção <strong>"${variables.title}"</strong> teve bons resultados!</p>
            <p>Renove agora e continue atraindo mais clientes.</p>
            <p><strong>🎉 Desconto especial de 10% na renovação!</strong></p>
          </div>
        `
      },
      performance_report: {
        type: 'performance_report',
        subject: '📊 Seu relatório semanal de promoções',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #8B5CF6;">Relatório Semanal</h2>
            <p>Aqui está um resumo da performance das suas promoções esta semana:</p>
            <ul>
              <li><strong>Total de visualizações:</strong> ${variables.total_views}</li>
              <li><strong>Total de cliques:</strong> ${variables.total_clicks}</li>
              <li><strong>Conversões:</strong> ${variables.total_conversions}</li>
            </ul>
          </div>
        `
      }
    }

    return templates[type] || templates.expiring
  }

  /**
   * Gerar sugestões de otimização
   */
  private generateOptimizationSuggestions(promo: any, metrics: { ctr: number, roi: number }): string[] {
    const suggestions: string[] = []

    if (metrics.ctr < 2.0) {
      suggestions.push('Considere alterar o título ou descrição para ser mais atrativo')
      suggestions.push('Adicione imagens mais chamativas ao conteúdo')
    }

    if (metrics.roi < 10.0) {
      suggestions.push('Revise o valor do investimento vs. preço dos serviços')
      suggestions.push('Foque em horários de maior movimento')
    }

    if (suggestions.length === 0) {
      suggestions.push('Sua promoção está dentro dos parâmetros esperados')
    }

    return suggestions
  }

  /**
   * Gerar resumo semanal
   */
  private generateWeeklySummary(data: any[]): any {
    const summary = {
      total_views: data.reduce((sum, p) => sum + (p.views_count || 0), 0),
      total_clicks: data.reduce((sum, p) => sum + (p.clicks_count || 0), 0),
      total_conversions: data.reduce((sum, p) => sum + (p.conversions_count || 0), 0),
      active_promotions: data.filter(p => p.status === 'active').length,
      expired_promotions: data.filter(p => p.status === 'expired').length
    }

    return summary
  }
}

// Instância singleton
export const promotionNotificationService = new PromotionNotificationService()

// Hook para uso em React
export function usePromotionNotifications() {
  return {
    processAllNotifications: promotionNotificationService.processAllNotifications.bind(promotionNotificationService)
  }
}