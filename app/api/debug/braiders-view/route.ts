import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 🔍 Debug endpoint para verificar a view braiders_with_stats
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    console.log('🔍 Verificando view braiders_with_stats...');
    
    // 1. Verificar se a view existe e quais campos tem
    const { data: viewData, error: viewError } = await supabase
      .from('braiders_with_stats')
      .select('*')
      .limit(1);

    if (viewError) {
      console.error('❌ Erro na view braiders_with_stats:', viewError);
      
      // Fallback: tentar tabela braiders direta
      const { data: tableData, error: tableError } = await supabase
        .from('braiders')
        .select('id, name, bio, location, district, concelho, freguesia, status, created_at')
        .limit(1);

      if (tableError) {
        return NextResponse.json({
          error: 'Erro ao acessar dados',
          viewError: viewError.message,
          tableError: tableError.message
        }, { status: 500 });
      }

      return NextResponse.json({
        status: 'view_error_fallback_success',
        viewError: viewError.message,
        tableData,
        tableFields: tableData?.[0] ? Object.keys(tableData[0]) : []
      });
    }

    return NextResponse.json({
      status: 'view_success',
      viewData,
      viewFields: viewData?.[0] ? Object.keys(viewData[0]) : [],
      hasStructuredFields: {
        district: viewData?.[0]?.hasOwnProperty('district'),
        concelho: viewData?.[0]?.hasOwnProperty('concelho'),
        freguesia: viewData?.[0]?.hasOwnProperty('freguesia')
      }
    });

  } catch (error) {
    console.error('❌ Erro no debug:', error);
    return NextResponse.json(
      { error: 'Erro interno no debug' },
      { status: 500 }
    );
  }
}