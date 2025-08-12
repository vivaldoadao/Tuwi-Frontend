import { NextRequest, NextResponse } from 'next/server'
import { promotionNotificationService } from '@/lib/promotion-notifications'
import { auth } from '@/lib/auth'
import { createServerClient } from '@supabase/ssr'

/**
 * API para testar o sistema de notificações de promoções
 * 
 * GET /api/promotions/notifications/test
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Verificar se é admin
    const isAdmin = session.user.role === 'admin' // Ajustar conforme seu sistema
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Criar cliente server para operações admin
    const supabase = createServerClient(
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

    console.log('🧪 Testing promotion notifications system...')

    // 1. Verificar se existem promoções para testar
    const { data: promotions, error } = await supabase
      .from('promotions')
      .select('id, user_id, title, type, status, start_date, end_date')
      .limit(5)

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch promotions for testing',
        details: error.message
      }, { status: 500 })
    }

    // 2. Testar configurações de notificação
    const notificationConfig = await promotionNotificationService['getNotificationConfig']()
    
    // 3. Criar uma notificação de teste
    const testUserId = session.user.id
    const testNotification = {
      user_id: testUserId,
      promotion_id: promotions?.[0]?.id || null,
      type: 'test_notification',
      title: 'Teste do Sistema de Notificações',
      message: 'Este é um teste do sistema de notificações de promoções.',
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
        original_type: 'test'
      }
    }

    // Usar método privado através de bracket notation
    await promotionNotificationService['createInAppNotification'](testNotification)

    // 4. Verificar contadores atuais
    const results = {
      promotions_found: promotions?.length || 0,
      promotion_samples: promotions?.map(p => ({
        id: p.id,
        title: p.title,
        type: p.type,
        status: p.status
      })) || [],
      notification_config: notificationConfig,
      test_notification_created: true
    }

    return NextResponse.json({
      success: true,
      message: 'Notification system test completed',
      results,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error testing promotion notifications:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to test notification system',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * POST /api/promotions/notifications/test
 * 
 * Criar notificações de teste específicas
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const isAdmin = session.user.role === 'admin'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      type = 'expiring',
      userId = session.user.id,
      promotionId = null,
      mockData = {}
    } = body

    console.log('🧪 Creating test notification...', { type, userId, promotionId })

    // Dados mock para diferentes tipos de teste
    const mockPromotions = {
      expiring: {
        user_id: userId,
        user_email: 'test@example.com',
        user_name: 'Usuário Teste',
        id: promotionId || 'test-promo-id',
        title: 'Promoção de Teste',
        type: 'profile_highlight',
        days_left: 2
      },
      expired: {
        user_id: userId,
        id: promotionId || 'test-promo-id',
        title: 'Promoção Expirada Teste',
        type: 'hero_banner',
        views_count: 150,
        clicks_count: 12,
        conversions_count: 3
      },
      low_performance: {
        user_id: userId,
        id: promotionId || 'test-promo-id',
        title: 'Promoção Performance Teste',
        type: 'profile_highlight',
        ...mockData
      }
    }

    // Simular processamento baseado no tipo
    let result: any = null

    switch (type) {
      case 'expiring':
        await promotionNotificationService['sendExpiringNotification'](
          mockPromotions.expiring
        )
        result = 'Expiring notification sent'
        break
        
      case 'expired':
        await promotionNotificationService['sendExpiredNotification'](
          mockPromotions.expired
        )
        result = 'Expired notification sent'
        break
        
      case 'low_performance':
        await promotionNotificationService['sendLowPerformanceAlert'](
          mockPromotions.low_performance,
          { ctr: 1.5, roi: 5.0 }
        )
        result = 'Low performance alert sent'
        break
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid test type',
          availableTypes: ['expiring', 'expired', 'low_performance']
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Test notification created: ${type}`,
      type,
      userId,
      promotionId,
      result,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error creating test notification:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create test notification',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}