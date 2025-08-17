import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Função para calcular distância entre duas coordenadas usando fórmula de Haversine
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parâmetros da busca
    const lat = parseFloat(searchParams.get('lat') || '');
    const lon = parseFloat(searchParams.get('lon') || '');
    const radius = parseFloat(searchParams.get('radius') || '50'); // km
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Validar coordenadas
    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json(
        { error: 'Coordenadas latitude e longitude são obrigatórias' },
        { status: 400 }
      );
    }
    
    // Validar se coordenadas estão em Portugal
    if (lat < 36.8 || lat > 42.2 || lon < -9.6 || lon > -6.0) {
      return NextResponse.json(
        { error: 'Coordenadas devem estar dentro de Portugal' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Buscar todos os braiders com coordenadas e calcular distância
    console.log('🔍 Searching for braiders with coordinates...');
    const { data: allBraiders, error } = await supabase
      .from('braiders')
      .select('id, name, bio, location, status, latitude, longitude')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);
    
    console.log('📊 Found braiders with coordinates:', allBraiders?.length || 0);
    if (allBraiders && allBraiders.length > 0) {
      console.log('First braider with coordinates:', allBraiders[0]);
    }
    
    if (error) {
      console.error('❌ Error searching nearby braiders:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar trancistas próximas', details: error.message },
        { status: 500 }
      );
    }
    
    if (!allBraiders || allBraiders.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          braiders: [],
          pagination: { page, limit, total: 0, hasNext: false },
          search: { latitude: lat, longitude: lon, radius, found: 0 }
        }
      });
    }
    
    // Calcular distância para cada braider e filtrar por raio
    const braidersWithDistance = allBraiders
      .map(braider => {
        const distance = calculateDistance(lat, lon, braider.latitude, braider.longitude);
        return {
          ...braider,
          distance_km: Math.round(distance * 100) / 100 // Arredondar para 2 casas decimais
        };
      })
      .filter(braider => braider.distance_km <= radius)
      .sort((a, b) => a.distance_km - b.distance_km);
    
    // Aplicar paginação
    const offset = (page - 1) * limit;
    const paginatedResults = braidersWithDistance.slice(offset, offset + limit);
    
    return NextResponse.json({
      success: true,
      data: {
        braiders: paginatedResults,
        pagination: {
          page,
          limit,
          total: paginatedResults.length,
          hasNext: paginatedResults.length === limit
        },
        search: {
          latitude: lat,
          longitude: lon,
          radius,
          found: paginatedResults.length
        }
      }
    });

  } catch (error) {
    console.error('❌ Nearby braiders API error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Buscar braiders por distrito/concelho (fallback quando não há coordenadas)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { district, concelho, freguesia, page = 1, limit = 20 } = body;
    
    if (!district) {
      return NextResponse.json(
        { error: 'Distrito é obrigatório' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Construir query baseada nos parâmetros disponíveis
    let query = supabase
      .from('braiders_complete')
      .select('*')
      .eq('status', 'approved')
      .eq('district', district);
    
    if (concelho) {
      query = query.eq('concelho', concelho);
    }
    
    if (freguesia) {
      query = query.eq('freguesia', freguesia);
    }
    
    // Adicionar paginação
    const offset = (page - 1) * limit;
    query = query
      .range(offset, offset + limit - 1)
      .order('average_rating', { ascending: false })
      .order('total_reviews', { ascending: false });
    
    const { data: braiders, error, count } = await query;
    
    if (error) {
      console.error('❌ Error searching braiders by location:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar trancistas por localização' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        braiders: braiders || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          hasNext: (braiders?.length || 0) === limit
        },
        search: {
          district,
          concelho,
          freguesia,
          found: braiders?.length || 0
        }
      }
    });

  } catch (error) {
    console.error('❌ Braiders by location API error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}