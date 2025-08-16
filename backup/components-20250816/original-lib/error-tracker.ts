/**
 * 🚨 ERROR TRACKING SYSTEM
 * Sistema estruturado de tracking de erros para o Wilnara Tranças
 */

import { createClient } from '@/lib/supabase/client'

export interface ErrorLog {
  id?: string
  error_message: string
  error_stack?: string
  error_name: string
  user_id?: string
  session_id?: string
  page_url: string
  user_agent: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'frontend' | 'api' | 'database' | 'auth' | 'payment' | 'booking'
  context?: Record<string, any>
  resolved?: boolean
}

export interface PerformanceIssue {
  page: string
  metric_name: string
  metric_value: number
  threshold: number
  user_id?: string
  timestamp: string
  device_info: Record<string, any>
}

class ErrorTracker {
  private supabase = createClient()
  private sessionId: string
  private errorQueue: ErrorLog[] = []
  private maxQueueSize = 50
  private flushInterval = 10000 // 10 seconds

  constructor() {
    this.sessionId = this.generateSessionId()
    this.initializeErrorTracking()
    this.startPerformanceMonitoring()
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeErrorTracking() {
    if (typeof window === 'undefined') return

    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError(event.error || new Error(event.message), 'high', 'frontend', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    })

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`), 
        'high', 
        'frontend',
        { reason: event.reason }
      )
    })

    // Flush error queue periodically
    setInterval(() => {
      this.flushErrorQueue()
    }, this.flushInterval)

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushErrorQueue()
    })
  }

  private startPerformanceMonitoring() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

    // Monitor Core Web Vitals
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.handlePerformanceEntry(entry)
        })
      })

      observer.observe({ 
        entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] 
      })
    } catch (error) {
      console.warn('Performance monitoring not supported:', error)
    }
  }

  private handlePerformanceEntry(entry: PerformanceEntry) {
    const thresholds = {
      'largest-contentful-paint': 2500, // 2.5s
      'first-input': 100, // 100ms
      'layout-shift': 0.1 // CLS score
    }

    const threshold = thresholds[entry.entryType as keyof typeof thresholds]
    const value = (entry as any).value || (entry as any).startTime

    if (threshold && value > threshold) {
      this.trackPerformanceIssue({
        page: window.location.pathname,
        metric_name: entry.entryType,
        metric_value: value,
        threshold,
        timestamp: new Date().toISOString(),
        device_info: this.getDeviceInfo()
      })
    }
  }

  // 🚨 PUBLIC METHODS

  /**
   * Track application errors with context
   */
  trackError(
    error: Error | string,
    severity: ErrorLog['severity'] = 'medium',
    category: ErrorLog['category'] = 'frontend',
    context?: Record<string, any>
  ) {
    const errorObj = typeof error === 'string' ? new Error(error) : error
    
    const errorLog: ErrorLog = {
      error_message: errorObj.message,
      error_stack: errorObj.stack,
      error_name: errorObj.name,
      session_id: this.sessionId,
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: new Date().toISOString(),
      severity,
      category,
      context,
      resolved: false
    }

    // Add to queue for batch processing
    this.errorQueue.push(errorLog)

    // Immediate flush for critical errors
    if (severity === 'critical') {
      this.flushErrorQueue()
    }

    // Trim queue if too large
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize)
    }

    console.error(`🚨 [${severity.toUpperCase()}] ${category}:`, errorObj.message, context)
  }

  /**
   * Track API errors with request context
   */
  trackAPIError(
    endpoint: string,
    method: string,
    status: number,
    responseData?: any,
    requestData?: any
  ) {
    this.trackError(
      `API Error: ${method} ${endpoint} returned ${status}`,
      status >= 500 ? 'high' : 'medium',
      'api',
      {
        endpoint,
        method,
        status,
        response: responseData,
        request: requestData,
        timestamp: new Date().toISOString()
      }
    )
  }

  /**
   * Track database errors
   */
  trackDatabaseError(
    operation: string,
    table: string,
    error: Error,
    query?: string
  ) {
    this.trackError(
      `Database Error: ${operation} on ${table} - ${error.message}`,
      'high',
      'database',
      {
        operation,
        table,
        query,
        error_code: (error as any).code,
        error_details: (error as any).details
      }
    )
  }

  /**
   * Track authentication errors
   */
  trackAuthError(
    action: 'login' | 'register' | 'logout' | 'refresh',
    error: Error,
    userId?: string
  ) {
    this.trackError(
      `Auth Error: ${action} failed - ${error.message}`,
      action === 'login' ? 'medium' : 'high',
      'auth',
      {
        action,
        user_id: userId,
        error_code: (error as any).code
      }
    )
  }

  /**
   * Track payment errors
   */
  trackPaymentError(
    action: 'create_intent' | 'confirm_payment' | 'webhook',
    error: Error,
    amount?: number,
    currency?: string
  ) {
    this.trackError(
      `Payment Error: ${action} failed - ${error.message}`,
      'critical',
      'payment',
      {
        action,
        amount,
        currency,
        error_code: (error as any).code,
        stripe_error: (error as any).type
      }
    )
  }

  /**
   * Track booking errors
   */
  trackBookingError(
    action: 'create' | 'update' | 'cancel',
    error: Error,
    bookingData?: any
  ) {
    this.trackError(
      `Booking Error: ${action} failed - ${error.message}`,
      'high',
      'booking',
      {
        action,
        booking_data: bookingData,
        error_details: (error as any).details
      }
    )
  }

  /**
   * Track performance issues
   */
  trackPerformanceIssue(issue: PerformanceIssue) {
    console.warn(`⚡ Performance Issue:`, issue)
    
    // Store performance issues separately or include in error log
    this.trackError(
      `Performance Issue: ${issue.metric_name} (${issue.metric_value}ms) exceeded threshold (${issue.threshold}ms)`,
      'low',
      'frontend',
      {
        performance_issue: true,
        ...issue
      }
    )
  }

  /**
   * Set user context for error tracking
   */
  setUserContext(userId: string, userEmail?: string, userRole?: string) {
    // Update session with user info
    this.errorQueue.forEach(error => {
      if (!error.user_id) {
        error.user_id = userId
        error.context = {
          ...error.context,
          user_email: userEmail,
          user_role: userRole
        }
      }
    })
  }

  /**
   * Get error statistics
   */
  async getErrorStats(timeframe: 'hour' | 'day' | 'week' = 'day') {
    try {
      const hoursBack = {
        hour: 1,
        day: 24,
        week: 168
      }[timeframe]

      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()

      const { data, error } = await this.supabase
        .from('error_logs')
        .select('severity, category, resolved')
        .gte('timestamp', since)

      if (error) throw error

      const stats = data?.reduce((acc, log) => {
        acc.total++
        acc.by_severity[log.severity] = (acc.by_severity[log.severity] || 0) + 1
        acc.by_category[log.category] = (acc.by_category[log.category] || 0) + 1
        if (log.resolved) acc.resolved++
        return acc
      }, {
        total: 0,
        resolved: 0,
        by_severity: {} as Record<string, number>,
        by_category: {} as Record<string, number>
      })

      return stats
    } catch (error) {
      console.error('Error fetching error stats:', error)
      return null
    }
  }

  // 🔧 PRIVATE METHODS

  private async flushErrorQueue() {
    if (this.errorQueue.length === 0) return

    try {
      const errorsToFlush = [...this.errorQueue]
      this.errorQueue = []

      if (process.env.NODE_ENV === 'production') {
        // In production, store in database
        const { error } = await this.supabase
          .from('error_logs')
          .insert(errorsToFlush)

        if (error) {
          console.error('Error storing error logs:', error)
          // Re-add to queue on failure
          this.errorQueue.unshift(...errorsToFlush)
        }
      } else {
        // In development, just log
        console.group('🚨 Error Queue Flush')
        errorsToFlush.forEach(error => {
          console.error(`[${error.severity.toUpperCase()}] ${error.category}:`, error.error_message)
        })
        console.groupEnd()
      }

      // Send to external error tracking services
      this.sendToExternalServices(errorsToFlush)

    } catch (error) {
      console.error('Error flushing error queue:', error)
    }
  }

  private sendToExternalServices(errors: ErrorLog[]) {
    try {
      // Sentry
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        errors.forEach(error => {
          (window as any).Sentry.captureException(new Error(error.error_message), {
            tags: {
              severity: error.severity,
              category: error.category,
            },
            contexts: {
              error_context: error.context,
            },
            user: error.user_id ? { id: error.user_id } : undefined,
          })
        })
      }

      // Custom webhook
      if (process.env.NEXT_PUBLIC_ERROR_WEBHOOK) {
        fetch(process.env.NEXT_PUBLIC_ERROR_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ errors })
        }).catch(console.error)
      }

    } catch (error) {
      console.error('Error sending to external error services:', error)
    }
  }

  private getDeviceInfo() {
    if (typeof window === 'undefined') return {}

    return {
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      color_depth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      connection: (navigator as any).connection ? {
        effective_type: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink
      } : null
    }
  }
}

// 🌟 SINGLETON INSTANCE
export const errorTracker = new ErrorTracker()

// 🎯 CONVENIENCE FUNCTIONS
export const trackError = (
  error: Error | string,
  severity?: ErrorLog['severity'],
  category?: ErrorLog['category'],
  context?: Record<string, any>
) => errorTracker.trackError(error, severity, category, context)

export const trackAPIError = (
  endpoint: string,
  method: string,
  status: number,
  responseData?: any,
  requestData?: any
) => errorTracker.trackAPIError(endpoint, method, status, responseData, requestData)

export const trackDatabaseError = (
  operation: string,
  table: string,
  error: Error,
  query?: string
) => errorTracker.trackDatabaseError(operation, table, error, query)

export const trackAuthError = (
  action: Parameters<typeof errorTracker.trackAuthError>[0],
  error: Error,
  userId?: string
) => errorTracker.trackAuthError(action, error, userId)

export const trackPaymentError = (
  action: Parameters<typeof errorTracker.trackPaymentError>[0],
  error: Error,
  amount?: number,
  currency?: string
) => errorTracker.trackPaymentError(action, error, amount, currency)

export const trackBookingError = (
  action: Parameters<typeof errorTracker.trackBookingError>[0],
  error: Error,
  bookingData?: any
) => errorTracker.trackBookingError(action, error, bookingData)

// 🔥 REACT HOOK for easy integration
export function useErrorTracking() {
  return {
    trackError,
    trackAPIError,
    trackDatabaseError,
    trackAuthError,
    trackPaymentError,
    trackBookingError,
    setUserContext: errorTracker.setUserContext.bind(errorTracker),
    getErrorStats: errorTracker.getErrorStats.bind(errorTracker)
  }
}