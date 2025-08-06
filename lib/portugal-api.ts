// API pública para dados geográficos de Portugal
// Baseado em APIs oficiais portuguesas

export interface Distrito {
  nome: string
  concelhos?: Concelho[]
}

export interface Concelho {
  nome: string
  distrito?: string
  freguesias?: string[]
}

export interface Freguesia {
  nome: string
  concelho?: string
  distrito?: string
}

export interface MunicipioIPMA {
  globalIdLocal: number
  idRegiao: number
  idDistrito: number
  idConcelho: number
  local: string
  latitude: string
  longitude: string
}

// Cache para otimizar chamadas
let cacheMunicipios: string[] | null = null
let cacheDistritos: Distrito[] | null = null

/**
 * Busca lista de municípios da API pública GeoAPI.pt
 */
export async function getMunicipios(): Promise<string[]> {
  if (cacheMunicipios) {
    return cacheMunicipios
  }

  try {
    const response = await fetch('https://geoapi.pt/municipios')
    if (!response.ok) {
      throw new Error('Falha ao buscar municípios')
    }
    const municipios = await response.json() as string[]
    cacheMunicipios = municipios
    return municipios
  } catch (error) {
    console.error('Erro ao buscar municípios:', error)
    // Fallback para dados locais se API falhar
    return getFallbackMunicipios()
  }
}

/**
 * Busca dados detalhados do IPMA (inclui coordenadas)
 */
export async function getMunicipiosIPMA(): Promise<MunicipioIPMA[]> {
  try {
    const response = await fetch('https://api.ipma.pt/open-data/distrits-islands.json')
    if (!response.ok) {
      throw new Error('Falha ao buscar dados do IPMA')
    }
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Erro ao buscar dados do IPMA:', error)
    return []
  }
}

/**
 * Busca distritos com estrutura hierárquica
 */
export async function getDistritos(): Promise<Distrito[]> {
  if (cacheDistritos) {
    return cacheDistritos
  }

  try {
    // Tentar buscar da API pública primeiro
    const response = await fetch('https://geoapi.pt/distritos')
    if (!response.ok) {
      throw new Error('Falha ao buscar distritos')
    }
    const distritos = await response.json()
    cacheDistritos = distritos
    return distritos
  } catch (error) {
    console.error('Erro ao buscar distritos:', error)
    // Fallback para estrutura simplificada
    return getFallbackDistritos()
  }
}

/**
 * Busca concelhos de um distrito específico
 */
export async function getConcelhosByDistrito(distrito: string): Promise<string[]> {
  try {
    const distritos = await getDistritos()
    const distritoObj = distritos.find(d => 
      d.nome.toLowerCase() === distrito.toLowerCase()
    )
    return distritoObj?.concelhos?.map(c => c.nome) || []
  } catch (error) {
    console.error('Erro ao buscar concelhos:', error)
    return []
  }
}

/**
 * Busca freguesias de um concelho específico
 */
export async function getFreguesiasByConcelho(concelho: string, distrito?: string): Promise<string[]> {
  try {
    // Esta funcionalidade seria implementada com uma API mais detalhada
    // Por enquanto, retorna array vazio
    console.warn('Freguesias API not yet implemented')
    return []
  } catch (error) {
    console.error('Erro ao buscar freguesias:', error)
    return []
  }
}

/**
 * Dados fallback caso as APIs públicas falhem
 */
