import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    console.log('🔍 Starting advanced real-time diagnostics...')
    
    // 1. Verificar políticas RLS
    const { data: policies } = await supabase.rpc('query', {
      query: `
        SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual as policy_condition
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename IN ('messages', 'typing_indicators', 'conversations')
        ORDER BY tablename, policyname;
      `
    })

    // 2. Verificar status de RLS
    const { data: rlsStatus } = await supabase.rpc('query', {
      query: `
        SELECT 
          schemaname,
          tablename,
          rowsecurity,
          CASE 
            WHEN EXISTS(SELECT 1 FROM pg_class WHERE relname = tablename AND relforcerowsecurity) 
            THEN true 
            ELSE false 
          END as forcerowsecurity
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename IN ('messages', 'typing_indicators', 'conversations');
      `
    })

    // 3. Verificar publicação real-time
    const { data: realtimePublication } = await supabase.rpc('query', {
      query: `
        SELECT 
          pubname,
          schemaname,
          tablename
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime'
          AND tablename IN ('messages', 'typing_indicators', 'conversations')
        ORDER BY tablename;
      `
    })

    // 4. Verificar últimas mensagens do usuário
    const { data: userMessages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        conversation_id,
        sender_id
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    // 5. Verificar conversas do usuário
    const { data: userConversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('id, participant_1_id, participant_2_id, created_at')
      .or(`participant_1_id.eq.${session.user.id},participant_2_id.eq.${session.user.id}`)
      .limit(3)

    // 6. Testar se função can_access_conversation existe
    let canAccessFunction = null
    try {
      const { data, error } = await supabase.rpc('query', {
        query: `
          SELECT 
            routine_name,
            routine_type,
            security_type
          FROM information_schema.routines 
          WHERE routine_schema = 'public' 
            AND routine_name = 'can_access_conversation';
        `
      })
      canAccessFunction = data
    } catch (error) {
      canAccessFunction = { error: error.message }
    }

    // 7. Verificar configuração do Supabase
    const supabaseConfig = {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      region: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co') ? 'cloud' : 'local'
    }

    // 8. Verificar se há políticas com USING(true) - perigosas
    const { data: dangerousPolicies } = await supabase.rpc('query', {
      query: `
        SELECT 
          schemaname,
          tablename,
          policyname,
          qual as policy_condition
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND qual = 'true'
          AND tablename IN ('messages', 'typing_indicators', 'conversations', 'user_presence');
      `
    })

    // 9. Status summary
    const statusSummary = {
      tablesInRealtime: realtimePublication?.length || 0,
      expectedTables: 3, // messages, typing_indicators, conversations
      activePolicies: policies?.length || 0,
      dangerousPolicies: dangerousPolicies?.length || 0,
      userHasMessages: userMessages?.length || 0,
      userHasConversations: userConversations?.length || 0,
      securityFunctionsAvailable: !!canAccessFunction && !canAccessFunction.error
    }

    // 10. Recommendations
    const recommendations = []
    
    if (statusSummary.tablesInRealtime < statusSummary.expectedTables) {
      recommendations.push('❌ Nem todas as tabelas estão habilitadas para real-time')
    }
    
    if (statusSummary.dangerousPolicies > 0) {
      recommendations.push('⚠️ Existem políticas inseguras (USING true)')
    }
    
    if (statusSummary.activePolicies === 0) {
      recommendations.push('⚠️ Nenhuma política RLS encontrada - pode ser inseguro')
    }
    
    if (!statusSummary.securityFunctionsAvailable) {
      recommendations.push('💡 Funções de segurança adicionais não estão disponíveis')
    }
    
    if (messagesError || conversationsError) {
      recommendations.push('❌ Erro ao acessar dados - possível problema de RLS')
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Configuração parece estar correta!')
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      user: {
        id: session.user.id,
        email: session.user.email
      },
      diagnostics: {
        policies,
        rlsStatus,
        realtimePublication,
        userMessages: userMessages?.length || 0,
        userConversations: userConversations?.length || 0,
        canAccessFunction,
        dangerousPolicies,
        supabaseConfig
      },
      statusSummary,
      recommendations,
      errors: {
        messagesError: messagesError?.message,
        conversationsError: conversationsError?.message
      },
      nextSteps: [
        '1. Execute final-realtime-solution.sql se ainda não executado',
        '2. Teste envio de mensagem em tempo real',
        '3. Verifique se mensagem aparece instantaneamente',
        '4. Monitore logs do console no useRealtimeChat',
        '5. Se não funcionar, considere usar polling como fallback'
      ]
    })

  } catch (error) {
    console.error('❌ Erro no diagnóstico avançado:', error)
    return NextResponse.json(
      { 
        error: 'Erro no diagnóstico',
        details: error.message,
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}