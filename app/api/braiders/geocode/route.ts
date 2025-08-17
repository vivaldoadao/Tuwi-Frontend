import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { geocodePortugueseAddress } from '@/lib/geocoding';

// Geocodificar braiders existentes que não têm coordenadas
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Buscar braiders que têm localização mas não têm coordenadas
    const { data: braiders, error: fetchError } = await supabase
      .from('braiders')
      .select('id, district, concelho, freguesia, location, latitude, longitude')
      .or('latitude.is.null,longitude.is.null')
      .not('location', 'is', null);

    if (fetchError) {
      console.error('❌ Error fetching braiders:', fetchError);
      return NextResponse.json(
        { error: 'Erro ao buscar trancistas' },
        { status: 500 }
      );
    }

    if (!braiders || braiders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Não há trancistas para geocodificar',
        data: { processed: 0, successful: 0, failed: 0 }
      });
    }

    console.log(`🔍 Found ${braiders.length} braiders to geocode`);

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Processar cada braider
    for (const braider of braiders) {
      try {
        console.log(`🌍 Geocoding braider ${braider.id}...`);
        
        // Geocodificar usando os dados do braider
        // Se temos district/concelho/freguesia, usar esses campos
        // Senão, usar apenas o campo location completo
        const geocodeRequest = braider.district ? {
          district: braider.district,
          concelho: braider.concelho,
          freguesia: braider.freguesia,
          address: braider.location
        } : {
          address: braider.location
        };
        
        const geocodeResult = await geocodePortugueseAddress(geocodeRequest);

        if (geocodeResult) {
          // Atualizar o braider com as coordenadas
          const { error: updateError } = await supabase
            .from('braiders')
            .update({
              latitude: geocodeResult.latitude,
              longitude: geocodeResult.longitude
            })
            .eq('id', braider.id);

          if (updateError) {
            console.error(`❌ Error updating braider ${braider.id}:`, updateError);
            results.push({
              braider_id: braider.id,
              success: false,
              error: 'Erro ao atualizar banco de dados'
            });
            failureCount++;
          } else {
            console.log(`✅ Successfully geocoded braider ${braider.id}`);
            results.push({
              braider_id: braider.id,
              success: true,
              latitude: geocodeResult.latitude,
              longitude: geocodeResult.longitude,
              formatted_address: geocodeResult.formatted_address,
              source: geocodeResult.source
            });
            successCount++;
          }
        } else {
          console.warn(`❌ Could not geocode braider ${braider.id}`);
          results.push({
            braider_id: braider.id,
            success: false,
            error: 'Não foi possível geocodificar endereço'
          });
          failureCount++;
        }

        // Pausa entre requests para não sobrecarregar APIs
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`💥 Error processing braider ${braider.id}:`, error);
        results.push({
          braider_id: braider.id,
          success: false,
          error: 'Erro durante processamento'
        });
        failureCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processamento completo: ${successCount} sucessos, ${failureCount} falhas`,
      data: {
        processed: braiders.length,
        successful: successCount,
        failed: failureCount,
        results
      }
    });

  } catch (error) {
    console.error('❌ Braiders geocoding error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Verificar status da geocodificação
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Contar braiders por status de geocodificação
    const { data: stats, error } = await supabase
      .from('braiders_complete')
      .select('geo_status')
      .eq('status', 'approved');

    if (error) {
      throw error;
    }

    const summary = stats?.reduce((acc: any, braider: any) => {
      acc[braider.geo_status] = (acc[braider.geo_status] || 0) + 1;
      return acc;
    }, {}) || {};

    return NextResponse.json({
      success: true,
      data: {
        geocoded: summary.geocoded || 0,
        partial: summary.partial || 0,
        missing: summary.missing || 0,
        total: stats?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ Geocoding status error:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar status' },
      { status: 500 }
    );
  }
}