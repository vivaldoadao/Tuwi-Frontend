import { useState, useEffect, useCallback } from 'react'
import { getMunicipios, getDistritos, getConcelhosByDistrito, checkAPIStatus } from '@/lib/portugal-api'

interface UsePortugalLocationReturn {
  distritos: string[]
  concelhos: string[]
  loading: {
    distritos: boolean
    concelhos: boolean
  }
  error: {
    distritos: string | null
    concelhos: string | null
  }
  apiStatus: {
    geoapi: boolean
    ipma: boolean
  } | null
  refreshDistritos: () => Promise<void>
  loadConcelhos: (distrito: string) => Promise<void>
  checkAPIs: () => Promise<void>
}

export function usePortugalLocation(): UsePortugalLocationReturn {
  const [distritos, setDistritos] = useState<string[]>([])
  const [concelhos, setConcelhos] = useState<string[]>([])
  const [loading, setLoading] = useState({
    distritos: false,
    concelhos: false
  })
  const [error, setError] = useState({
    distritos: null as string | null,
    concelhos: null as string | null
  })
  const [apiStatus, setApiStatus] = useState<{
    geoapi: boolean
    ipma: boolean
  } | null>(null)

  // Carregar distritos
  const refreshDistritos = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, distritos: true }))
      setError(prev => ({ ...prev, distritos: null }))
      
      const distritosData = await getDistritos()
      const nomes = distritosData.map(d => d.nome).sort()
      setDistritos(nomes)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(prev => ({ ...prev, distritos: errorMessage }))
      console.error('Erro ao carregar distritos:', err)
      
      // Fallback para distritos básicos
      setDistritos([
        "Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco",
        "Coimbra", "Évora", "Faro", "Guarda", "Leiria", "Lisboa",
        "Portalegre", "Porto", "Santarém", "Setúbal", 
        "Viana do Castelo", "Vila Real", "Viseu"
      ])
    } finally {
      setLoading(prev => ({ ...prev, distritos: false }))
    }
  }, [])

  // Carregar concelhos por distrito
  const loadConcelhos = useCallback(async (distrito: string) => {
    if (!distrito) {
      setConcelhos([])
      return
    }

    try {
      setLoading(prev => ({ ...prev, concelhos: true }))
      setError(prev => ({ ...prev, concelhos: null }))
      
      const concelhosData = await getConcelhosByDistrito(distrito)
      setConcelhos(concelhosData.sort())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(prev => ({ ...prev, concelhos: errorMessage }))
      console.error('Erro ao carregar concelhos:', err)
      
      // Fallback: usar lista geral de municípios
      try {
        const municipios = await getMunicipios()
        setConcelhos(municipios.sort())
      } catch {
        setConcelhos([])
      }
    } finally {
      setLoading(prev => ({ ...prev, concelhos: false }))
    }
  }, [])

  // Verificar status das APIs
  const checkAPIs = useCallback(async () => {
    try {
      const status = await checkAPIStatus()
      setApiStatus(status)
    } catch (err) {
      console.error('Erro ao verificar status das APIs:', err)
      setApiStatus({ geoapi: false, ipma: false })
    }
  }, [])

  // Carregar distritos na inicialização
  useEffect(() => {
    refreshDistritos()
    checkAPIs()
  }, [refreshDistritos, checkAPIs])

  return {
    distritos,
    concelhos,
    loading,
    error,
    apiStatus,
    refreshDistritos,
    loadConcelhos,
    checkAPIs
  }
}