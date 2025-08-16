/**
 * 📬 NOTIFICATION QUEUE SYSTEM
 * Sistema de filas para emails e notificações assíncronas
 */

import { createClient } from '@/lib/supabase/client'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export interface QueueJob {
  id?: string
  type: 'email' | 'sms' | 'push' | 'webhook' | 'system'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying'
  payload: Record<string, any>
  attempts: number
  max_attempts: number
  scheduled_at?: string
  processed_at?: string
  failed_at?: string
  error_message?: string
  created_at: string
  updated_at: string
}

export interface EmailJob {
  to: string | string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  template: string
  variables: Record<string, any>
  attachments?: {
    filename: string
    content: string
    contentType: string
  }[]
}

export interface SMSJob {
  phone: string | string[]
  message: string
  sender?: string
}

export interface PushJob {
  user_id: string | string[]
  title: string
  body: string
  data?: Record<string, any>
  icon?: string
  image?: string
}

export interface WebhookJob {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  payload?: Record<string, any>
  timeout?: number
}

class NotificationQueue {
  private supabase = createClient()
  private serviceClient: ReturnType<typeof createServiceClient>
  private isProcessing = false
  private processingInterval?: NodeJS.Timeout
  private maxConcurrentJobs = 5
  private currentJobs = 0

  constructor() {
    this.serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Start processing if in server environment
    if (typeof window === 'undefined') {
      this.startProcessing()
    }
  }

  // 📬 QUEUE MANAGEMENT

