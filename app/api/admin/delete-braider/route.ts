import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 🗑️ Admin endpoint para deletar braider com verificação de dependências
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const braiderId = searchParams.get('id');
    
    if (!braiderId) {
      return NextResponse.json(
        { error: 'ID do braider é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;
    
    console.log(`🗑️ Tentando deletar braider: ${braiderId}`);
    
    // 1. Verificar se o braider existe
    const { data: braider, error: fetchError } = await supabase
      .from('braiders')
      .select('id, name, status')
      .eq('id', braiderId)
      .single();

    console.log('🔍 Verificação do braider:', { braider, fetchError });

    if (fetchError || !braider) {
      console.error('❌ Braider não encontrado:', fetchError);
      return NextResponse.json(
        { error: 'Braider não encontrado', details: fetchError?.message },
        { status: 404 }
      );
    }

    // 2. Verificar dependências que podem bloquear
    const dependencies = [];
    
    // Verificar bookings ativos
    const { data: activeBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('braider_id', braiderId)
      .in('status', ['pending', 'confirmed']);

    if (!bookingsError && activeBookings && activeBookings.length > 0) {
      dependencies.push({
        table: 'bookings',
        count: activeBookings.length,
        status: 'blocking',
        message: `${activeBookings.length} agendamentos ativos impedem a deleção`
      });
    }

    // Verificar outras dependências (informativo)
    const tables = ['reviews', 'services', 'ratings'];
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('id', { count: 'exact' })
        .eq('braider_id', braiderId);
        
      if (!error && data) {
        dependencies.push({
          table,
          count: data.length,
          status: 'cascade',
          message: `${data.length} registros em ${table} serão deletados em cascata`
        });
      }
    }

    // 3. Se há dependências bloqueadoras, retornar erro
    const blockingDeps = dependencies.filter(d => d.status === 'blocking');
    if (blockingDeps.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Não é possível deletar braider com dependências ativas',
        dependencies,
        blocked_by: blockingDeps,
        suggestion: 'Cancele ou complete os agendamentos ativos antes de deletar'
      }, { status: 409 });
    }

    // 4. Proceder com deleção
    console.log(`✅ Dependências verificadas, prosseguindo com deleção...`);
    
    const { error: deleteError } = await supabase
      .from('braiders')
      .delete()
      .eq('id', braiderId);

    if (deleteError) {
      console.error('❌ Erro ao deletar braider:', deleteError);
      
      // Verificar se é erro de constraint
      if (deleteError.message.includes('violates foreign key constraint')) {
        return NextResponse.json({
          success: false,
          error: 'Erro de constraint de banco de dados',
          details: deleteError.message,
          solution: 'Execute o endpoint de correção de constraints primeiro',
          fix_endpoint: '/api/admin/fix-braider-constraints'
        }, { status: 409 });
      }
      
      return NextResponse.json(
        { error: 'Erro ao deletar braider: ' + deleteError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Braider ${braiderId} deletado com sucesso`);

    return NextResponse.json({
      success: true,
      message: 'Braider deletado com sucesso',
      data: {
        deleted_braider: {
          id: braiderId,
          name: braider.name,
          status: braider.status
        },
        dependencies_deleted: dependencies.filter(d => d.status === 'cascade'),
        summary: `Braider e ${dependencies.length} dependências deletadas`
      }
    });

  } catch (error) {
    console.error('❌ Erro na deleção:', error);
    return NextResponse.json(
      { error: 'Erro interno na deleção' },
      { status: 500 }
    );
  }
}

// GET para verificar dependências de um braider antes de deletar
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const braiderId = searchParams.get('id');
    
    if (!braiderId) {
      return NextResponse.json(
        { error: 'ID do braider é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;
    
    // Verificar se o braider existe
    const { data: braider, error: fetchError } = await supabase
      .from('braiders')
      .select('id, name, status')
      .eq('id', braiderId)
      .single();

    console.log('🔍 GET Verificação do braider:', { braider, fetchError });

    if (fetchError || !braider) {
      console.error('❌ GET Braider não encontrado:', fetchError);
      return NextResponse.json(
        { error: 'Braider não encontrado', details: fetchError?.message },
        { status: 404 }
      );
    }

    // Verificar todas as dependências
    const dependencies = [];
    
    const tables = [
      { name: 'bookings', blocking_statuses: ['pending', 'confirmed'] },
      { name: 'reviews', blocking_statuses: [] },
      { name: 'services', blocking_statuses: [] },
      { name: 'ratings', blocking_statuses: [] }
    ];

    for (const table of tables) {
      const { data, error, count } = await supabase
        .from(table.name)
        .select('*', { count: 'exact' })
        .eq('braider_id', braiderId);
        
      if (!error) {
        const totalCount = count || 0;
        let blockingCount = 0;
        
        if (table.blocking_statuses.length > 0 && data) {
          blockingCount = data.filter(item => 
            table.blocking_statuses.includes(item.status)
          ).length;
        }
        
        dependencies.push({
          table: table.name,
          total_count: totalCount,
          blocking_count: blockingCount,
          can_delete: blockingCount === 0,
          message: blockingCount > 0 
            ? `${blockingCount} registros ativos em ${table.name} impedem deleção`
            : `${totalCount} registros em ${table.name} ${totalCount > 0 ? 'serão deletados em cascata' : ''}`
        });
      }
    }

    const canDelete = dependencies.every(d => d.can_delete);
    const blockingDeps = dependencies.filter(d => !d.can_delete);

    return NextResponse.json({
      braider: {
        id: braiderId,
        name: braider.name,
        status: braider.status
      },
      can_delete: canDelete,
      dependencies,
      blocking_dependencies: blockingDeps,
      recommendation: canDelete 
        ? 'Seguro para deletar' 
        : 'Resolva as dependências bloqueadoras primeiro',
      delete_endpoint: `/api/admin/delete-braider?id=${braiderId}`
    });

  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    return NextResponse.json(
      { error: 'Erro interno na verificação' },
      { status: 500 }
    );
  }
}