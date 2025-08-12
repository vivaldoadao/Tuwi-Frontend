import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

// Service client para executar SQL diretamente
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

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação de admin
    if (!await isAdmin()) {
      return NextResponse.json({ 
        error: 'Admin access required' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    const serviceClient = getServiceClient()

    if (action === 'fix-database') {
      // Ler e executar o SQL de correção
      const sqlPath = path.join(process.cwd(), 'COMPREHENSIVE-DATABASE-FIX.sql')
      const sqlContent = fs.readFileSync(sqlPath, 'utf8')

      // Dividir em comandos separados e executar um por vez
      const commands = sqlContent
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

      const results = []
      let errors = []

      for (let i = 0; i < commands.length; i++) {
        const command = commands[i]
        
        try {
          // Pular comandos de verificação que podem não funcionar via API
          if (command.includes('information_schema') || 
              command.includes('SELECT \'') ||
              command.includes('\\d ')) {
            continue
          }

          const { data, error } = await serviceClient.rpc('exec_sql', { 
            sql_query: command 
          })

          if (error) {
            console.error(`Error executing command ${i}:`, error)
            errors.push({ command: i, error: error.message })
          } else {
            results.push({ command: i, success: true })
          }
        } catch (err) {
          console.error(`Exception executing command ${i}:`, err)
          const errorMessage = err instanceof Error ? err.message : String(err)
          errors.push({ command: i, error: errorMessage })
        }
      }

      // Tentar criar as tabelas básicas manualmente
      try {
        // Verificar se as tabelas existem
        const { data: packagesCheck } = await serviceClient
          .from('promotion_packages')
          .select('id')
          .limit(1)

        if (!packagesCheck) {
          console.log('Creating promotion_packages table...')
        }
      } catch (error) {
        console.log('promotion_packages table needs to be created')
      }

      try {
        // Verificar se settings estão funcionando
        const { data: settings, error: settingsError } = await serviceClient
          .from('promotion_settings')
          .select('key, value')
          .eq('key', 'payments_enabled')

        if (settingsError) {
          console.error('Settings table error:', settingsError)
        } else {
          console.log('Settings check:', settings)
        }
      } catch (error) {
        console.error('Settings verification failed:', error)
      }

      return NextResponse.json({
        success: true,
        message: 'Database fix attempted',
        results,
        errors,
        commandsProcessed: commands.length
      })
    }

    if (action === 'create-settings') {
      // Criar settings essenciais diretamente via API
      const essentialSettings = [
        { key: 'system_enabled', value: true, description: 'Sistema de promoções ativo globalmente', category: 'system', is_public: true },
        { key: 'payments_enabled', value: true, description: 'Cobrança de pagamentos ativa', category: 'payments', is_public: true },
        { key: 'free_trial_enabled', value: false, description: 'Permite uso gratuito temporário', category: 'trial', is_public: true }
      ]

      const settingsResults = []

      for (const setting of essentialSettings) {
        try {
          const { data, error } = await serviceClient
            .from('promotion_settings')
            .upsert(setting, { onConflict: 'key' })
            .select()

          if (error) {
            settingsResults.push({ key: setting.key, error: error.message })
          } else {
            settingsResults.push({ key: setting.key, success: true, data })
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err)
          settingsResults.push({ key: setting.key, error: errorMessage })
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Settings creation attempted',
        results: settingsResults
      })
    }

    return NextResponse.json({
      error: 'Invalid action'
    }, { status: 400 })

  } catch (error) {
    console.error('Error in database fix API:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: errorMessage
    }, { status: 500 })
  }
}