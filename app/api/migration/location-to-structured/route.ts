import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 📍 Script de Migração: Location → District/Concelho/Freguesia
// Converte dados do campo location para campos estruturados

interface LocationMapping {
  location: string;
  district: string;
  concelho: string;
  freguesia?: string;
}

// Mapeamento manual baseado nos dados existentes observados
const LOCATION_MAPPINGS: LocationMapping[] = [
  {
    location: "Bolho, Cantanhede, Coimbra, Portugal",
    district: "Coimbra",
    concelho: "Cantanhede", 
    freguesia: "Bolho"
  },
  {
    location: "Bom Sucesso, Figueira da Foz, Coimbra, Portugal",
    district: "Coimbra",
    concelho: "Figueira da Foz",
    freguesia: "Bom Sucesso"
  },
  {
    location: "Lisboa, Portugal",
    district: "Lisboa",
    concelho: "Lisboa"
  },
  {
    location: "Porto, Portugal",
    district: "Porto", 
    concelho: "Porto"
  },
  {
    location: "Ribeira de Pena, Vila Real, Portugal",
    district: "Vila Real",
    concelho: "Ribeira de Pena"
  },
  {
    location: "Castro Portugal, Vila Nova de Gaia, Porto, Portugal",
    district: "Porto",
    concelho: "Vila Nova de Gaia",
    freguesia: "Castro Portugal"
  },
  // Substituir localizações brasileiras por portuguesas equivalentes
  {
    location: "São Paulo, SP",
    district: "Lisboa",
    concelho: "Lisboa"
  },
  {
    location: "Rio de Janeiro, RJ", 
    district: "Porto",
    concelho: "Porto"
  },
  {
    location: "Brasília, DF",
    district: "Coimbra",
    concelho: "Coimbra"
  },
  {
    location: "Salvador, BA",
    district: "Braga", 
    concelho: "Braga"
  }
];

// Função para encontrar mapeamento baseado na localização
function findLocationMapping(location: string): LocationMapping | null {
  if (!location) return null;
  
  // Busca exata primeiro
  const exactMatch = LOCATION_MAPPINGS.find(m => 
    m.location.toLowerCase() === location.toLowerCase()
  );
  if (exactMatch) return exactMatch;
  
  // Busca parcial
  const partialMatch = LOCATION_MAPPINGS.find(m => 
    location.toLowerCase().includes(m.concelho.toLowerCase()) ||
    m.location.toLowerCase().includes(location.toLowerCase())
  );
  
  return partialMatch || null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    console.log('🔄 Iniciando migração de localização...');
    
    // 1. Buscar todos os braiders com location mas sem district
    const { data: braiders, error: fetchError } = await supabase
      .from('braiders')
      .select('id, location, district, concelho, freguesia')
      .not('location', 'is', null)
      .is('district', null);

    if (fetchError) {
      console.error('❌ Erro ao buscar braiders:', fetchError);
      return NextResponse.json(
        { error: 'Erro ao buscar braiders' },
        { status: 500 }
      );
    }

    if (!braiders || braiders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Não há braiders para migrar',
        data: { processed: 0, successful: 0, failed: 0 }
      });
    }

    console.log(`📊 Encontrados ${braiders.length} braiders para migrar`);

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // 2. Processar cada braider
    for (const braider of braiders) {
      try {
        console.log(`🔄 Processando braider ${braider.id}: ${braider.location}`);
        
        const mapping = findLocationMapping(braider.location);
        
        if (mapping) {
          // Atualizar braider com dados estruturados
          const { error: updateError } = await supabase
            .from('braiders')
            .update({
              district: mapping.district,
              concelho: mapping.concelho,
              freguesia: mapping.freguesia || null
            })
            .eq('id', braider.id);

          if (updateError) {
            console.error(`❌ Erro ao atualizar braider ${braider.id}:`, updateError);
            results.push({
              braider_id: braider.id,
              location: braider.location,
              success: false,
              error: updateError.message
            });
            failureCount++;
          } else {
            console.log(`✅ Braider ${braider.id} migrado com sucesso`);
            results.push({
              braider_id: braider.id,
              location: braider.location,
              success: true,
              district: mapping.district,
              concelho: mapping.concelho,
              freguesia: mapping.freguesia
            });
            successCount++;
          }
        } else {
          console.warn(`⚠️ Nenhum mapeamento encontrado para: ${braider.location}`);
          results.push({
            braider_id: braider.id,
            location: braider.location,
            success: false,
            error: 'Nenhum mapeamento encontrado'
          });
          failureCount++;
        }
      } catch (error) {
        console.error(`❌ Erro ao processar braider ${braider.id}:`, error);
        results.push({
          braider_id: braider.id,
          location: braider.location,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
        failureCount++;
      }
    }

    console.log(`✅ Migração concluída: ${successCount} sucessos, ${failureCount} falhas`);

    return NextResponse.json({
      success: true,
      message: `Migração completa: ${successCount} sucessos, ${failureCount} falhas`,
      data: {
        processed: braiders.length,
        successful: successCount,
        failed: failureCount,
        results
      }
    });

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    return NextResponse.json(
      { error: 'Erro interno na migração' },
      { status: 500 }
    );
  }
}

// GET para verificar o status antes da migração
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Contar braiders por status de migração
    const { data: withLocation, error: e1 } = await supabase
      .from('braiders')
      .select('id', { count: 'exact' })
      .not('location', 'is', null);
    
    const { data: withDistrict, error: e2 } = await supabase
      .from('braiders')
      .select('id', { count: 'exact' })
      .not('district', 'is', null);
    
    const { data: needsMigration, error: e3 } = await supabase
      .from('braiders')
      .select('id, location', { count: 'exact' })
      .not('location', 'is', null)
      .is('district', null);

    if (e1 || e2 || e3) {
      return NextResponse.json(
        { error: 'Erro ao verificar status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'ready',
      data: {
        totalWithLocation: withLocation?.length || 0,
        totalWithDistrict: withDistrict?.length || 0,
        needsMigration: needsMigration?.length || 0,
        sampleLocations: needsMigration?.slice(0, 5).map(b => b.location) || []
      }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    );
  }
}