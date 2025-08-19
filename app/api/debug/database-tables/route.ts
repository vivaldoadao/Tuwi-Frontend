import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Só permitir para admins ou em desenvolvimento
    if (process.env.NODE_ENV === 'production' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = await createClient()

    // Verificar se as tabelas existem
    const tablesQuery = `
      SELECT 
        table_name,
        table_schema
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('notifications', 'notification_settings')
      ORDER BY table_name;
    `

    const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
      query: tablesQuery
    })

    if (tablesError) {
      console.error('Error checking tables:', tablesError)
      
      // Fallback: tentar query direta nas tabelas
      const directCheck = await Promise.allSettled([
        supabase.from('notifications').select('count', { count: 'exact', head: true }),
        supabase.from('notification_settings').select('count', { count: 'exact', head: true })
      ])

      const notificationsExists = directCheck[0].status === 'fulfilled'
      const settingsExists = directCheck[1].status === 'fulfilled'

      return NextResponse.json({
        method: 'direct_query',
        tables: {
          notifications: {
            exists: notificationsExists,
            error: directCheck[0].status === 'rejected' ? directCheck[0].reason : null
          },
          notification_settings: {
            exists: settingsExists,
            error: directCheck[1].status === 'rejected' ? directCheck[1].reason : null
          }
        },
        error: 'RPC exec_sql not available, used fallback method'
      })
    }

    // Verificar colunas das tabelas se existirem
    const columnsQuery = `
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name IN ('notifications', 'notification_settings')
      ORDER BY table_name, ordinal_position;
    `

    const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
      query: columnsQuery
    })

    // Verificar políticas RLS
    const rlsQuery = `
      SELECT 
        tablename,
        rowsecurity
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('notifications', 'notification_settings');
    `

    const { data: rlsInfo, error: rlsError } = await supabase.rpc('exec_sql', {
      query: rlsQuery
    })

    // Verificar índices
    const indexesQuery = `
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN ('notifications', 'notification_settings');
    `

    const { data: indexes, error: indexesError } = await supabase.rpc('exec_sql', {
      query: indexesQuery
    })

    return NextResponse.json({
      method: 'information_schema',
      analysis: {
        tables: tables || [],
        columns: columns || [],
        rls: rlsInfo || [],
        indexes: indexes || [],
        errors: {
          tables: tablesError,
          columns: columnsError,
          rls: rlsError,
          indexes: indexesError
        }
      },
      summary: {
        notifications_exists: tables?.some((t: any) => t.table_name === 'notifications') || false,
        notification_settings_exists: tables?.some((t: any) => t.table_name === 'notification_settings') || false,
        total_tables_found: tables?.length || 0
      }
    })

  } catch (error) {
    console.error('Unexpected error in database analysis:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}