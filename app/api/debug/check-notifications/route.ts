import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Teste 1: Tentar fazer uma query simples na tabela notifications
    let notificationsTest = null
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('count', { count: 'exact', head: true })
      
      notificationsTest = {
        exists: !error,
        error: error?.message || null,
        count: data || 0
      }
    } catch (err) {
      notificationsTest = {
        exists: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        count: 0
      }
    }

    // Teste 2: Tentar fazer uma query simples na tabela notification_settings
    let settingsTest = null
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('count', { count: 'exact', head: true })
      
      settingsTest = {
        exists: !error,
        error: error?.message || null,
        count: data || 0
      }
    } catch (err) {
      settingsTest = {
        exists: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        count: 0
      }
    }

    // Teste 3: Tentar inserir uma notificação de teste (rollback depois)
    let insertTest = null
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: session.user.id,
          type: 'info',
          title: 'Test',
          message: 'Test message',
          is_read: false
        }])
        .select()
        .single()

      if (!error && data) {
        // Remover a notificação de teste
        await supabase
          .from('notifications')
          .delete()
          .eq('id', data.id)
        
        insertTest = {
          success: true,
          can_insert: true,
          error: null
        }
      } else {
        insertTest = {
          success: false,
          can_insert: false,
          error: error?.message || 'Unknown error'
        }
      }
    } catch (err) {
      insertTest = {
        success: false,
        can_insert: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // Teste 4: Verificar se as colunas esperadas existem
    let columnsTest = null
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, user_id, type, title, message, is_read, is_important, created_at')
        .limit(1)
      
      columnsTest = {
        has_expected_columns: !error,
        error: error?.message || null
      }
    } catch (err) {
      columnsTest = {
        has_expected_columns: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // Teste 5: Verificar tabelas existentes no schema público
    let schemaTest = null
    try {
      // Usar uma query que não depende de permissões especiais
      const { data: allTables, error } = await supabase
        .rpc('get_public_tables')
      
      if (error) {
        // Fallback: tentar listar algumas tabelas conhecidas
        const knownTables = ['users', 'braiders', 'products', 'orders', 'notifications', 'notification_settings']
        const tableChecks = await Promise.allSettled(
          knownTables.map(table => 
            supabase.from(table).select('count', { count: 'exact', head: true })
          )
        )
        
        const existingTables = knownTables.filter((table, index) => 
          tableChecks[index].status === 'fulfilled'
        )
        
        schemaTest = {
          method: 'fallback_check',
          existing_tables: existingTables,
          total_checked: knownTables.length,
          has_notifications: existingTables.includes('notifications'),
          has_notification_settings: existingTables.includes('notification_settings')
        }
      } else {
        schemaTest = {
          method: 'rpc_call',
          all_tables: allTables || [],
          has_notifications: allTables?.includes('notifications') || false,
          has_notification_settings: allTables?.includes('notification_settings') || false
        }
      }
    } catch (err) {
      schemaTest = {
        method: 'error',
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      user_id: session.user.id,
      tests: {
        notifications_table: notificationsTest,
        notification_settings_table: settingsTest,
        insert_capability: insertTest,
        columns_check: columnsTest,
        schema_analysis: schemaTest
      },
      summary: {
        notifications_table_exists: notificationsTest?.exists || false,
        notification_settings_table_exists: settingsTest?.exists || false,
        can_insert_notifications: insertTest?.can_insert || false,
        has_proper_schema: columnsTest?.has_expected_columns || false,
        overall_status: (notificationsTest?.exists && settingsTest?.exists) ? 'OK' : 'MISSING_TABLES'
      },
      recommendations: []
    })

  } catch (error) {
    console.error('Unexpected error in notifications check:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}