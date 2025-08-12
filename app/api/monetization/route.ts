import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auth } from '@/lib/auth'

// GET /api/monetization - Obter status da monetização
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get platform settings
    const { data: settings, error: settingsError } = await supabase
      .from('platform_settings')
      .select('key, value')
      .eq('is_active', true)
      .in('key', [
        'monetization_enabled',
        'commission_rate',
        'subscription_price_eur',
        'free_bookings_limit',
        'grace_period_days'
      ])

    if (settingsError) {
      console.error('Error fetching platform settings:', settingsError)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Transform to key-value object
    const platformSettings = (settings || []).reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, any>)

    // Check if user is a braider
    const { data: braider, error: braiderError } = await supabase
      .from('braiders')
      .select('id, user_id')
      .eq('user_id', session.user.id)
      .single()

    if (braiderError && braiderError.code !== 'PGRST116') {
      console.error('Error fetching braider info:', braiderError)
      return NextResponse.json({ error: 'Failed to fetch braider info' }, { status: 500 })
    }

    // Get braider's current subscription if exists
    let subscription = null
    if (braider) {
      const { data: subData, error: subError } = await supabase
        .from('braider_subscriptions')
        .select('*')
        .eq('braider_id', braider.id)
        .single()

      if (subError && subError.code !== 'PGRST116') {
        console.error('Error fetching subscription:', subError)
        return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
      }

      subscription = subData
    }

    // Get current month metrics if braider
    let metrics = null
    if (braider) {
      const currentMonth = new Date()
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
        .toISOString().split('T')[0]

      const { data: metricsData, error: metricsError } = await supabase
        .from('braider_metrics')
        .select('*')
        .eq('braider_id', braider.id)
        .eq('month_year', monthStart)
        .single()

      if (metricsError && metricsError.code !== 'PGRST116') {
        console.error('Error fetching metrics:', metricsError)
      } else {
        metrics = metricsData
      }
    }

    return NextResponse.json({
      monetizationEnabled: platformSettings.monetization_enabled || false,
      commissionRate: platformSettings.commission_rate || 0.10,
      subscriptionPriceEur: platformSettings.subscription_price_eur || 10.00,
      freeBookingsLimit: platformSettings.free_bookings_limit || 5,
      gracePeriodDays: platformSettings.grace_period_days || 30,
      isBraider: !!braider,
      subscription,
      metrics
    })

  } catch (error) {
    console.error('Unexpected error in monetization API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/monetization - Admin: Ativar/desativar monetização
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const supabase = await createClient()
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userError || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      action, // 'enable' | 'disable' | 'update_settings'
      monetizationEnabled,
      commissionRate,
      subscriptionPriceEur,
      gracePeriodDays,
      enableTransactionProcessing 
    } = body

    if (action === 'enable') {
      // Enable monetization
      const updates = []

      updates.push(
        supabase
          .from('platform_settings')
          .update({ value: true, updated_at: new Date().toISOString() })
          .eq('key', 'monetization_enabled')
      )

      if (commissionRate !== undefined) {
        updates.push(
          supabase
            .from('platform_settings')
            .update({ value: commissionRate, updated_at: new Date().toISOString() })
            .eq('key', 'commission_rate')
        )
      }

      if (gracePeriodDays !== undefined) {
        updates.push(
          supabase
            .from('platform_settings')
            .update({ value: gracePeriodDays, updated_at: new Date().toISOString() })
            .eq('key', 'grace_period_days')
        )
      }

      if (enableTransactionProcessing !== undefined) {
        updates.push(
          supabase
            .from('platform_settings')
            .upsert([{
              key: 'enable_transaction_processing',
              value: enableTransactionProcessing,
              description: 'Process real transactions vs simulated',
              is_active: true
            }])
        )
      }

      const results = await Promise.all(updates)
      const hasErrors = results.some(result => result.error)

      if (hasErrors) {
        console.error('Errors enabling monetization:', results.map(r => r.error).filter(Boolean))
        return NextResponse.json({ error: 'Failed to enable monetization' }, { status: 500 })
      }

      return NextResponse.json({ 
        message: 'Monetization enabled successfully',
        monetizationEnabled: true,
        gracePeriodDays: gracePeriodDays || 30
      })

    } else if (action === 'disable') {
      // Disable monetization
      const updates = [
        supabase
          .from('platform_settings')
          .update({ value: false, updated_at: new Date().toISOString() })
          .eq('key', 'monetization_enabled'),
        
        supabase
          .from('platform_settings')
          .update({ value: false, updated_at: new Date().toISOString() })
          .eq('key', 'enable_transaction_processing')
      ]

      const results = await Promise.all(updates)
      const hasErrors = results.some(result => result.error)

      if (hasErrors) {
        console.error('Errors disabling monetization:', results.map(r => r.error).filter(Boolean))
        return NextResponse.json({ error: 'Failed to disable monetization' }, { status: 500 })
      }

      return NextResponse.json({ 
        message: 'Monetization disabled successfully',
        monetizationEnabled: false
      })

    } else if (action === 'update_settings') {
      // Update platform settings
      const updates = []

      if (monetizationEnabled !== undefined) {
        updates.push(
          supabase
            .from('platform_settings')
            .update({ value: monetizationEnabled, updated_at: new Date().toISOString() })
            .eq('key', 'monetization_enabled')
        )
      }

      if (commissionRate !== undefined) {
        updates.push(
          supabase
            .from('platform_settings')
            .update({ value: commissionRate, updated_at: new Date().toISOString() })
            .eq('key', 'commission_rate')
        )
      }

      if (subscriptionPriceEur !== undefined) {
        updates.push(
          supabase
            .from('platform_settings')
            .update({ value: subscriptionPriceEur, updated_at: new Date().toISOString() })
            .eq('key', 'subscription_price_eur')
        )
      }

      if (gracePeriodDays !== undefined) {
        updates.push(
          supabase
            .from('platform_settings')
            .update({ value: gracePeriodDays, updated_at: new Date().toISOString() })
            .eq('key', 'grace_period_days')
        )
      }

      if (updates.length > 0) {
        const results = await Promise.all(updates)
        const hasErrors = results.some(result => result.error)

        if (hasErrors) {
          console.error('Errors updating settings:', results.map(r => r.error).filter(Boolean))
          return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
        }
      }

      return NextResponse.json({ 
        message: 'Settings updated successfully'
      })

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Unexpected error in monetization POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}