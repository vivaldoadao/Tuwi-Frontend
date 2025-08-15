/**
 * 🔒 SECURITY MODULE: Ownership Validation
 * 
 * Funções críticas para validar se um usuário tem permissão para acessar recursos
 */

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export class UnauthorizedError extends Error {
  constructor(message: string, public details?: Record<string, any>) {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export interface ValidationResult {
  isValid: boolean
  error?: string
  details?: Record<string, any>
}

/**
 * Valida se um usuário é proprietário de um agendamento (usando email como padrão do sistema)
 */
export async function validateBookingOwnership(
  sessionUserId: string, 
  bookingId: string,
  sessionUserEmail?: string
): Promise<ValidationResult> {
  try {
    const serviceSupabase = getServiceClient()
    
    // Se não temos email, tenta buscar no auth
    if (!sessionUserEmail) {
      try {
        const { data: userData, error: userError } = await serviceSupabase.auth.admin.getUserById(sessionUserId)
        sessionUserEmail = userData?.user?.email
        if (!sessionUserEmail) {
          console.warn('⚠️ Could not get user email from auth, falling back to user table')
          const { data: userRecord } = await serviceSupabase
            .from('users')
            .select('email')
            .eq('id', sessionUserId)
            .single()
          sessionUserEmail = userRecord?.email
        }
      } catch (authError) {
        console.warn('⚠️ Error getting user email from auth:', authError)
      }
    }
    
    if (!sessionUserEmail) {
      return {
        isValid: false,
        error: 'Email do usuário não encontrado',
        details: { sessionUserId }
      }
    }
    
    // Buscar booking com dados do braider usando email (padrão do sistema)
    const { data: booking, error } = await serviceSupabase
      .from('bookings')
      .select(`
        id,
        braider_id,
        braiders(
          id,
          contact_email,
          name
        )
      `)
      .eq('id', bookingId)
      .single()

    if (error || !booking) {
      console.error('❌ Booking not found for ownership validation:', { bookingId, error })
      return {
        isValid: false,
        error: 'Agendamento não encontrado',
        details: { bookingId, error: error?.message }
      }
    }

    // Verificar se o email da sessão corresponde ao email da trancista
    const braider = Array.isArray(booking.braiders) ? booking.braiders[0] : booking.braiders
    if (!braider) {
      return {
        isValid: false,
        error: 'Dados da trancista não encontrados',
        details: { bookingId }
      }
    }
    
    const braiderEmail = braider.contact_email
    if (sessionUserEmail !== braiderEmail) {
      console.error('🚨 OWNERSHIP VIOLATION:', {
        sessionUserId,
        sessionUserEmail,
        braiderEmail,
        bookingId,
        braiderName: braider.name,
        timestamp: new Date().toISOString()
      })
      
      return {
        isValid: false,
        error: 'Acesso negado: você não tem permissão para acessar este agendamento',
        details: {
          sessionUserId,
          sessionUserEmail,
          braiderEmail,
          bookingId,
          violation: 'ownership_mismatch'
        }
      }
    }

    console.log('✅ Booking ownership validated successfully:', {
      sessionUserId,
      sessionUserEmail,
      bookingId,
      braiderName: braider.name
    })

    return { isValid: true }
    
  } catch (error) {
    console.error('💥 Error validating booking ownership:', error)
    return {
      isValid: false,
      error: 'Erro interno de validação de segurança',
      details: { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}

/**
 * Valida se um usuário é proprietário de uma trancista
 */
export async function validateBraiderOwnership(
  sessionUserId: string,
  braiderId: string
): Promise<ValidationResult> {
  try {
    const serviceSupabase = getServiceClient()
    
    const { data: braider, error } = await serviceSupabase
      .from('braiders')
      .select('id, user_id, name')
      .eq('id', braiderId)
      .single()

    if (error || !braider) {
      return {
        isValid: false,
        error: 'Perfil de trancista não encontrado',
        details: { braiderId, error: error?.message }
      }
    }

    if (sessionUserId !== braider.user_id) {
      console.error('🚨 BRAIDER OWNERSHIP VIOLATION:', {
        sessionUserId,
        braiderUserId: braider.user_id,
        braiderId,
        braiderName: braider.name,
        timestamp: new Date().toISOString()
      })
      
      return {
        isValid: false,
        error: 'Acesso negado: você não tem permissão para acessar este perfil',
        details: {
          sessionUserId,
          braiderUserId: braider.user_id,
          braiderId,
          violation: 'braider_ownership_mismatch'
        }
      }
    }

    return { isValid: true }
    
  } catch (error) {
    console.error('💥 Error validating braider ownership:', error)
    return {
      isValid: false,
      error: 'Erro interno de validação de segurança',
      details: { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}

/**
 * Valida se um usuário pode acessar dados de disponibilidade
 */
export async function validateAvailabilityAccess(
  sessionUserId: string,
  availabilityId: string
): Promise<ValidationResult> {
  try {
    const serviceSupabase = getServiceClient()
    
    const { data: availability, error } = await serviceSupabase
      .from('braider_availability')
      .select(`
        id,
        braider_id,
        braiders!inner(
          id,
          user_id,
          name
        )
      `)
      .eq('id', availabilityId)
      .single()

    if (error || !availability) {
      return {
        isValid: false,
        error: 'Horário de disponibilidade não encontrado',
        details: { availabilityId, error: error?.message }
      }
    }

    const braider = Array.isArray(availability.braiders) ? availability.braiders[0] : availability.braiders
    if (!braider) {
      return {
        isValid: false,
        error: 'Dados da trancista não encontrados',
        details: { availabilityId }
      }
    }

    if (sessionUserId !== braider.user_id) {
      console.error('🚨 AVAILABILITY ACCESS VIOLATION:', {
        sessionUserId,
        braiderUserId: braider.user_id,
        availabilityId,
        timestamp: new Date().toISOString()
      })
      
      return {
        isValid: false,
        error: 'Acesso negado: você não pode modificar a disponibilidade de outra trancista',
        details: {
          sessionUserId,
          braiderUserId: braider.user_id,
          availabilityId,
          violation: 'availability_access_denied'
        }
      }
    }

    return { isValid: true }
    
  } catch (error) {
    console.error('💥 Error validating availability access:', error)
    return {
      isValid: false,
      error: 'Erro interno de validação de segurança',
      details: { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}

/**
 * Helper para criar resposta HTTP de erro de autorização
 */
export function createUnauthorizedResponse(
  message: string = 'Acesso negado',
  details?: Record<string, any>
): NextResponse {
  return NextResponse.json(
    { 
      success: false, 
      error: message,
      code: 'UNAUTHORIZED_ACCESS'
    },
    { 
      status: 403,
      headers: {
        'X-Security-Violation': 'ownership-validation-failed'
      }
    }
  )
}

/**
 * Helper para validar sessão de usuário
 */
export function validateSession(session: any): ValidationResult {
  if (!session?.user?.id) {
    return {
      isValid: false,
      error: 'Sessão inválida ou expirada',
      details: { reason: 'no_session_or_user_id' }
    }
  }

  if (!session.user.email) {
    return {
      isValid: false,
      error: 'Email do usuário não disponível na sessão',
      details: { reason: 'no_email_in_session' }
    }
  }

  return { isValid: true }
}

/**
 * Busca o braider associado ao usuário logado
 * Primeiro tenta por user_id, depois por email (padrão do sistema)
 */
export async function getBraiderByUserId(userId: string): Promise<{
  success: boolean
  braider?: {
    id: string
    name: string
    contactEmail: string
    status: string
    userId: string
  }
  error?: string
}> {
  try {
    const serviceSupabase = getServiceClient()
    
    // Primeiro obter dados do usuário para ter o email
    console.log('🔍 Buscando braider para userId:', userId)
    const { data: userData, error: userError } = await serviceSupabase.auth.admin.getUserById(userId)
    
    if (userError || !userData.user) {
      console.error('❌ User not found:', { userId, error: userError })
      return {
        success: false,
        error: 'Usuário não encontrado'
      }
    }
    
    const userEmail = userData.user.email
    console.log('📧 Email do usuário:', userEmail)
    
    // Tentar primeiro buscar por user_id (nova estrutura)
    let { data: braiderData, error: braiderError } = await serviceSupabase
      .from('braiders')
      .select('id, name, contact_email, status, user_id')
      .eq('user_id', userId)
      .single()

    // Se não encontrou por user_id, tentar por email (estrutura atual)
    if (braiderError && braiderError.code === 'PGRST116' && userEmail) {
      console.log('🔄 Tentando buscar por email...')
      const { data: braiderByEmail, error: emailError } = await serviceSupabase
        .from('braiders')
        .select('id, name, contact_email, status, user_id')
        .eq('contact_email', userEmail)
        .single()
      
      if (!emailError && braiderByEmail) {
        braiderData = braiderByEmail
        braiderError = null
        console.log('✅ Braider encontrado por email!')
      }
    }

    if (braiderError || !braiderData) {
      console.error('❌ Braider not found for user:', { userId, userEmail, error: braiderError })
      return {
        success: false,
        error: 'Registro de trancista não encontrado para este usuário'
      }
    }

    console.log('✅ Braider encontrado:', { id: braiderData.id, name: braiderData.name })
    
    return {
      success: true,
      braider: {
        id: braiderData.id,
        name: braiderData.name,
        contactEmail: braiderData.contact_email,
        status: braiderData.status,
        userId: braiderData.user_id || userId // Usar o userId passado se user_id estiver vazio
      }
    }
    
  } catch (error) {
    console.error('💥 Error fetching braider by user ID:', error)
    return {
      success: false,
      error: 'Erro interno ao buscar dados da trancista'
    }
  }
}