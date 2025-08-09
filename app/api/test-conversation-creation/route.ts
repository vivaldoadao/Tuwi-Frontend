import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST() {
  try {
    const supabase = getServiceClient()

    console.log('🧪 Testing conversation creation...')

    // Get users with braider role
    const { data: braiders, error: braidersError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('role', 'braider')

    if (braidersError) {
      return NextResponse.json({ success: false, error: braidersError.message })
    }

    // Get users with customer role
    const { data: customers, error: customersError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('role', 'customer')

    if (customersError) {
      return NextResponse.json({ success: false, error: customersError.message })
    }

    // Test conversation creation between a customer and braider
    if (customers && customers.length > 0 && braiders && braiders.length > 0) {
      const customer = customers.find(c => c.email === 'adao_vivaldo@hotmail.com') || customers[0]
      const braider = braiders.find(b => b.email === 'znattechnology95@gmail.com') || braiders[0]

      console.log('👤 Testing conversation between:', {
        customer: customer.email,
        braider: braider.email
      })

      // Test the get_or_create_conversation function
      const { data: conversationId, error: convError } = await supabase
        .rpc('get_or_create_conversation', {
          p_user1_id: customer.id,
          p_user2_id: braider.id
        })

      if (convError) {
        return NextResponse.json({
          success: false,
          error: `Failed to create conversation: ${convError.message}`,
          debug: { customer, braider }
        })
      }

      // Send a test message
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: customer.id,
          content: `🧪 Test message from ${customer.name} to ${braider.name} - ${new Date().toISOString()}`,
          message_type: 'text'
        })
        .select()
        .single()

      return NextResponse.json({
        success: true,
        message: 'Conversation creation test completed',
        results: {
          conversation_id: conversationId,
          test_message: message?.id,
          participants: {
            customer: customer.email,
            braider: braider.email
          },
          message_error: messageError?.message
        },
        all_braiders: braiders.map(b => ({ id: b.id, name: b.name, email: b.email })),
        all_customers: customers.map(c => ({ id: c.id, name: c.name, email: c.email }))
      })
    }

    return NextResponse.json({
      success: true,
      message: 'No suitable users found for testing',
      braiders: braiders?.map(b => ({ id: b.id, name: b.name, email: b.email })) || [],
      customers: customers?.map(c => ({ id: c.id, name: c.name, email: c.email })) || []
    })

  } catch (error) {
    console.error('💥 Test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}