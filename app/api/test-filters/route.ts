import { NextRequest, NextResponse } from 'next/server';
import { getAllBraidersWithRealRatings } from '@/lib/data-supabase-ratings';

// 🧪 Endpoint de teste para validar se os filtros estão funcionando
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testando filtros...');
    
    // Testar busca básica
    const result = await getAllBraidersWithRealRatings(1, 5, undefined, 'approved');
    
    const firstBraider = result.braiders[0];
    const availableDistritos = Array.from(new Set(
      result.braiders
        .filter(b => b.district)
        .map(b => b.district!)
    )).sort();

    const availableConcelhos = Array.from(new Set(
      result.braiders
        .filter(b => b.concelho)
        .map(b => b.concelho!)
    )).sort();

    return NextResponse.json({
      status: 'success',
      data: {
        totalBraiders: result.total,
        braidersLoaded: result.braiders.length,
        firstBraider: firstBraider ? {
          name: firstBraider.name,
          district: firstBraider.district,
          concelho: firstBraider.concelho,
          freguesia: firstBraider.freguesia,
          hasRatings: !!firstBraider.averageRating
        } : null,
        availableDistritos,
        availableConcelhos,
        filterTest: {
          districtsCount: availableDistritos.length,
          concelhosCount: availableConcelhos.length,
          distritosSample: availableDistritos.slice(0, 3)
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}