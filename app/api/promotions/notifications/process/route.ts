import { NextRequest, NextResponse } from 'next/server'
import { promotionNotificationService } from '@/lib/promotion-notifications'
import { auth } from '@/lib/auth'

/**
 * API para processar notificações automáticas de promoções
 * 
 * GET /api/promotions/notifications/process
 * 
 * Este endpoint deve ser chamado periodicamente (cron job) para:
 * - Verificar promoções expirando
 * - Notificar sobre promoções expiradas
 * - Alertas de baixa performance
 * - Lembretes de renovação
 * - Relatórios semanais
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar se é chamada do sistema/admin ou cron
    const authHeader = request.headers.get('authorization')
    const cronSecret = request.headers.get('x-cron-secret')
    
    // Permitir acesso via cron secret ou admin autenticado
    const isValidCron = cronSecret === process.env.CRON_SECRET
    let isAdmin = false
    
    if (!isValidCron) {
      const session = await auth()
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      // Verificar se é admin (implementar lógica específica)
      isAdmin = session.user.role === 'admin' // Ajustar conforme seu sistema
      
      if (!isAdmin) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    console.log('🔔 Processing promotion notifications...')
    
    // Processar todas as notificações
    const results = await promotionNotificationService.processAllNotifications()
    
    const totalProcessed = Object.values(results).reduce((sum, count) => sum + count, 0)
    
    console.log('✅ Promotion notifications processed:', results)
    
    return NextResponse.json({
      success: true,
      message: `Processed ${totalProcessed} notifications`,
      details: results,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error processing promotion notifications:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process notifications',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * POST /api/promotions/notifications/process
 * 
 * Processar notificações específicas ou forçar processamento
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { 
      force = false, 
      types = ['all'], // ['expiring', 'expired', 'low_performance', 'renewals', 'reports']
      userId = null // Para testar notificações específicas
    } = body
    
    console.log('🔔 Manual promotion notifications processing...', { force, types, userId })
    
    let results
    
    if (types.includes('all')) {
      results = await promotionNotificationService.processAllNotifications()
    } else {
      // Implementar processamento seletivo se necessário
      results = await promotionNotificationService.processAllNotifications()
    }
    
    const totalProcessed = Object.values(results).reduce((sum, count) => sum + count, 0)
    
    return NextResponse.json({
      success: true,
      message: `Manually processed ${totalProcessed} notifications`,
      details: results,
      force,
      types,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error in manual notification processing:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process notifications manually',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}