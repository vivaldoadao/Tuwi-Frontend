import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'

const getServiceClient = () => {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function isAdmin() {
  try {
    const session = await auth()
    return session?.user?.role === 'admin'
  } catch (error) {
    return false
  }
}

// GET /api/promotions/settings - Obter configurações (públicas para todos, todas para admin)
export async function GET(request: NextRequest) {
  try {
    const serviceClient = getServiceClient()
    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    const key = url.searchParams.get('key')

    // Tentar buscar configurações
    let query = serviceClient
      .from('promotion_settings')
      .select('*')
      .order('category')
      .order('key')

    // Se não é admin, só mostrar configurações públicas
    if (!await isAdmin()) {
      query = query.eq('is_public', true)
    }

    // Filtros opcionais
    if (category) {
      query = query.eq('category', category)
    }

    // Para chaves críticas que podem não existir, não filtrar na query
    const criticalKeys = ['payments_enabled', 'system_enabled', 'free_trial_enabled']
    const shouldFilterByKey = key && !criticalKeys.includes(key)
    
    if (shouldFilterByKey) {
      query = query.eq('key', key)
    }

    const { data: settings, error } = await query

    // Se a tabela não existe ou há erro, retornar configurações padrão
    if (error && (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist'))) {
      console.log('promotion_settings table does not exist, returning defaults')
      const defaultSettings: Record<string, any> = {
        system_enabled: { value: true, description: 'Sistema de promoções ativo', category: 'system', is_public: true },
        payments_enabled: { value: true, description: 'Cobrança de pagamentos ativa', category: 'payments', is_public: true },
        free_trial_enabled: { value: false, description: 'Permite uso gratuito temporário', category: 'trial', is_public: true }
      }
      
      if (key && defaultSettings[key]) {
        return NextResponse.json({
          key,
          value: defaultSettings[key].value,
          description: defaultSettings[key].description
        })
      }
      
      return NextResponse.json({ 
        settings: defaultSettings,
        raw: Object.entries(defaultSettings).map(([k, v]) => ({ key: k, ...v })),
        notice: 'Using default settings - database table not found'
      })
    }

    if (error) {
      console.error('Error fetching settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Se não há configurações, criar as essenciais
    if (!settings || settings.length === 0) {
      try {
        await createEssentialSettings(serviceClient)
        // Tentar buscar novamente
        const { data: newSettings } = await query
        if (newSettings) {
          const settingsArray = newSettings
          return NextResponse.json({ 
            settings: settingsArray.reduce((acc: any, setting) => {
              acc[setting.key] = {
                value: setting.value,
                description: setting.description,
                category: setting.category,
                is_public: setting.is_public
              }
              return acc
            }, {}),
            raw: settingsArray 
          })
        }
      } catch (createError) {
        console.error('Error creating essential settings:', createError)
      }
    }


    // Se settings está vazio, usar defaults
    if (!settings || settings.length === 0) {
      console.log('Settings table is empty, using defaults')
      const defaultSettings: Record<string, any> = {
        system_enabled: { value: true, description: 'Sistema de promoções ativo', category: 'system', is_public: true },
        payments_enabled: { value: true, description: 'Cobrança de pagamentos ativa', category: 'payments', is_public: true },
        free_trial_enabled: { value: false, description: 'Permite uso gratuito temporário', category: 'trial', is_public: true }
      }
      
      return NextResponse.json({ 
        settings: defaultSettings,
        raw: Object.entries(defaultSettings).map(([k, v]) => ({ key: k, ...v })),
        notice: 'Using default settings - table is empty'
      })
    }

    // Transformar em objeto key-value para facilidade de uso
    const settingsMap = settings?.reduce((acc: any, setting) => {
      acc[setting.key] = {
        value: setting.value,
        description: setting.description,
        category: setting.category,
        is_public: setting.is_public
      }
      return acc
    }, {}) || {}

    // Garantir que settings críticos existam com valores padrão
    const criticalDefaults = {
      payments_enabled: { value: true, description: 'Cobrança de pagamentos ativa', category: 'payments', is_public: true }
    }

    for (const [defaultKey, defaultValue] of Object.entries(criticalDefaults)) {
      if (!settingsMap[defaultKey]) {
        settingsMap[defaultKey] = defaultValue
      }
    }

    // Se solicitou uma chave específica, retornar apenas ela (após aplicar defaults)
    if (key && settingsMap[key]) {
      return NextResponse.json({
        key,
        value: settingsMap[key].value,
        description: settingsMap[key].description
      })
    }

    return NextResponse.json({ 
      settings: settingsMap,
      raw: settings 
    })

  } catch (error) {
    console.error('Error in settings API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Função auxiliar para criar configurações essenciais
async function createEssentialSettings(serviceClient: any) {
  const essentialSettings = [
    { key: 'system_enabled', value: true, description: 'Sistema de promoções ativo globalmente', category: 'system', is_public: true },
    { key: 'payments_enabled', value: true, description: 'Cobrança de pagamentos ativa', category: 'payments', is_public: true },
    { key: 'free_trial_enabled', value: false, description: 'Permite uso gratuito temporário', category: 'trial', is_public: true },
    { key: 'max_hero_banners', value: 3, description: 'Máximo de banners no hero section simultaneamente', category: 'limits', is_public: true },
    { key: 'max_highlighted_profiles', value: 15, description: 'Máximo de perfis em destaque simultaneamente', category: 'limits', is_public: true },
    { key: 'default_currency', value: 'EUR', description: 'Moeda padrão do sistema', category: 'pricing', is_public: true }
  ]

  for (const setting of essentialSettings) {
    try {
      await serviceClient
        .from('promotion_settings')
        .insert(setting)
        .select()
    } catch (error) {
      console.error(`Failed to create setting ${setting.key}:`, error)
    }
  }
}

// PUT /api/promotions/settings - Atualizar configurações (admin apenas)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const serviceClient = getServiceClient()
    const body = await request.json()
    const { key, value, description, category, is_public } = body

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value required' }, { status: 400 })
    }

    // Para alguns settings críticos, permitir que qualquer usuário autenticado atualize
    const publicUpdateableSettings = ['payments_enabled', 'system_enabled', 'free_trial_enabled']
    
    // Se não é admin e não é um setting público, negar acesso
    if (!publicUpdateableSettings.includes(key) && !await isAdmin()) {
      return NextResponse.json({ error: 'Admin access required for this setting' }, { status: 403 })
    }

    console.log('Updating setting:', { key, value, description, category, is_public })

    // Use upsert to create or update setting
    const { data: updated, error } = await serviceClient
      .from('promotion_settings')
      .upsert({
        key,
        value,
        description: description || null,
        category: category || 'general',
        is_public: is_public !== undefined ? is_public : true,
        updated_by: null, // Set to null to avoid foreign key issues
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }, { 
        onConflict: 'key',
        ignoreDuplicates: false 
      })
      .select()

    if (error) {
      console.error('Error upserting setting:', error)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to upsert setting',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      setting: updated[0] 
    })

  } catch (error) {
    console.error('Error in settings PUT:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST /api/promotions/settings - Criar nova configuração ou inicializar sistema
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // Ação especial para inicializar settings críticos sem auth
    if (action === 'initialize') {
      const serviceClient = getServiceClient()
      
      const criticalSettings = [
        { key: 'payments_enabled', value: true, description: 'Cobrança de pagamentos ativa', category: 'payments', is_public: true },
        { key: 'system_enabled', value: true, description: 'Sistema de promoções ativo', category: 'system', is_public: true },
        { key: 'free_trial_enabled', value: false, description: 'Permite uso gratuito temporário', category: 'trial', is_public: true }
      ]

      const results = []
      for (const setting of criticalSettings) {
        try {
          const { data, error } = await serviceClient
            .from('promotion_settings')
            .upsert(setting, { onConflict: 'key' })
            .select()

          if (error) {
            results.push({ key: setting.key, error: error.message })
          } else {
            results.push({ key: setting.key, success: true })
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err)
          results.push({ key: setting.key, error: errorMessage })
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Critical settings initialized',
        results
      })
    }

    // Para outras ações, verificar admin
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const serviceClient = getServiceClient()
    
    const {
      key,
      value,
      description,
      category = 'general',
      is_public = false
    } = body

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value required' }, { status: 400 })
    }

    const { data: setting, error } = await serviceClient
      .from('promotion_settings')
      .insert({
        key,
        value,
        description,
        category,
        is_public,
        updated_by: null // Set to null to avoid foreign key issues
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Setting key already exists' }, { status: 409 })
      }
      console.error('Error creating setting:', error)
      return NextResponse.json({ error: 'Failed to create setting' }, { status: 500 })
    }

    return NextResponse.json({ setting }, { status: 201 })

  } catch (error) {
    console.error('Error in settings POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/promotions/settings - Deletar configuração (admin apenas)
export async function DELETE(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const serviceClient = getServiceClient()
    const url = new URL(request.url)
    const key = url.searchParams.get('key')

    if (!key) {
      return NextResponse.json({ error: 'Setting key required' }, { status: 400 })
    }

    // Verificar se é uma configuração crítica que não pode ser deletada
    const criticalSettings = [
      'system_enabled',
      'payments_enabled',
      'max_hero_banners',
      'max_highlighted_profiles'
    ]

    if (criticalSettings.includes(key)) {
      return NextResponse.json({ 
        error: 'Cannot delete critical system setting' 
      }, { status: 400 })
    }

    const { error } = await serviceClient
      .from('promotion_settings')
      .delete()
      .eq('key', key)

    if (error) {
      console.error('Error deleting setting:', error)
      return NextResponse.json({ error: 'Failed to delete setting' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Setting deleted successfully' })

  } catch (error) {
    console.error('Error in settings DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}