import { createClient as createServiceClient } from '@supabase/supabase-js'

// Service client para operações administrativas
const getServiceClient = () => {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface UserSyncData {
  id: string
  email: string
  name?: string
  role?: string
  image?: string
}

/**
 * Sincroniza um usuário do auth.users para public.users
 */
export async function syncUserToPublicTable(userData: UserSyncData) {
  try {
    const serviceClient = getServiceClient()
    
    console.log('Syncing user to public.users:', userData.email)
    
    const { data: syncedUser, error } = await serviceClient
      .from('users')
      .upsert({
        id: userData.id,
        email: userData.email,
        name: userData.name || userData.email.split('@')[0], // fallback name
        role: userData.role || 'customer', // default role
        image: userData.image,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()

    if (error) {
      console.error('Error syncing user:', error)
      return { success: false, error: error.message }
    }

    console.log('User synced successfully:', syncedUser)
    return { success: true, user: syncedUser[0] }

  } catch (error) {
    console.error('Exception during user sync:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, error: errorMessage }
  }
}

/**
 * Verifica se um usuário existe em public.users
 */
export async function checkUserExistsInPublicTable(userId: string) {
  try {
    const serviceClient = getServiceClient()
    
    const { data: user, error } = await serviceClient
      .from('users')
      .select('id, email, name, role')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error checking user existence:', error)
      return { exists: false, error: error.message }
    }

    return { exists: !!user, user: user || null }

  } catch (error) {
    console.error('Exception checking user existence:', error)
    return { exists: false, error: String(error) }
  }
}

/**
 * Garantir que um usuário existe em public.users, criando se necessário
 */
export async function ensureUserExistsInPublicTable(userData: UserSyncData) {
  try {
    // Primeiro verificar se existe
    const { exists, user } = await checkUserExistsInPublicTable(userData.id)
    
    if (exists) {
      console.log('User already exists in public.users:', userData.email)
      return { success: true, user, wasCreated: false }
    }

    // Se não existe, sincronizar/criar
    const syncResult = await syncUserToPublicTable(userData)
    
    if (syncResult.success) {
      return { success: true, user: syncResult.user, wasCreated: true }
    } else {
      return { success: false, error: syncResult.error }
    }

  } catch (error) {
    console.error('Exception ensuring user exists:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, error: errorMessage }
  }
}