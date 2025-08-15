import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 })
    }

    // Verificar se o usuário pode acessar esta informação (deve ser o próprio usuário ou admin)
    if (session.user.email !== email) {
      // Verificar se é admin
      const supabase = await createClient()
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('email', session.user.email)
        .single()
      
      if (userData?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const supabase = await createClient()
    
    // Primeiro, tentar buscar braider pelo contact_email
    let { data: braider, error } = await supabase
      .from('braiders')
      .select('id, name, contact_email, status, years_experience, portfolio_images')
      .eq('contact_email', email)
      .single()

    // Se não encontrar pelo contact_email, buscar pelo user_id através do email do usuário
    if (error) {
      console.log('Braider not found by contact_email, trying by user_id...')
      
      // Buscar user_id pelo email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()
      
      if (userError || !userData) {
        console.error('User not found:', userError)
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      
      // Buscar braider pelo user_id
      const { data: braiderByUserId, error: braiderError } = await supabase
        .from('braiders')
        .select('id, name, contact_email, status, years_experience, portfolio_images')
        .eq('user_id', userData.id)
        .single()
      
      if (braiderError) {
        console.error('Error fetching braider by user_id:', braiderError)
        return NextResponse.json({ error: 'Braider not found' }, { status: 404 })
      }
      
      braider = braiderByUserId
      
      // Se encontrou pelo user_id mas contact_email está incorreto, vamos corrigir
      if (braider.contact_email !== email) {
        console.log('Updating braider contact_email to match user email...')
        const { error: updateError } = await supabase
          .from('braiders')
          .update({ contact_email: email, updated_at: new Date().toISOString() })
          .eq('id', braider.id)
        
        if (updateError) {
          console.error('Error updating braider contact_email:', updateError)
        } else {
          braider.contact_email = email
          console.log('✅ Braider contact_email updated successfully')
        }
      }
    }

    console.log('✅ Braider found by email:', { 
      braiderId: braider.id, 
      email: braider.contact_email,
      name: braider.name 
    })

    return NextResponse.json(braider)

  } catch (error) {
    console.error('Error in braiders by-email API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}