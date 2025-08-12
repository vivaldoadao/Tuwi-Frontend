/**
 * SISTEMA DE NOTIFICAÇÕES PARA MONETIZAÇÃO
 * 
 * Gerencia notificações relacionadas a:
 * - Ativação da monetização
 * - Períodos de transição
 * - Status de pagamentos
 * - Onboarding do Stripe
 */

import { createClient } from '@/lib/supabase/client'

interface MonetizationNotification {
  userId: string
  braiderId?: string
  type: 'monetization_enabled' | 'grace_period_ending' | 'payment_failed' | 'stripe_onboarding_required' | 'commission_charged'
  title: string
  message: string
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
}

class MonetizationNotificationManager {
  private supabase = createClient()

  /**
   * Notificar ativação da monetização
   */
  async notifyMonetizationEnabled(gracePeriodDays: number): Promise<void> {
    try {
      console.log('📢 Sending monetization enabled notifications')

      // Obter todos os braiders ativos
      const { data: braiders, error } = await this.supabase
        .from('braiders')
        .select(`
          id,
          user_id,
          users!inner (
            id,
            name,
            email
          )
        `)
        .eq('status', 'approved')

      if (error) {
        console.error('Error fetching braiders for notifications:', error)
        return
      }

      // Enviar notificação para cada braider
      const notifications = braiders.map(braider => ({
        userId: braider.user_id,
        braiderId: braider.id,
        type: 'monetization_enabled' as const,
        title: 'Sistema de Cobrança Ativado',
        message: `O sistema de cobrança da plataforma foi ativado. Você tem ${gracePeriodDays} dias de período de transição antes do início das cobranças.`,
        actionUrl: '/braider/dashboard/monetization',
        actionLabel: 'Ver Detalhes',
        metadata: {
          gracePeriodDays,
          activationDate: new Date().toISOString()
        }
      }))

      await this.sendNotifications(notifications)

    } catch (error) {
      console.error('Error notifying monetization enabled:', error)
    }
  }

  /**
   * Notificar fim do período de graça
   */
  async notifyGracePeriodEnding(daysRemaining: number): Promise<void> {
    try {
      console.log(`📢 Sending grace period ending notifications (${daysRemaining} days remaining)`)

      // Obter braiders que ainda estão no período de graça
      const { data: braiders, error } = await this.supabase
        .from('braiders')
        .select(`
          id,
          user_id,
          users!inner (
            id,
            name,
            email
          ),
          braider_subscriptions!inner (
            id,
            status,
            created_at
          )
        `)
        .eq('status', 'approved')
        .eq('braider_subscriptions.status', 'free')

      if (error) {
        console.error('Error fetching braiders for grace period notifications:', error)
        return
      }

      const notifications = braiders.map(braider => ({
        userId: braider.user_id,
        braiderId: braider.id,
        type: 'grace_period_ending' as const,
        title: 'Período de Transição Terminando',
        message: `Seu período de transição termina em ${daysRemaining} dias. Configure sua conta Stripe para continuar recebendo pagamentos.`,
        actionUrl: '/braider/dashboard/stripe-setup',
        actionLabel: 'Configurar Stripe',
        metadata: {
          daysRemaining,
          graceEndDate: new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toISOString()
        }
      }))

      await this.sendNotifications(notifications)

    } catch (error) {
      console.error('Error notifying grace period ending:', error)
    }
  }

  /**
   * Notificar falha de pagamento
   */
  async notifyPaymentFailed(braiderId: string, bookingId: string, reason: string): Promise<void> {
    try {
      console.log(`💳 Sending payment failed notification for booking ${bookingId}`)

      const { data: braider, error } = await this.supabase
        .from('braiders')
        .select(`
          id,
          user_id,
          users!inner (
            id,
            name
          )
        `)
        .eq('id', braiderId)
        .single()

      if (error || !braider) {
        console.error('Error fetching braider for payment failed notification:', error)
        return
      }

      const notification: MonetizationNotification = {
        userId: braider.user_id,
        braiderId: braider.id,
        type: 'payment_failed',
        title: 'Falha no Pagamento',
        message: `O pagamento do agendamento #${bookingId} falhou: ${reason}. Verifique sua conta Stripe.`,
        actionUrl: `/braider/dashboard/bookings/${bookingId}`,
        actionLabel: 'Ver Agendamento',
        metadata: {
          bookingId,
          reason,
          failureDate: new Date().toISOString()
        }
      }

      await this.sendNotifications([notification])

    } catch (error) {
      console.error('Error notifying payment failed:', error)
    }
  }