function getFallbackMunicipios(): string[] {
  return [
    "Abrantes", "Águeda", "Aguiar da Beira", "Alandroal", "Albergaria-a-Velha",
    "Albufeira", "Alcácer do Sal", "Alcanena", "Alcobaça", "Alcochete", "Alcoutim",
    "Alenquer", "Alfândega da Fé", "Alijó", "Aljezur", "Aljustrel", "Almada",
    "Almeida", "Almeirim", "Almodôvar", "Alpiarça", "Alter do Chão", "Alvaiázere",
    "Alvito", "Amadora", "Amarante", "Amares", "Anadia", "Ansião", "Arcos de Valdevez",
    "Arganil", "Arraiolos", "Arronches", "Arruda dos Vinhos", "Aveiro", "Avis",
    "Azambuja", "Baião", "Barcelos", "Barreiro", "Batalha", "Beja", "Belmonte",
    "Benavente", "Bombarral", "Borba", "Boticas", "Braga", "Bragança", "Cabeceiras de Basto",
    "Cadaval", "Caldas da Rainha", "Calheta", "Câmara de Lobos", "Caminha",
    "Campo Maior", "Cantanhede", "Carrazeda de Ansiães", "Carregal do Sal",
    "Cartaxo", "Cascais", "Castanheira de Pera", "Castelo Branco", "Castelo de Paiva",
    "Castelo de Vide", "Castro Daire", "Castro Marim", "Castro Verde", "Celorico da Beira",
    "Celorico de Basto", "Chamusca", "Chaves", "Cinfães", "Coimbra", "Condeixa-a-Nova",
    "Constância", "Coruche", "Covilhã", "Crato", "Cuba", "Elvas", "Entroncamento",
    "Espinho", "Esposende", "Estarreja", "Estremoz", "Évora", "Fafe", "Faro",
    "Felgueiras", "Ferreira do Alentejo", "Ferreira do Zêzere", "Figueira da Foz",
    "Figueira de Castelo Rodrigo", "Figueiró dos Vinhos", "Fornos de Algodres",
    "Freixo de Espada à Cinta", "Fronteira", "Funchal", "Fundão", "Gavião",
    "Góis", "Golegã", "Gondomar", "Gouveia", "Grândola", "Guarda", "Guimarães",
    "Ílhavo", "Lagoa", "Lagos", "Lamego", "Leiria", "Lisboa", "Loulé", "Loures",
    "Lousã", "Lousada", "Mação", "Macedo de Cavaleiros", "Mafra", "Maia",
    "Mangualde", "Manteigas", "Marco de Canaveses", "Marinha Grande", "Marvão",
    "Matosinhos", "Mealhada", "Meda", "Melgaço", "Mértola", "Mesão Frio", "Mira",
    "Miranda do Corvo", "Miranda do Douro", "Mirandela", "Mogadouro", "Moimenta da Beira",
    "Moita", "Monção", "Monchique", "Mondim de Basto", "Monforte", "Montalegre",
    "Montemor-o-Novo", "Montemor-o-Velho", "Montijo", "Mora", "Mortágua", "Moura",
    "Mourão", "Murça", "Nazaré", "Nelas", "Nisa", "Óbidos", "Odemira", "Odivelas",
    "Oeiras", "Oleiros", "Olhão", "Oliveira de Azeméis", "Oliveira de Frades",
    "Oliveira do Bairro", "Oliveira do Hospital", "Ourique", "Ovar", "Paços de Ferreira",
    "Palmela", "Pampilhosa da Serra", "Paredes", "Paredes de Coura", "Pedrógão Grande",
    "Penacova", "Penafiel", "Penalva do Castelo", "Penamacor", "Penedono", "Penela",
    "Peniche", "Peso da Régua", "Pinhel", "Pombal", "Ponte da Barca", "Ponte de Lima",
    "Ponte de Sor", "Portalegre", "Portimão", "Porto", "Porto de Mós", "Póvoa de Lanhoso",
    "Póvoa de Varzim", "Proença-a-Nova", "Redondo", "Reguengos de Monsaraz",
    "Resende", "Ribeira de Pena", "Rio Maior", "Sabrosa", "Sabugal", "Salvaterra de Magos",
    "Santa Comba Dão", "Santa Maria da Feira", "Santa Marta de Penaguião", "Santarém",
    "Santiago do Cacém", "Santo Tirso", "São Brás de Alportel", "São João da Madeira",
    "São João da Pesqueira", "São Pedro do Sul", "Sardoal", "Sátão", "Seia",
    "Seixal", "Sernancelhe", "Serpa", "Sertã", "Sesimbra", "Setúbal", "Sever do Vouga",
    "Silves", "Sines", "Sintra", "Sobral de Monte Agraço", "Soure", "Sousel",
    "Tábua", "Tabuaço", "Tarouca", "Tavira", "Terras de Bouro", "Tomar",
    "Tondela", "Torre de Moncorvo", "Torres Novas", "Torres Vedras", "Trancoso",
    "Trofa", "Vagos", "Vale de Cambra", "Valença", "Valongo", "Valpaços",
    "Vendas Novas", "Viana do Alentejo", "Viana do Castelo", "Vidigueira",
    "Vieira do Minho", "Vila da Praia da Vitória", "Vila de Rei", "Vila do Bispo",
    "Vila do Conde", "Vila Flor", "Vila Franca de Xira", "Vila Nova da Barquinha",
    "Vila Nova de Cerveira", "Vila Nova de Famalicão", "Vila Nova de Foz Côa",
    "Vila Nova de Gaia", "Vila Nova de Paiva", "Vila Nova de Poiares",
    "Vila Pouca de Aguiar", "Vila Real", "Vila Real de Santo António",
    "Vila Velha de Ródão", "Vila Verde", "Vila Viçosa", "Vimioso", "Vinhais",
    "Viseu", "Vizela", "Vouzela"
  ]
}

function getFallbackDistritos(): Distrito[] {
  return [
    { nome: "Aveiro" },
    { nome: "Beja" },
    { nome: "Braga" },
    { nome: "Bragança" },
    { nome: "Castelo Branco" },
    { nome: "Coimbra" },
    { nome: "Évora" },
    { nome: "Faro" },
    { nome: "Guarda" },
    { nome: "Leiria" },
    { nome: "Lisboa" },
    { nome: "Portalegre" },
    { nome: "Porto" },
    { nome: "Santarém" },
    { nome: "Setúbal" },
    { nome: "Viana do Castelo" },
    { nome: "Vila Real" },
    { nome: "Viseu" },
    // Regiões Autónomas
    { nome: "Região Autónoma da Madeira" },
    { nome: "Região Autónoma dos Açores" }
  ]
}

/**
 * Limpar cache (útil para desenvolvimento)
 */
export function clearCache() {
  cacheMunicipios = null
  cacheDistritos = null
}

/**
 * Verificar se as APIs estão acessíveis
 */
export async function checkAPIStatus(): Promise<{
  geoapi: boolean
  ipma: boolean
}> {
  const results = {
    geoapi: false,
    ipma: false
  }

  try {
    const geoResponse = await fetch('https://geoapi.pt/municipios', { 
      method: 'HEAD',
      timeout: 5000 
    })
    results.geoapi = geoResponse.ok
  } catch {
    results.geoapi = false
  }

  try {
    const ipmaResponse = await fetch('https://api.ipma.pt/open-data/distrits-islands.json', { 
      method: 'HEAD',
      timeout: 5000 
    })
    results.ipma = ipmaResponse.ok
  } catch {
    results.ipma = false
  }

  return results
}