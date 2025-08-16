/**
 * SISTEMA DE FEATURE FLAGS - CLIENT HOOKS
 * 
 * Hooks React para usar o sistema de feature flags no cliente
 */

"use client"

import { useEffect, useState } from 'react'
import { featureFlagManager, FeatureFlags, PlatformSettings } from '@/lib/feature-flags-server'

// React hooks
export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFlags() {
      try {
        const flagsData = await featureFlagManager.getFeatureFlags()
        setFlags(flagsData)
      } catch (error) {
        console.error('Error loading feature flags:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFlags()
  }, [])

  return { flags, loading, refresh: async () => {
    setLoading(true)
    const flagsData = await featureFlagManager.getFeatureFlags()
    setFlags(flagsData)
    setLoading(false)
  }}
}

export function usePlatformSettings() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSettings() {
      try {
        const settingsData = await featureFlagManager.getPlatformSettings()
        setSettings(settingsData)
      } catch (error) {
        console.error('Error loading platform settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  return { settings, loading, refresh: async () => {
    setLoading(true)
    const settingsData = await featureFlagManager.getPlatformSettings()
    setSettings(settingsData)
    setLoading(false)
  }}
}

// Utility hooks
export function useMonetization() {
  const { flags, loading } = useFeatureFlags()
  const { settings } = usePlatformSettings()

  return {
    isEnabled: flags?.monetizationEnabled ?? false,
    showDashboard: flags?.showValueGeneratedDashboard ?? true,
    showPreview: flags?.showMonetizationPreview ?? false,
    commissionRate: settings?.commissionRate ?? 0.10,
    gracePeriodDays: settings?.gracePeriodDays ?? 30,
    loading
  }
}