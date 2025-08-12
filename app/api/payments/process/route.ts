import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auth } from '@/lib/auth'
import { processPaymentWithCommission } from '@/lib/stripe-monetization'
import { featureFlagManager } from '@/lib/feature-flags-server'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      bookingId,
      braiderId,
      totalAmount,
      description,
      customerPaymentMethodId
    } = body

    if (!bookingId || !braiderId || !totalAmount) {
      return NextResponse.json({ 
        error: 'Missing required fields: bookingId, braiderId, totalAmount' 
      }, { status: 400 })
    }

    // Verificar se monetização está ativa
    const monetizationEnabled = await featureFlagManager.getSetting<boolean>('monetization_enabled')
    const enableTransactionProcessing = await featureFlagManager.getSetting<boolean>('enable_transaction_processing')

    if (!monetizationEnabled || !enableTransactionProcessing) {
      return NextResponse.json({ 
        error: 'Payment processing is not enabled',
        code: 'MONETIZATION_DISABLED'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar se booking existe e pertence ao usuário
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', session.user.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found or access denied' }, { status: 404 })
    }

    // Verificar se braider existe
    const { data: braider, error: braiderError } = await supabase
      .from('braiders')
      .select('id')
      .eq('id', braiderId)
      .single()

    if (braiderError || !braider) {
      return NextResponse.json({ error: 'Braider not found' }, { status: 404 })
    }

    // Obter taxa de comissão
    const commissionRate = await featureFlagManager.getSetting<number>('commission_rate') || 0.10

    // Processar pagamento
    const result = await processPaymentWithCommission({
      bookingId,
      braiderId,
      totalAmount: parseFloat(totalAmount),
      commissionRate,
      description: description || `Payment for booking ${bookingId}`,
      customerPaymentMethodId
    })

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Payment processing failed' 
      }, { status: 400 })
    }

    // Atualizar booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        payment_status: 'pending',
        stripe_payment_intent_id: result.paymentIntentId,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Error updating booking payment status:', updateError)
    }

    return NextResponse.json({
      success: true,
      paymentIntentId: result.paymentIntentId,
      transferId: result.transferId,
      message: 'Payment processed successfully'
    })

  } catch (error) {
    console.error('Unexpected error in payment processing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}