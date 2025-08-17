import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 🔧 Admin endpoint para corrigir constraints de deleção de braiders
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Iniciando correção de constraints para deleção de braiders...');
    
    // 1. Verificar constraints atuais
    const { data: currentConstraints, error: constraintsError } = await supabaseAdmin
      .from('information_schema.table_constraints')
      .select(`
        table_name, 
        constraint_name,
        information_schema.key_column_usage!inner(column_name),
        information_schema.referential_constraints!inner(delete_rule)
      `)
      .eq('constraint_type', 'FOREIGN KEY');

    console.log('📋 Constraints atuais encontrados:', currentConstraints?.length || 0);

    // 2. Executar correção diretamente usando SQL raw
    // Como não podemos executar DDL diretamente via supabase-js, vamos tentar uma abordagem diferente
    // Primeiro, verificar se já existe algum booking que pode impedir a deleção
    const { data: problematicBookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('id, braider_id, status')
      .in('status', ['pending', 'confirmed']);

    if (bookingsError) {
      console.error('❌ Erro ao verificar bookings:', bookingsError);
      return NextResponse.json(
        { error: 'Erro ao verificar bookings problemáticos' },
        { status: 500 }
      );
    }

    // Listar braiders que têm bookings ativos
    const braidersWithActiveBookings = problematicBookings
      ?.reduce((acc, booking) => {
        if (!acc[booking.braider_id]) {
          acc[booking.braider_id] = [];
        }
        acc[booking.braider_id].push(booking);
        return acc;
      }, {} as Record<string, any[]>) || {};

    console.log('🔍 Braiders com bookings ativos:', Object.keys(braidersWithActiveBookings).length);

    // 3. Como não podemos alterar constraints via API, vamos simular a verificação
    // e recomendar ação manual no banco de dados
    return NextResponse.json({
      success: false,
      message: 'Constraints precisam ser corrigidos manualmente no banco de dados',
      data: {
        currentConstraints: currentConstraints || [],
        problematicBookings: problematicBookings || [],
        braidersWithActiveBookings: Object.keys(braidersWithActiveBookings),
        recommendations: [
          'Execute o script SQL fix-braider-deletion-constraints.sql diretamente no banco',
          'Ou use o dashboard do Supabase para alterar as constraints',
          'Altere bookings.braider_id de ON DELETE RESTRICT para ON DELETE CASCADE'
        ],
        sqlScript: `
-- Execute no SQL Editor do Supabase:
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_braider_id_fkey;

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_braider_id_fkey 
FOREIGN KEY (braider_id) 
REFERENCES public.braiders(id) ON DELETE CASCADE;
        `
      }
    });

  } catch (error) {
    console.error('❌ Erro na correção:', error);
    return NextResponse.json(
      { error: 'Erro interno na correção' },
      { status: 500 }
    );
  }
}

// GET para verificar status atual dos constraints
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando status dos constraints...');
    
    // Verificar bookings ativos que podem bloquear deleção
    const { data: activeBookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('id, braider_id, status')
      .in('status', ['pending', 'confirmed']);

    if (bookingsError) {
      console.error('❌ Erro ao verificar bookings:', bookingsError);
      return NextResponse.json({ error: bookingsError.message }, { status: 500 });
    }

    // Verificar se existem reviews
    const { data: reviews, error: reviewsError } = await supabaseAdmin
      .from('reviews')
      .select('id, braider_id');

    // Verificar se existem services
    const { data: services, error: servicesError } = await supabaseAdmin
      .from('services')
      .select('id, braider_id');

    // Agrupar dados por braider
    const braidersWithDependencies: Record<string, {
      activeBookings: number;
      reviews: number;
      services: number;
      canDelete: boolean;
    }> = {};

    // Contar bookings ativos por braider
    activeBookings?.forEach(booking => {
      if (!braidersWithDependencies[booking.braider_id]) {
        braidersWithDependencies[booking.braider_id] = {
          activeBookings: 0,
          reviews: 0,
          services: 0,
          canDelete: true
        };
      }
      braidersWithDependencies[booking.braider_id].activeBookings++;
      braidersWithDependencies[booking.braider_id].canDelete = false;
    });

    // Contar reviews por braider
    reviews?.forEach(review => {
      if (!braidersWithDependencies[review.braider_id]) {
        braidersWithDependencies[review.braider_id] = {
          activeBookings: 0,
          reviews: 0,
          services: 0,
          canDelete: true
        };
      }
      braidersWithDependencies[review.braider_id].reviews++;
    });

    // Contar services por braider
    services?.forEach(service => {
      if (!braidersWithDependencies[service.braider_id]) {
        braidersWithDependencies[service.braider_id] = {
          activeBookings: 0,
          reviews: 0,
          services: 0,
          canDelete: true
        };
      }
      braidersWithDependencies[service.braider_id].services++;
    });

    const hasBlockingConstraints = Object.values(braidersWithDependencies).some(
      (deps: any) => !deps.canDelete
    );

    return NextResponse.json({
      status: hasBlockingConstraints ? 'has_dependencies' : 'ready',
      data: {
        totalBraidersWithDependencies: Object.keys(braidersWithDependencies).length,
        braidersWithActiveBookings: Object.entries(braidersWithDependencies).filter(
          ([_, deps]: [string, any]) => deps.activeBookings > 0
        ).length,
        summary: `${Object.keys(braidersWithDependencies).length} braiders com dependências`,
        braidersWithDependencies,
        recommendation: hasBlockingConstraints 
          ? 'Existem braiders com bookings ativos - deleção será bloqueada'
          : 'Nenhum braider tem bookings ativos - deleção permitida',
        constraintStatus: 'Verificação baseada em dados atuais (constraints não consultados diretamente)'
      }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar:', error);
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    );
  }
}