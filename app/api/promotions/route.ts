import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'

// Service client para contornar RLS quando necessário
const getServiceClient = () => {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Verificar se usuário é admin
async function isAdmin() {
  try {
    const session = await auth()
    return session?.user?.role === 'admin'
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

// GET /api/promotions - Listar promoções (suas próprias ou todas se admin)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const serviceClient = getServiceClient()
    const url = new URL(request.url)
    const type = url.searchParams.get('type') // profile_highlight, hero_banner, combo_package
    const status = url.searchParams.get('status') // pending, active, expired, etc.
    const userId = url.searchParams.get('user_id') // Para admin ver promoções de usuário específico

    let query = serviceClient
      .from('promotions')
      .select(`
        *,
        users!promotions_user_id_fkey(
          id,
          email,
          name,
          role
        ),
        promotion_packages(
          id,
          name,
          type,
          duration_days,
          price,
          features
        )
      `)
      .order('created_at', { ascending: false })

    // Filtros
    if (!await isAdmin()) {
      // Usuários normais veem suas próprias promoções e promoções globais/role direcionadas
      const currentUser = await serviceClient
        .from('users')
        .select('id, role')
        .eq('email', session.user.email)
        .single()
      
      console.log('Current user for filtering:', currentUser.data)
      
      if (currentUser.data) {
        const userRole = currentUser.data.role || 'customer'
        console.log('Filtering for user role:', userRole)
        
        // Simplificar o filtro - usar múltiplas queries OR separadas
        const promotionsPromises = await Promise.all([
          // 1. Promoções próprias do usuário
          serviceClient.from('promotions').select('*').eq('user_id', currentUser.data.id),
          // 2. Promoções globais
          serviceClient.from('promotions').select('*').eq('metadata->>target_type', 'all_users'),
          // 3. Promoções para o role do usuário
          serviceClient.from('promotions').select('*').eq('metadata->>target_type', 'role_group').eq('metadata->>target_value', userRole)
        ])
        
        // Combinar resultados e remover duplicatas
        const allPromotions: any[] = []
        promotionsPromises.forEach(result => {
          if (result.data) {
            allPromotions.push(...result.data)
          }
        })
        
        // Remover duplicatas por ID
        const uniquePromotions = allPromotions.filter((promo, index, self) => 
          index === self.findIndex(p => p.id === promo.id)
        )
        
        console.log('Found promotions:', uniquePromotions.length)
        
        // Para continuar com a query original, vamos usar IDs específicos
        if (uniquePromotions.length > 0) {
          const promotionIds = uniquePromotions.map(p => p.id)
          query = query.in('id', promotionIds)
        } else {
          // Se não há promoções, retornar query vazia
          query = query.eq('id', '00000000-0000-0000-0000-000000000000') // ID que não existe
        }
      }
    } else if (userId) {
      // Admin pode filtrar por usuário específico
      query = query.eq('user_id', userId)
    }

    if (type) {
      query = query.eq('type', type)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: promotions, error } = await query

    if (error) {
      console.error('Error fetching promotions:', error)
      return NextResponse.json({ error: 'Failed to fetch promotions' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      promotions: promotions || []
    })

  } catch (error) {
    console.error('Error in promotions API:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST /api/promotions - Criar nova promoção
export async function POST(request: NextRequest) {
  console.log('=== POST /api/promotions called ===')
  
  try {
    console.log('Starting promotion creation...')
    const session = await auth()
    if (!session?.user?.id) {
      console.log('No session found')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    console.log('Session found:', session.user)
    const serviceClient = getServiceClient()
    
    // Seguir o padrão do sistema: buscar usuário por email em public.users
    const { data: currentUser, error: userError } = await serviceClient
      .from('users')
      .select('id, email, name, role')
      .eq('email', session.user.email)
      .single()

    if (userError || !currentUser) {
      console.error('User not found in public.users:', userError)
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado na base de dados'
      }, { status: 404 })
    }

    console.log('User found in public.users:', currentUser)
    const body = await request.json()
    console.log('Request body:', body)
    
    const {
      type,
      title,
      description,
      start_date,
      end_date,
      content_data = {},
      package_id,
      price,
      duration_days,
      target_type = 'specific_user', // 'all_users', 'specific_user', 'role_group'
      target_value = session.user.email, // email for specific_user, role for role_group, null for all_users
      metadata = {}
    } = body

    // Validar campos obrigatórios
    if (!type || !title || !start_date || !end_date) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: type, title, start_date, end_date'
      }, { status: 400 })
    }

    // Validar tipo
    if (!['profile_highlight', 'hero_banner', 'combo_package'].includes(type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid promotion type'
      }, { status: 400 })
    }

    // Validar datas
    const startDate = new Date(start_date)
    const endDate = new Date(end_date)
    
    if (startDate >= endDate) {
      return NextResponse.json({
        success: false,
        error: 'Start date must be before end date'
      }, { status: 400 })
    }

    // Verificar promoções ativas existentes do mesmo tipo para o usuário
    const { data: existingPromotions } = await serviceClient
      .from('promotions')
      .select('id, title, type, start_date, end_date, status')
      .eq('user_id', currentUser.id)
      .eq('type', type)
      .in('status', ['active', 'pending'])
      .gt('end_date', new Date().toISOString())

    // Regras de negócio por tipo de promoção
    if (existingPromotions && existingPromotions.length > 0) {
      const activePromo = existingPromotions[0]
      const endDate = new Date(activePromo.end_date).toLocaleDateString('pt-BR')
      
      switch (type) {
        case 'profile_highlight':
          return NextResponse.json({
            success: false,
            error: `Você já possui uma promoção de "Destaque de Perfil" ativa até ${endDate}. Apenas uma promoção deste tipo pode estar ativa por vez.`,
            existing_promotion: activePromo,
            suggestion: 'extend_existing'
          }, { status: 409 })
          
        case 'hero_banner':
          console.log(`Warning: User ${currentUser.email} purchasing additional hero banner while having active one until ${endDate}`)
          // Permitir mas adicionar metadata sobre promoção existente
          metadata.has_existing_promotion = true
          metadata.existing_promotion_end = activePromo.end_date
          break
          
        case 'combo_package':
          console.log(`Info: User ${currentUser.email} purchasing additional combo package while having active one until ${endDate}`)
          // Permitir compras múltiplas de combo packages
          metadata.has_existing_promotion = true
          break
      }
    }

    // Validar e determinar targeting
    // TESTE: usar o ID que sabemos que existe em public.users
    let targetUserId = currentUser.id // Default para usuário criador
    
    // Verificar permissões de targeting
    const isTargetingSelf = (target_type === 'specific_user' && target_value === currentUser.email)
    const isAdmin = currentUser.role === 'admin'
    
    // Usuários não-admin só podem criar promoções para si mesmos
    if (!isTargetingSelf && !isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Você só pode criar promoções para si mesmo. Apenas administradores podem criar promoções globais ou para outros usuários.'
      }, { status: 403 })
    }

    // Para targeting específico de outro usuário, validar se o usuário existe
    if (target_type === 'specific_user' && target_value !== currentUser.email) {
      const { data: targetUser } = await serviceClient
        .from('users')
        .select('id, email')
        .eq('email', target_value)
        .single()
      
      if (!targetUser) {
        return NextResponse.json({
          success: false,
          error: `Target user with email ${target_value} not found`
        }, { status: 400 })
      }
      
      // PROBLEMA: targetUser.id é de public.users, mas FK precisa de auth.users.id
      // Por agora, vamos manter o criador e armazenar target em metadata
      console.log('Warning: Using creator ID due to FK constraint, target stored in metadata')
    }
    
    // Para promoções globais ou por role, manter o criador como user_id
    if (target_type === 'all_users' || target_type === 'role_group') {
      targetUserId = currentUser.id
    }

    // SOLUÇÃO CORRETA: usar public.users.id (após correção das FKs)
    console.log('Using public.users.id for FK constraint...')
    
    // Criar promoção com user_id correto de public.users
    const promotionData = {
      user_id: targetUserId, // ID de public.users (correto para NextAuth)
      type,
      title,
      description,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      content_data,
      package_id,
      price: price || 0,
      status: 'pending',
      views_count: 0,
      clicks_count: 0,
      contacts_count: 0,
      metadata: {
        ...metadata,
        target_type,
        target_value,
        created_by: currentUser.id, // Para saber quem criou a promoção (public.users.id)
        created_by_auth: session.user.id, // ID do auth.users
        target_user_id: targetUserId, // O user_id real para targeting
        is_global: target_type === 'all_users', // Flag para indicar se é global
        duration_days: duration_days || Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) // Armazenar em metadata
      }
    }

    console.log('Promotion data to insert:', promotionData)
    
    const { data: promotion, error } = await serviceClient
      .from('promotions')
      .insert(promotionData)
      .select()
      .single()

    if (error) {
      console.error('Error creating promotion:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to create promotion',
        details: error.message
      }, { status: 500 })
    }

    console.log('Promotion created successfully:', promotion)

    return NextResponse.json({
      success: true,
      message: 'Promotion created successfully',
      promotion
    })

  } catch (error) {
    console.error('Error in POST promotions API:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: errorMessage
    }, { status: 500 })
  }
}