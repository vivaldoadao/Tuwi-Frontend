import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { braider_id, latitude, longitude } = body;
    
    // Validar parâmetros
    if (!braider_id) {
      return NextResponse.json(
        { error: 'ID da trancista é obrigatório' },
        { status: 400 }
      );
    }
    
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Coordenadas do cliente são obrigatórias' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Usar a função SQL que criamos na Fase 1
    const { data: servesLocation, error } = await supabase
      .rpc('braider_serves_location', {
        braider_id,
        client_lat: latitude,
        client_lon: longitude
      });
    
    if (error) {
      console.error('❌ Error checking braider coverage:', error);
      return NextResponse.json(
        { error: 'Erro ao verificar cobertura da trancista' },
        { status: 500 }
      );
    }
    
    // Buscar dados do braider para contexto adicional
    const { data: braider, error: braiderError } = await supabase
      .from('braiders_complete')
      .select('name, max_travel_distance, latitude, longitude, district, concelho, freguesia')
      .eq('id', braider_id)
      .eq('status', 'approved')
      .single();
    
    if (braiderError) {
      console.error('❌ Error fetching braider details:', braiderError);
      return NextResponse.json(
        { error: 'Trancista não encontrada' },
        { status: 404 }
      );
    }
    
    // Calcular distância se braider tem coordenadas
    let distance = null;
    if (braider.latitude && braider.longitude) {
      const { data: calculatedDistance, error: distanceError } = await supabase
        .rpc('calculate_distance', {
          lat1: braider.latitude,
          lon1: braider.longitude,
          lat2: latitude,
          lon2: longitude
        });
      
      if (!distanceError) {
        distance = calculatedDistance;
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        serves_location: servesLocation,
        braider: {
          id: braider_id,
          name: braider.name,
          location: `${braider.freguesia || ''} ${braider.concelho}, ${braider.district}`.trim(),
          max_travel_distance: braider.max_travel_distance,
          coordinates: braider.latitude && braider.longitude ? {
            latitude: braider.latitude,
            longitude: braider.longitude
          } : null
        },
        distance_km: distance,
        client_coordinates: {
          latitude,
          longitude
        }
      }
    });

  } catch (error) {
    console.error('❌ Braider coverage API error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Verificar cobertura de múltiplos braiders
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { braider_ids, latitude, longitude } = body;
    
    if (!Array.isArray(braider_ids) || braider_ids.length === 0) {
      return NextResponse.json(
        { error: 'Lista de IDs das trancistas é obrigatória' },
        { status: 400 }
      );
    }
    
    if (braider_ids.length > 20) {
      return NextResponse.json(
        { error: 'Máximo de 20 trancistas por consulta' },
        { status: 400 }
      );
    }
    
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Coordenadas do cliente são obrigatórias' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Verificar cobertura para cada braider
    const results = await Promise.all(
      braider_ids.map(async (braider_id: string) => {
        try {
          const { data: servesLocation, error } = await supabase
            .rpc('braider_serves_location', {
              braider_id,
              client_lat: latitude,
              client_lon: longitude
            });
          
          if (error) {
            return {
              braider_id,
              serves_location: false,
              error: 'Erro ao verificar cobertura'
            };
          }
          
          return {
            braider_id,
            serves_location: servesLocation
          };
        } catch (error) {
          return {
            braider_id,
            serves_location: false,
            error: 'Erro durante verificação'
          };
        }
      })
    );
    
    const servingBraiders = results.filter(r => r.serves_location);
    const notServingBraiders = results.filter(r => !r.serves_location);
    
    return NextResponse.json({
      success: true,
      data: {
        total_checked: braider_ids.length,
        serving_count: servingBraiders.length,
        not_serving_count: notServingBraiders.length,
        results,
        client_coordinates: {
          latitude,
          longitude
        }
      }
    });

  } catch (error) {
    console.error('❌ Bulk braider coverage API error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}