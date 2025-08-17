// 🌍 Sistema de Geocodificação para Portugal
// Converte endereços portugueses em coordenadas latitude/longitude

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
  confidence: number;
  source: 'nominatim' | 'geoapi' | 'cache';
}

export interface GeocodeRequest {
  district?: string;
  concelho?: string;
  freguesia?: string;
  address?: string;
}

// Cache local para evitar chamadas desnecessárias
const geocodeCache = new Map<string, GeocodeResult>();

/**
 * Geocodifica um endereço português usando múltiplas APIs
 */
export async function geocodePortugueseAddress(
  request: GeocodeRequest
): Promise<GeocodeResult | null> {
  try {
    // Criar chave única para cache
    const cacheKey = createCacheKey(request);
    
    // Verificar cache primeiro
    if (geocodeCache.has(cacheKey)) {
      const cached = geocodeCache.get(cacheKey)!;
      return { ...cached, source: 'cache' };
    }

    // Construir query de busca
    const searchQuery = buildSearchQuery(request);
    if (!searchQuery) {
      console.warn('❌ Geocoding: Query vazia', request);
      return null;
    }

    console.log('🔍 Geocoding:', searchQuery);

    // Tentar APIs em ordem de preferência
    let result = await tryNominatimAPI(searchQuery);
    
    if (!result) {
      result = await tryGeoAPIPortugal(request);
    }

    if (result) {
      // Salvar no cache
      geocodeCache.set(cacheKey, result);
      console.log('✅ Geocoding success:', result);
      return result;
    }

    console.warn('❌ Geocoding failed for:', searchQuery);
    return null;

  } catch (error) {
    console.error('💥 Geocoding error:', error);
    return null;
  }
}

/**
 * API Nominatim (OpenStreetMap) - Gratuita e confiável
 */
async function tryNominatimAPI(query: string): Promise<GeocodeResult | null> {
  try {
    const encodedQuery = encodeURIComponent(query + ', Portugal');
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1&countrycodes=pt&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Wilnara-Trancas-Marketplace/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        formatted_address: result.display_name,
        confidence: calculateNominatimConfidence(result),
        source: 'nominatim'
      };
    }

    return null;
  } catch (error) {
    console.error('❌ Nominatim API error:', error);
    return null;
  }
}

/**
 * API GeoAPI Portugal - Específica para Portugal
 */
async function tryGeoAPIPortugal(request: GeocodeRequest): Promise<GeocodeResult | null> {
  try {
    // Construir URL baseada nos campos disponíveis
    let url = 'https://json.geoapi.pt/';
    
    if (request.distrito) {
      url += `distrito/${encodeURIComponent(request.district || '')}`;
      
      if (request.concelho) {
        url += `/concelho/${encodeURIComponent(request.concelho)}`;
        
        if (request.freguesia) {
          url += `/freguesia/${encodeURIComponent(request.freguesia)}`;
        }
      }
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`GeoAPI Portugal error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data.centro) {
      return {
        latitude: data.centro.lat,
        longitude: data.centro.lon,
        formatted_address: formatGeoAPIAddress(data),
        confidence: 0.8, // GeoAPI é confiável para Portugal
        source: 'geoapi'
      };
    }

    return null;
  } catch (error) {
    console.error('❌ GeoAPI Portugal error:', error);
    return null;
  }
}

/**
 * Geocodificação em lote para múltiplos endereços
 */
export async function geocodeBatch(
  requests: GeocodeRequest[]
): Promise<(GeocodeResult | null)[]> {
  const results: (GeocodeResult | null)[] = [];
  
  // Processar em lotes pequenos para não sobrecarregar APIs
  const batchSize = 3;
  
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (request, index) => {
      // Delay pequeno entre requests para ser respeitoso com APIs
      await new Promise(resolve => setTimeout(resolve, index * 200));
      return geocodePortugueseAddress(request);
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Pausa entre lotes
    if (i + batchSize < requests.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

/**
 * Validar se coordenadas estão dentro de Portugal
 */
export function validatePortugueseCoordinates(lat: number, lon: number): boolean {
  // Bounding box aproximado de Portugal Continental + Ilhas
  const portugalBounds = {
    north: 42.2,
    south: 36.8,
    east: -6.0,
    west: -9.6
  };
  
  return lat >= portugalBounds.south && 
         lat <= portugalBounds.north && 
         lon >= portugalBounds.west && 
         lon <= portugalBounds.east;
}

// === FUNÇÕES AUXILIARES ===

function createCacheKey(request: GeocodeRequest): string {
  const parts = [
    request.district || '',
    request.concelho || '',
    request.freguesia || '',
    request.address || ''
  ].filter(Boolean);
  
  return parts.join('|').toLowerCase();
}

function buildSearchQuery(request: GeocodeRequest): string {
  const parts: string[] = [];
  
  if (request.address) {
    parts.push(request.address);
  }
  
  if (request.freguesia) {
    parts.push(request.freguesia);
  }
  
  if (request.concelho) {
    parts.push(request.concelho);
  }
  
  if (request.district) {
    parts.push(request.district);
  }
  
  return parts.filter(Boolean).join(', ');
}

function calculateNominatimConfidence(result: any): number {
  // Calcular confiança baseada no tipo de resultado
  const type = result.type?.toLowerCase() || '';
  const category = result.category?.toLowerCase() || '';
  
  if (category === 'place') {
    if (type === 'city' || type === 'town') return 0.9;
    if (type === 'village' || type === 'suburb') return 0.8;
    if (type === 'neighbourhood') return 0.7;
  }
  
  if (category === 'boundary') {
    if (type === 'administrative') return 0.85;
  }
  
  // Confiança base
  return 0.6;
}

function formatGeoAPIAddress(data: any): string {
  const parts: string[] = [];
  
  if (data.freguesia) parts.push(data.freguesia);
  if (data.concelho) parts.push(data.concelho);
  if (data.distrito) parts.push(data.distrito);
  
  return parts.join(', ') + ', Portugal';
}

/**
 * Geocodificar endereço simples (função de conveniência)
 */
export async function geocodeSimpleAddress(address: string): Promise<GeocodeResult | null> {
  return geocodePortugueseAddress({ address });
}

/**
 * Reverter coordenadas para endereço (reverse geocoding)
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Wilnara-Trancas-Marketplace/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data.display_name) {
      return data.display_name;
    }

    return null;
  } catch (error) {
    console.error('❌ Reverse geocoding error:', error);
    return null;
  }
}