  /**
   * Notificar necessidade de onboarding Stripe
   */
  async notifyStripeOnboardingRequired(braiderId: string): Promise<void> {
    try {
      console.log(`🔗 Sending Stripe onboarding notification for braider ${braiderId}`)

      const { data: braider, error } = await this.supabase
        .from('braiders')
        .select(`
          id,
          user_id,
          users!inner (
            id,
            name
          )
        `)
        .eq('id', braiderId)
        .single()

      if (error || !braider) {
        console.error('Error fetching braider for Stripe onboarding notification:', error)
        return
      }

      const notification: MonetizationNotification = {
        userId: braider.user_id,
        braiderId: braider.id,
        type: 'stripe_onboarding_required',
        title: 'Configure sua Conta Stripe',
        message: 'Complete a configuração da sua conta Stripe para poder receber pagamentos através da plataforma.',
        actionUrl: '/braider/dashboard/stripe-setup',
        actionLabel: 'Configurar Agora',
        metadata: {
          requestDate: new Date().toISOString()
        }
      }

      await this.sendNotifications([notification])

    } catch (error) {
      console.error('Error notifying Stripe onboarding required:', error)
    }
  }

  /**
   * Notificar cobrança de comissão
   */
  async notifyCommissionCharged(
    braiderId: string, 
    bookingId: string, 
    serviceAmount: number, 
    commissionAmount: number
  ): Promise<void> {
    try {
      console.log(`💰 Sending commission charged notification for booking ${bookingId}`)

      const { data: braider, error } = await this.supabase
        .from('braiders')
        .select(`
          id,
          user_id,
          users!inner (
            id,
            name
          )
        `)
        .eq('id', braiderId)
        .single()

      if (error || !braider) {
        console.error('Error fetching braider for commission notification:', error)
        return
      }

      const netAmount = serviceAmount - commissionAmount
      const commissionPercentage = ((commissionAmount / serviceAmount) * 100).toFixed(1)

      const notification: MonetizationNotification = {
        userId: braider.user_id,
        braiderId: braider.id,
        type: 'commission_charged',
        title: 'Comissão Processada',
        message: `Comissão de €${commissionAmount.toFixed(2)} (${commissionPercentage}%) foi descontada do agendamento #${bookingId}. Você recebeu €${netAmount.toFixed(2)}.`,
        actionUrl: `/braider/dashboard/earnings`,
        actionLabel: 'Ver Ganhos',
        metadata: {
          bookingId,
          serviceAmount,
          commissionAmount,
          netAmount,
          commissionPercentage: parseFloat(commissionPercentage),
          processedDate: new Date().toISOString()
        }
      }

      await this.sendNotifications([notification])

    } catch (error) {
      console.error('Error notifying commission charged:', error)
    }
  }

  /**
   * Enviar notificações através do sistema existente
   */
  private async sendNotifications(notifications: MonetizationNotification[]): Promise<void> {
    try {
      const notificationRecords = notifications.map(notification => ({
        user_id: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        action_url: notification.actionUrl,
        action_label: notification.actionLabel,
        metadata: notification.metadata || {},
        is_read: false,
        created_at: new Date().toISOString()
      }))

      const { error } = await this.supabase
        .from('notifications')
        .insert(notificationRecords)

      if (error) {
        console.error('Error inserting notifications:', error)
      } else {
        console.log(`✅ Sent ${notificationRecords.length} monetization notifications`)
      }

    } catch (error) {
      console.error('Error sending notifications:', error)
    }
  }

  /**
   * Agendar notificações de lembrete do período de graça
   */
  async scheduleGracePeriodReminders(): Promise<void> {
    try {
      // Esta função seria chamada por um cron job diário
      console.log('🕐 Checking for grace period reminders to send')

      const gracePeriodDays = 30 // Valor padrão ou buscar das settings
      const reminderDays = [7, 3, 1] // Enviar lembretes nesses dias

      for (const daysRemaining of reminderDays) {
        await this.notifyGracePeriodEnding(daysRemaining)
      }

    } catch (error) {
      console.error('Error scheduling grace period reminders:', error)
    }
  }
}

// Singleton instance
export const monetizationNotificationManager = new MonetizationNotificationManager()

// Funções de conveniência
export async function notifyMonetizationEnabled(gracePeriodDays: number) {
  return monetizationNotificationManager.notifyMonetizationEnabled(gracePeriodDays)
}

export async function notifyPaymentFailed(braiderId: string, bookingId: string, reason: string) {
  return monetizationNotificationManager.notifyPaymentFailed(braiderId, bookingId, reason)
}

export async function notifyStripeOnboardingRequired(braiderId: string) {
  return monetizationNotificationManager.notifyStripeOnboardingRequired(braiderId)
}

export async function notifyCommissionCharged(
  braiderId: string, 
  bookingId: string, 
  serviceAmount: number, 
  commissionAmount: number
) {
  return monetizationNotificationManager.notifyCommissionCharged(
    braiderId, bookingId, serviceAmount, commissionAmount
  )
}