  /**
   * Add email job to queue
   */
  async queueEmail(
    emailData: EmailJob,
    priority: QueueJob['priority'] = 'normal',
    scheduledAt?: Date
  ): Promise<string | null> {
    try {
      const job: Omit<QueueJob, 'id'> = {
        type: 'email',
        priority,
        status: 'pending',
        payload: emailData,
        attempts: 0,
        max_attempts: 3,
        scheduled_at: scheduledAt?.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.serviceClient
        .from('notification_queue')
        .insert(job)
        .select('id')
        .single()

      if (error) throw error

      console.log('📧 Email queued:', (data as any).id)
      return (data as any).id
    } catch (error) {
      console.error('Error queueing email:', error)
      return null
    }
  }

  /**
   * Add SMS job to queue
   */
  async queueSMS(
    smsData: SMSJob,
    priority: QueueJob['priority'] = 'normal',
    scheduledAt?: Date
  ): Promise<string | null> {
    try {
      const job: Omit<QueueJob, 'id'> = {
        type: 'sms',
        priority,
        status: 'pending',
        payload: smsData,
        attempts: 0,
        max_attempts: 2,
        scheduled_at: scheduledAt?.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.serviceClient
        .from('notification_queue')
        .insert(job)
        .select('id')
        .single()

      if (error) throw error

      console.log('📱 SMS queued:', (data as any).id)
      return (data as any).id
    } catch (error) {
      console.error('Error queueing SMS:', error)
      return null
    }
  }

  /**
   * Add push notification job to queue
   */
  async queuePushNotification(
    pushData: PushJob,
    priority: QueueJob['priority'] = 'normal'
  ): Promise<string | null> {
    try {
      const job: Omit<QueueJob, 'id'> = {
        type: 'push',
        priority,
        status: 'pending',
        payload: pushData,
        attempts: 0,
        max_attempts: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.serviceClient
        .from('notification_queue')
        .insert(job)
        .select('id')
        .single()

      if (error) throw error

      console.log('🔔 Push notification queued:', (data as any).id)
      return (data as any).id
    } catch (error) {
      console.error('Error queueing push notification:', error)
      return null
    }
  }

  /**
   * Add webhook job to queue
   */
  async queueWebhook(
    webhookData: WebhookJob,
    priority: QueueJob['priority'] = 'normal'
  ): Promise<string | null> {
    try {
      const job: Omit<QueueJob, 'id'> = {
        type: 'webhook',
        priority,
        status: 'pending',
        payload: webhookData,
        attempts: 0,
        max_attempts: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.serviceClient
        .from('notification_queue')
        .insert(job)
        .select('id')
        .single()

      if (error) throw error

      console.log('🔗 Webhook queued:', (data as any).id)
      return (data as any).id
    } catch (error) {
      console.error('Error queueing webhook:', error)
      return null
    }
  }

  // ⚙️ QUEUE PROCESSING

  /**
   * Start queue processing
   */
  startProcessing() {
    if (this.isProcessing) return

    this.isProcessing = true
    console.log('🚀 Starting notification queue processing...')

    this.processingInterval = setInterval(() => {
      this.processQueue()
    }, 5000) // Process every 5 seconds
  }

  /**
   * Stop queue processing
   */
  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = undefined
    }
    this.isProcessing = false
    console.log('⏹️ Stopped notification queue processing')
  }

  /**
   * Process pending jobs in queue
   */
  private async processQueue() {
    if (this.currentJobs >= this.maxConcurrentJobs) {
      return // Wait for current jobs to finish
    }

    try {
      // Get pending jobs ordered by priority and created_at
      const { data: jobs, error } = await this.serviceClient
        .from('notification_queue')
        .select('*')
        .eq('status', 'pending')
        .or(`scheduled_at.is.null,scheduled_at.lte.${new Date().toISOString()}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(this.maxConcurrentJobs - this.currentJobs)

      if (error) throw error

      if (jobs && jobs.length > 0) {
        console.log(`📋 Processing ${jobs.length} queue jobs...`)
        
        // Process jobs concurrently
        const promises = jobs.map(job => this.processJob(job as unknown as QueueJob))
        await Promise.allSettled(promises)
      }

      // Clean up old completed/failed jobs (older than 7 days)
      await this.cleanupOldJobs()

    } catch (error) {
      console.error('Error processing queue:', error)
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: QueueJob): Promise<void> {
    this.currentJobs++

    try {
      // Mark job as processing
      await this.updateJobStatus(job.id!, 'processing')

      console.log(`⚡ Processing ${job.type} job:`, job.id)

      let result: boolean = false

      switch (job.type) {
        case 'email':
          result = await this.processEmailJob(job)
          break
        case 'sms':
          result = await this.processSMSJob(job)
          break
        case 'push':
          result = await this.processPushJob(job)
          break
        case 'webhook':
          result = await this.processWebhookJob(job)
          break
        default:
          throw new Error(`Unknown job type: ${job.type}`)
      }

      if (result) {
        await this.updateJobStatus(job.id!, 'completed')
        console.log(`✅ Job completed:`, job.id)
      } else {
        await this.handleJobFailure(job, 'Job processing returned false')
      }

    } catch (error) {
      console.error(`❌ Job failed:`, job.id, error)
      await this.handleJobFailure(job, (error as Error).message)
    } finally {
      this.currentJobs--
    }
  }

  /**
   * Handle job failure with retry logic
   */
  private async handleJobFailure(job: QueueJob, errorMessage: string) {
    const newAttempts = job.attempts + 1

    if (newAttempts >= job.max_attempts) {
      // Max attempts reached, mark as failed
      await this.serviceClient
        .from('notification_queue')
        .update({
          status: 'failed',
          attempts: newAttempts,
          error_message: errorMessage,
          failed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id!)

      console.log(`💀 Job permanently failed after ${newAttempts} attempts:`, job.id)
    } else {
      // Retry with exponential backoff
      const retryDelay = Math.pow(2, newAttempts) * 60 * 1000 // 2^n minutes
      const scheduledAt = new Date(Date.now() + retryDelay).toISOString()

      await this.serviceClient
        .from('notification_queue')
        .update({
          status: 'retrying',
          attempts: newAttempts,
          error_message: errorMessage,
          scheduled_at: scheduledAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id!)

      console.log(`🔄 Job scheduled for retry ${newAttempts}/${job.max_attempts}:`, job.id)
    }
  }

  /**
   * Update job status
   */
  private async updateJobStatus(jobId: string, status: QueueJob['status']) {
    const updates: Partial<QueueJob> = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'processing') {
      updates.processed_at = new Date().toISOString()
    }

    await this.serviceClient
      .from('notification_queue')
      .update(updates)
      .eq('id', jobId)
  }

  // 🔧 JOB PROCESSORS

  private async processEmailJob(job: QueueJob): Promise<boolean> {
    const emailData = job.payload as EmailJob
    
    // Implement your email sending logic here
    // This is a placeholder - integrate with your email service (SendGrid, AWS SES, etc.)
    
    try {
      console.log('📧 Sending email:', emailData.subject, 'to:', emailData.to)
      
      // Example integration with a hypothetical email service
      /*
      const response = await fetch('/api/internal/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      })
      
      return response.ok
      */
      
      // Mock success for now
      await new Promise(resolve => setTimeout(resolve, 1000))
      return true
      
    } catch (error) {
      console.error('Error sending email:', error)
      return false
    }
  }

  private async processSMSJob(job: QueueJob): Promise<boolean> {
    const smsData = job.payload as SMSJob
    
    try {
      console.log('📱 Sending SMS to:', smsData.phone)
      
      // Implement SMS sending logic (Twilio, AWS SNS, etc.)
      // Mock success for now
      await new Promise(resolve => setTimeout(resolve, 500))
      return true
      
    } catch (error) {
      console.error('Error sending SMS:', error)
      return false
    }
  }

  private async processPushJob(job: QueueJob): Promise<boolean> {
    const pushData = job.payload as PushJob
    
    try {
      console.log('🔔 Sending push notification:', pushData.title)
      
      // Implement push notification logic (FCM, APNS, etc.)
      // Mock success for now
      await new Promise(resolve => setTimeout(resolve, 300))
      return true
      
    } catch (error) {
      console.error('Error sending push notification:', error)
      return false
    }
  }

  private async processWebhookJob(job: QueueJob): Promise<boolean> {
    const webhookData = job.payload as WebhookJob
    
    try {
      console.log('🔗 Calling webhook:', webhookData.url)
      
      const response = await fetch(webhookData.url, {
        method: webhookData.method,
        headers: {
          'Content-Type': 'application/json',
          ...webhookData.headers
        },
        body: webhookData.payload ? JSON.stringify(webhookData.payload) : undefined,
        signal: AbortSignal.timeout(webhookData.timeout || 30000)
      })
      
      return response.ok
      
    } catch (error) {
      console.error('Error calling webhook:', error)
      return false
    }
  }

  /**
   * Clean up old completed/failed jobs
   */
  private async cleanupOldJobs() {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      await this.serviceClient
        .from('notification_queue')
        .delete()
        .in('status', ['completed', 'failed'])
        .lt('updated_at', sevenDaysAgo)

    } catch (error) {
      console.error('Error cleaning up old jobs:', error)
    }
  }

  // 📊 QUEUE STATISTICS

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      const { data, error } = await this.serviceClient
        .from('notification_queue')
        .select('status, type')

      if (error) throw error

      const stats = data?.reduce((acc, job) => {
        acc.total++
        acc.by_status[(job as any).status] = (acc.by_status[(job as any).status] || 0) + 1
        acc.by_type[(job as any).type] = (acc.by_type[(job as any).type] || 0) + 1
        return acc
      }, {
        total: 0,
        by_status: {} as Record<string, number>,
        by_type: {} as Record<string, number>
      })

      return stats
    } catch (error) {
      console.error('Error getting queue stats:', error)
      return null
    }
  }
}

// 🌟 SINGLETON INSTANCE
export const notificationQueue = new NotificationQueue()

// 🎯 CONVENIENCE FUNCTIONS
export const queueEmail = (
  emailData: EmailJob,
  priority?: QueueJob['priority'],
  scheduledAt?: Date
) => notificationQueue.queueEmail(emailData, priority, scheduledAt)

export const queueSMS = (
  smsData: SMSJob,
  priority?: QueueJob['priority'],
  scheduledAt?: Date
) => notificationQueue.queueSMS(smsData, priority, scheduledAt)

export const queuePushNotification = (
  pushData: PushJob,
  priority?: QueueJob['priority']
) => notificationQueue.queuePushNotification(pushData, priority)

export const queueWebhook = (
  webhookData: WebhookJob,
  priority?: QueueJob['priority']
) => notificationQueue.queueWebhook(webhookData, priority)

// 🔥 REACT HOOK for client-side queue management
export function useNotificationQueue() {
  return {
    queueEmail,
    queueSMS,
    queuePushNotification,
    queueWebhook,
    getStats: notificationQueue.getQueueStats.bind(notificationQueue)
  }
}