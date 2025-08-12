/**
 * SISTEMA DE FEATURE FLAGS - SERVER
 * 
 * Controla ativação/desativação de funcionalidades sem deploy
 * Permite rollout gradual da monetização
 */

import { createClient } from '@/lib/supabase/client'

// Types
export interface FeatureFlags {
  monetizationEnabled: boolean
  commissionBasedPricing: boolean
  subscriptionBasedPricing: boolean
  grandfatherExistingUsers: boolean
  showValueGeneratedDashboard: boolean
  enableTransactionProcessing: boolean
  showMonetizationPreview: boolean
}

export interface PlatformSettings {
  commissionRate: number
  subscriptionPriceEur: number
  freeBookingsLimit: number
  gracePeriodDays: number
  grandfatheredUsers: string[]
}

class FeatureFlagManager {
  private supabase = createClient()
  private cache: Map<string, any> = new Map()
  private cacheExpiry: Map<string, number> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  /**
   * Obter configuração da plataforma
   */
  async getSetting<T = any>(key: string): Promise<T | null> {
    try {
      // Check cache first
      const cached = this.getFromCache(key)
      if (cached !== null) {
        return cached
      }

      const { data, error } = await this.supabase
        .from('platform_settings')
        .select('value')
        .eq('key', key)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error(`Error fetching setting ${key}:`, error)
        return null
      }

      const value = data?.value
      this.setCache(key, value)
      return value
    } catch (error) {
      console.error(`Error in getSetting for ${key}:`, error)
      return null
    }
  }

  /**
   * Atualizar configuração da plataforma
   */
  async updateSetting(key: string, value: any): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('platform_settings')
        .update({ 
          value: value,
          updated_at: new Date().toISOString()
        })
        .eq('key', key)

      if (error) {
        console.error(`Error updating setting ${key}:`, error)
        return false
      }

      // Clear cache
      this.clearCache(key)
      return true
    } catch (error) {
      console.error(`Error in updateSetting for ${key}:`, error)
      return false
    }
  }

  /**
   * Obter todas as feature flags
   */
  async getFeatureFlags(): Promise<FeatureFlags> {
    const defaultFlags: FeatureFlags = {
      monetizationEnabled: false,
      commissionBasedPricing: true,
      subscriptionBasedPricing: false,
      grandfatherExistingUsers: true,
      showValueGeneratedDashboard: true,
      enableTransactionProcessing: false,
      showMonetizationPreview: false
    }

    try {
      const [
        monetizationEnabled,
        commissionBasedPricing,
        subscriptionBasedPricing,
        grandfatherExistingUsers,
        showValueGeneratedDashboard,
        enableTransactionProcessing,
        showMonetizationPreview
      ] = await Promise.all([
        this.getSetting<boolean>('monetization_enabled'),
        this.getSetting<boolean>('commission_based_pricing'),
        this.getSetting<boolean>('subscription_based_pricing'),
        this.getSetting<boolean>('grandfather_existing_users'),
        this.getSetting<boolean>('show_value_generated_dashboard'),
        this.getSetting<boolean>('enable_transaction_processing'),
        this.getSetting<boolean>('show_monetization_preview')
      ])

      return {
        monetizationEnabled: monetizationEnabled ?? defaultFlags.monetizationEnabled,
        commissionBasedPricing: commissionBasedPricing ?? defaultFlags.commissionBasedPricing,
        subscriptionBasedPricing: subscriptionBasedPricing ?? defaultFlags.subscriptionBasedPricing,
        grandfatherExistingUsers: grandfatherExistingUsers ?? defaultFlags.grandfatherExistingUsers,
        showValueGeneratedDashboard: showValueGeneratedDashboard ?? defaultFlags.showValueGeneratedDashboard,
        enableTransactionProcessing: enableTransactionProcessing ?? defaultFlags.enableTransactionProcessing,
        showMonetizationPreview: showMonetizationPreview ?? defaultFlags.showMonetizationPreview
      }
    } catch (error) {
      console.error('Error getting feature flags:', error)
      return defaultFlags
    }
  }

  /**
   * Obter configurações da plataforma
   */
  async getPlatformSettings(): Promise<PlatformSettings> {
    const defaultSettings: PlatformSettings = {
      commissionRate: 0.10,
      subscriptionPriceEur: 10.00,
      freeBookingsLimit: 5,
      gracePeriodDays: 30,
      grandfatheredUsers: []
    }

    try {
      const [
        commissionRate,
        subscriptionPriceEur,
        freeBookingsLimit,
        gracePeriodDays,
        grandfatheredUsers
      ] = await Promise.all([
        this.getSetting<number>('commission_rate'),
        this.getSetting<number>('subscription_price_eur'),
        this.getSetting<number>('free_bookings_limit'),
        this.getSetting<number>('grace_period_days'),
        this.getSetting<string[]>('grandfathered_users')
      ])

      return {
        commissionRate: commissionRate ?? defaultSettings.commissionRate,
        subscriptionPriceEur: subscriptionPriceEur ?? defaultSettings.subscriptionPriceEur,
        freeBookingsLimit: freeBookingsLimit ?? defaultSettings.freeBookingsLimit,
        gracePeriodDays: gracePeriodDays ?? defaultSettings.gracePeriodDays,
        grandfatheredUsers: grandfatheredUsers ?? defaultSettings.grandfatheredUsers
      }
    } catch (error) {
      console.error('Error getting platform settings:', error)
      return defaultSettings
    }
  }

  /**
   * Ativar monetização com configurações
   */
  async enableMonetization(config?: {
    commissionRate?: number
    gracePeriodDays?: number
    enableTransactionProcessing?: boolean
  }): Promise<boolean> {
    try {
      const updates: Array<Promise<boolean>> = [
        this.updateSetting('monetization_enabled', true)
      ]

      if (config?.commissionRate) {
        updates.push(this.updateSetting('commission_rate', config.commissionRate))
      }

      if (config?.gracePeriodDays) {
        updates.push(this.updateSetting('grace_period_days', config.gracePeriodDays))
      }

      if (config?.enableTransactionProcessing !== undefined) {
        updates.push(this.updateSetting('enable_transaction_processing', config.enableTransactionProcessing))
      }

      const results = await Promise.all(updates)
      return results.every(result => result === true)
    } catch (error) {
      console.error('Error enabling monetization:', error)
      return false
    }
  }

  /**
   * Desativar monetização
   */
  async disableMonetization(): Promise<boolean> {
    try {
      const results = await Promise.all([
        this.updateSetting('monetization_enabled', false),
        this.updateSetting('enable_transaction_processing', false)
      ])

      return results.every(result => result === true)
    } catch (error) {
      console.error('Error disabling monetization:', error)
      return false
    }
  }

  /**
   * Verificar se usuário está grandfathered
   */
  async isUserGrandfathered(userId: string): Promise<boolean> {
    try {
      const grandfatheredUsers = await this.getSetting<string[]>('grandfathered_users')
      return grandfatheredUsers?.includes(userId) ?? false
    } catch (error) {
      console.error('Error checking grandfathered status:', error)
      return false
    }
  }

  /**
   * Adicionar usuário à lista de grandfathered
   */
  async addGrandfatheredUser(userId: string): Promise<boolean> {
    try {
      const currentUsers = await this.getSetting<string[]>('grandfathered_users') ?? []
      
      if (!currentUsers.includes(userId)) {
        const updatedUsers = [...currentUsers, userId]
        return await this.updateSetting('grandfathered_users', updatedUsers)
      }

      return true
    } catch (error) {
      console.error('Error adding grandfathered user:', error)
      return false
    }
  }

  // Cache management
  private getFromCache(key: string): any {
    const expiry = this.cacheExpiry.get(key)
    if (!expiry || Date.now() > expiry) {
      this.clearCache(key)
      return null
    }
    return this.cache.get(key) ?? null
  }

  private setCache(key: string, value: any): void {
    this.cache.set(key, value)
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION)
  }

  private clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key)
      this.cacheExpiry.delete(key)
    } else {
      this.cache.clear()
      this.cacheExpiry.clear()
    }
  }
}

// Singleton instance
export const featureFlagManager = new FeatureFlagManager()