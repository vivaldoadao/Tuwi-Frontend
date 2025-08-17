import { NextRequest, NextResponse } from 'next/server';
import { geocodePortugueseAddress, GeocodeRequest } from '@/lib/geocoding';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { district, concelho, freguesia, address } = body as GeocodeRequest;

    // Validar se pelo menos um campo foi fornecido
    if (!district && !concelho && !freguesia && !address) {
      return NextResponse.json(
        { error: 'Pelo menos um campo de localização deve ser fornecido' },
        { status: 400 }
      );
    }

    // Geocodificar o endereço
    const result = await geocodePortugueseAddress({
      district,
      concelho, 
      freguesia,
      address
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Não foi possível geocodificar o endereço fornecido' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Geocoding API error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor durante geocodificação' },
      { status: 500 }
    );
  }
}

// Endpoint para geocodificação em lote (admin)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { addresses } = body as { addresses: GeocodeRequest[] };

    if (!Array.isArray(addresses) || addresses.length === 0) {
      return NextResponse.json(
        { error: 'Array de endereços deve ser fornecido' },
        { status: 400 }
      );
    }

    if (addresses.length > 10) {
      return NextResponse.json(
        { error: 'Máximo de 10 endereços por requisição' },
        { status: 400 }
      );
    }

    // Importar função de lote dinamicamente para evitar problemas de build
    const { geocodeBatch } = await import('@/lib/geocoding');
    const results = await geocodeBatch(addresses);

    const successCount = results.filter(r => r !== null).length;
    const failureCount = results.length - successCount;

    return NextResponse.json({
      success: true,
      data: results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    });

  } catch (error) {
    console.error('❌ Batch geocoding API error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor durante geocodificação em lote' },
      { status: 500 }
    );
  }
}