"use client"

import { createContext, useContext, useEffect } from 'react'
import { analytics } from '@/lib/performance-analytics'
import { errorTracker } from '@/lib/error-tracker'
import { useAuth } from '@/context/auth-context'

interface PerformanceContextType {
  trackPageView: typeof analytics.trackPageView
  trackBraiderView: typeof analytics.trackBraiderInteraction
  trackError: typeof errorTracker.trackError
}

const PerformanceContext = createContext<PerformanceContextType | null>(null)

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      errorTracker.setUserContext(user.id, user.email || undefined, user.role || undefined)
    }
  }, [user])

  // Track Core Web Vitals automatically
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Track page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (perfData) {
          analytics.trackPerformance({
            page: window.location.pathname,
            loadTime: perfData.loadEventEnd - perfData.loadEventStart,
            firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
          })
        }
      }, 0)
    })

    // Track page views automatically
    analytics.trackPageView(window.location.pathname, user?.id)

    return () => {
      // Cleanup if needed
    }
  }, [user])

  const contextValue: PerformanceContextType = {
    trackPageView: analytics.trackPageView.bind(analytics),
    trackBraiderView: (braiderId: string, action: any) => 
      analytics.trackBraiderInteraction(braiderId, action, user?.id),
    trackError: errorTracker.trackError.bind(errorTracker),
  }

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  )
}

export function usePerformance() {
  const context = useContext(PerformanceContext)
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider')
  }
  return context
}