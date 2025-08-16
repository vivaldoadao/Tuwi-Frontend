/**
 * 📊 ANALYTICS & PERFORMANCE TRACKER
 * Sistema completo de analytics para o Wilnara Tranças
 */

import { createClient } from '@/lib/supabase/client'
import type { Braider, Service, Product } from '@/lib/data'

// Types para eventos de analytics
export interface AnalyticsEvent {
  event_name: string
  user_id?: string
  session_id?: string
  properties: Record<string, any>
  timestamp: string
  page_url?: string
  referrer?: string
  user_agent?: string
}

export interface PageView {
  page: string
  user_id?: string
  session_id: string
  timestamp: string
  duration?: number
  referrer?: string
}

export interface BraiderInteraction {
  braider_id: string
  user_id?: string
  action: 'view' | 'favorite' | 'contact' | 'book' | 'share'
  timestamp: string
  session_id: string
}

export interface BookingMetrics {
  braider_id: string
  service_id?: string
  user_id: string
  booking_value: number
  conversion_source: string
  timestamp: string
}

class PerformanceAnalytics {
  private supabase = createClient()
  private sessionId: string
  private pageStartTime: number = Date.now()

  constructor() {
    this.sessionId = this.generateSessionId()
    this.initializeTracking()
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeTracking() {
    // Track page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.trackPageExit()
        }
      })

      // Track beforeunload for precise timing
      window.addEventListener('beforeunload', () => {
        this.trackPageExit()
      })
    }
  }

  // 📈 CORE TRACKING METHODS

  /**
   * Track page views with performance metrics
   */
  trackPageView(page: string, userId?: string, metadata?: Record<string, any>) {
    const pageView = {
      page,
      user_id: userId,
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      ...metadata
    }

    this.sendEvent('page_view', pageView)
    this.pageStartTime = Date.now()

    console.log('📊 Page view tracked:', page)
  }

  /**
   * Track page exit with duration
   */
  private trackPageExit() {
    if (typeof window === 'undefined') return
    
    const duration = Date.now() - this.pageStartTime
    
    this.sendEvent('page_exit', {
      page: window.location.pathname,
      session_id: this.sessionId,
      duration,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Track braider interactions
   */
  trackBraiderInteraction(
    braiderId: string, 
    action: BraiderInteraction['action'], 
    userId?: string,
    metadata?: Record<string, any>
  ) {
    const interaction: BraiderInteraction = {
      braider_id: braiderId,
      user_id: userId,
      action,
      session_id: this.sessionId,
      timestamp: new Date().toISOString()
    }

    this.sendEvent('braider_interaction', { ...interaction, ...metadata })
    
    // Update braider metrics in database
    this.updateBraiderMetrics(braiderId, action)

    console.log(`📊 Braider ${action} tracked:`, braiderId)
  }

  /**
   * Track booking conversions
   */
  trackBookingConversion(
    braiderId: string,
    serviceId: string,
    userId: string,
    bookingValue: number,
    conversionSource: string = 'organic'
  ) {
    const booking: BookingMetrics = {
      braider_id: braiderId,
      service_id: serviceId,
      user_id: userId,
      booking_value: bookingValue,
      conversion_source: conversionSource,
      timestamp: new Date().toISOString()
    }

    this.sendEvent('booking_conversion', booking)
    
    // Update conversion metrics
    this.updateConversionMetrics(braiderId, bookingValue)

    console.log('📊 Booking conversion tracked:', booking)
  }

  /**
   * Track product views and interactions
   */
  trackProductInteraction(
    productId: string, 
    action: 'view' | 'add_to_cart' | 'purchase', 
    userId?: string,
    metadata?: Record<string, any>
  ) {
    this.sendEvent('product_interaction', {
      product_id: productId,
      user_id: userId,
      action,
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      ...metadata
    })

    console.log(`📊 Product ${action} tracked:`, productId)
  }

  /**
   * Track search queries and results
   */
  trackSearch(query: string, resultsCount: number, userId?: string) {
    this.sendEvent('search', {
      query,
      results_count: resultsCount,
      user_id: userId,
      session_id: this.sessionId,
      timestamp: new Date().toISOString()
    })

    console.log('📊 Search tracked:', query, resultsCount)
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metrics: {
    page: string
    loadTime: number
    firstContentfulPaint?: number
    largestContentfulPaint?: number
    cumulativeLayoutShift?: number
  }) {
    this.sendEvent('performance', {
      ...metrics,
      session_id: this.sessionId,
      timestamp: new Date().toISOString()
    })

    console.log('📊 Performance tracked:', metrics)
  }

  // 📊 DATABASE OPERATIONS

  /**
   * Update braider metrics in real-time
   */
  async updateBraiderMetrics(braiderId: string, action: string) {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
      
      const updates: Record<string, number> = {}
      
      switch (action) {
        case 'view':
          updates.profile_views = 1
          break
        case 'contact':
          updates.contact_attempts = 1
          break
      }

      if (Object.keys(updates).length > 0) {
        // Usar um update direto se não houver RPC
        const { data: existingMetric } = await this.supabase
          .from('braider_metrics')
          .select('id, profile_views, contact_attempts')
          .eq('braider_id', braiderId)
          .eq('month_year', currentMonth)
          .single()

        if (existingMetric) {
          await this.supabase
            .from('braider_metrics')
            .update({
              profile_views: (existingMetric.profile_views || 0) + (updates.profile_views || 0),
              contact_attempts: (existingMetric.contact_attempts || 0) + (updates.contact_attempts || 0),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingMetric.id)
        } else {
          // Create new metric record
          await this.supabase
            .from('braider_metrics')
            .insert({
              braider_id: braiderId,
              month_year: currentMonth,
              ...updates
            })
        }
      }
    } catch (error) {
      console.error('Error updating braider metrics:', error)
    }
  }

  /**
   * Update conversion metrics
   */
  async updateConversionMetrics(braiderId: string, value: number) {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
      
      const { data: existingMetric } = await this.supabase
        .from('braider_metrics')
        .select('id, total_bookings, total_revenue')
        .eq('braider_id', braiderId)
        .eq('month_year', currentMonth)
        .single()

      if (existingMetric) {
        await this.supabase
          .from('braider_metrics')
          .update({
            total_bookings: (existingMetric.total_bookings || 0) + 1,
            total_revenue: (existingMetric.total_revenue || 0) + value,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingMetric.id)
      }
    } catch (error) {
      console.error('Error updating conversion metrics:', error)
    }
  }

  /**
   * Get braider analytics
   */
  async getBraiderMetrics(braiderId: string, monthYear?: string) {
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

      return data || null
    } catch (error) {
      console.error('Error in getBraiderMetrics:', error)
      return null
    }
  }

  /**
   * Get platform analytics summary
   */
  async getPlatformMetrics() {
    try {
      const { data, error } = await this.supabase
        .from('braider_metrics')
        .select(`
          braider_id,
          total_bookings,
          completed_bookings,
          total_revenue,
          profile_views,
          contact_attempts,
          conversion_rate
        `)
        .gte('month_year', this.getCurrentMonthStart())

      if (error) {
        console.error('Error fetching platform metrics:', error)
        return null
      }

      // Aggregate metrics
      const summary = data?.reduce((acc, metric) => ({
        totalBookings: acc.totalBookings + (metric.total_bookings || 0),
        totalRevenue: acc.totalRevenue + (metric.total_revenue || 0),
        totalViews: acc.totalViews + (metric.profile_views || 0),
        totalContacts: acc.totalContacts + (metric.contact_attempts || 0),
        activeBraiders: acc.activeBraiders + 1
      }), {
        totalBookings: 0,
        totalRevenue: 0,
        totalViews: 0,
        totalContacts: 0,
        activeBraiders: 0
      })

      return summary
    } catch (error) {
      console.error('Error getting platform metrics:', error)
      return null
    }
  }

  // 🚀 HELPER METHODS

  private getCurrentMonthStart(): string {
    const now = new Date()
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`
  }

  private async sendEvent(eventName: string, data: Record<string, any>) {
    try {
      // In production, you might want to batch these events
      // or send to external analytics service (Google Analytics, Mixpanel, etc.)
      
      if (process.env.NODE_ENV === 'production') {
        // For now, just log events. In production, store in separate analytics table
        console.log('📊 Analytics Event:', eventName, data)
      }

      // Send to external analytics services
      this.sendToExternalServices(eventName, data)

    } catch (error) {
      console.error('Error sending analytics event:', error)
    }
  }

  private sendToExternalServices(eventName: string, data: Record<string, any>) {
    try {
      // Google Analytics 4
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', eventName, data)
      }

      // PostHog
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture(eventName, data)
      }

      // Custom webhooks or APIs
      if (process.env.NEXT_PUBLIC_ANALYTICS_WEBHOOK) {
        fetch(process.env.NEXT_PUBLIC_ANALYTICS_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: eventName, data })
        }).catch(console.error)
      }

    } catch (error) {
      console.error('Error sending to external analytics:', error)
    }
  }
}

// 🌟 SINGLETON INSTANCE
export const analytics = new PerformanceAnalytics()

// 🎯 CONVENIENCE FUNCTIONS
export const trackPageView = (page: string, userId?: string, metadata?: Record<string, any>) => 
  analytics.trackPageView(page, userId, metadata)

export const trackBraiderView = (braiderId: string, userId?: string) => 
  analytics.trackBraiderInteraction(braiderId, 'view', userId)

export const trackBraiderFavorite = (braiderId: string, userId?: string) => 
  analytics.trackBraiderInteraction(braiderId, 'favorite', userId)

export const trackBraiderContact = (braiderId: string, userId?: string) => 
  analytics.trackBraiderInteraction(braiderId, 'contact', userId)

export const trackBooking = (braiderId: string, serviceId: string, userId: string, value: number) => 
  analytics.trackBookingConversion(braiderId, serviceId, userId, value)

export const trackSearch = (query: string, resultsCount: number, userId?: string) => 
  analytics.trackSearch(query, resultsCount, userId)

export const trackPerformance = (metrics: Parameters<typeof analytics.trackPerformance>[0]) => 
  analytics.trackPerformance(metrics)

// 🔥 REACT HOOK for easy integration
export function useAnalytics() {
  return {
    trackPageView,
    trackBraiderView,
    trackBraiderFavorite,
    trackBraiderContact,
    trackBooking,
    trackSearch,
    trackPerformance
  }
}