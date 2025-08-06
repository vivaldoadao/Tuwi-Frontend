"use client"

import React, { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { getMunicipios, getDistritos, getConcelhosByDistrito } from '@/lib/portugal-api'

interface LocationSelectorProps {
  selectedDistrito: string
  selectedConcelho: string
  selectedFreguesia: string
  onDistritoChange: (distrito: string) => void
  onConcelhoChange: (concelho: string) => void
  onFreguesiaChange: (freguesia: string) => void
  disabled?: boolean
}

export default function PortugalLocationSelector({
  selectedDistrito,
  selectedConcelho,
  selectedFreguesia,
  onDistritoChange,
  onConcelhoChange,
  onFreguesiaChange,
  disabled = false
}: LocationSelectorProps) {
  const [distritos, setDistritos] = useState<string[]>([])
  const [concelhos, setConcelhos] = useState<string[]>([])
  const [freguesias, setFreguesias] = useState<string[]>([])
  const [loading, setLoading] = useState({
    distritos: true,
    concelhos: false,
    freguesias: false
  })

  // Carregar distritos na inicialização
  useEffect(() => {
    async function loadDistritos() {
      try {
        setLoading(prev => ({ ...prev, distritos: true }))
        const distritosData = await getDistritos()
        const nomes = distritosData.map(d => d.nome).sort()
        setDistritos(nomes)
      } catch (error) {
        console.error('Erro ao carregar distritos:', error)
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
    }

    loadDistritos()
  }, [])

  // Carregar concelhos quando distrito muda
  useEffect(() => {
    async function loadConcelhos() {
      if (!selectedDistrito) {
        setConcelhos([])
        return
      }

      try {
        setLoading(prev => ({ ...prev, concelhos: true }))
        const concelhosData = await getConcelhosByDistrito(selectedDistrito)
        setConcelhos(concelhosData.sort())
      } catch (error) {
        console.error('Erro ao carregar concelhos:', error)
        // Fallback: usar lista geral de municípios
        const municipios = await getMunicipios()
        setConcelhos(municipios.sort())
      } finally {
        setLoading(prev => ({ ...prev, concelhos: false }))
      }
    }

    loadConcelhos()
    // Reset concelho e freguesia quando distrito muda
    if (selectedDistrito) {
      onConcelhoChange('')
      onFreguesiaChange('')
    }
  }, [selectedDistrito, onConcelhoChange, onFreguesiaChange])

  // Carregar freguesias quando concelho muda
  useEffect(() => {
    async function loadFreguesias() {
      if (!selectedConcelho) {
        setFreguesias([])
        return
      }

      try {
        setLoading(prev => ({ ...prev, freguesias: true }))
        // Por enquanto, esta funcionalidade não está disponível na API pública
        // Pode ser implementada no futuro
        setFreguesias([])
      } catch (error) {
        console.error('Erro ao carregar freguesias:', error)
        setFreguesias([])
      } finally {
        setLoading(prev => ({ ...prev, freguesias: false }))
      }
    }

    loadFreguesias()
    // Reset freguesia quando concelho muda
    if (selectedConcelho) {
      onFreguesiaChange('')
    }
  }, [selectedConcelho, onFreguesiaChange])

  return (
    <div className="space-y-4">
      {/* Distrito */}
      <div>
        <Label htmlFor="distrito">Distrito *</Label>
        <Select 
          value={selectedDistrito} 
          onValueChange={onDistritoChange}
          disabled={disabled || loading.distritos}
        >
          <SelectTrigger>
            <SelectValue placeholder={
              loading.distritos ? "Carregando distritos..." : "Selecione o distrito"
            } />
          </SelectTrigger>
          <SelectContent>
            {distritos.map((distrito) => (
              <SelectItem key={distrito} value={distrito}>
                {distrito}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Concelho */}
      <div>
        <Label htmlFor="concelho">Concelho *</Label>
        <Select 
          value={selectedConcelho} 
          onValueChange={onConcelhoChange}
          disabled={disabled || loading.concelhos || !selectedDistrito}
        >
          <SelectTrigger>
            <SelectValue placeholder={
              !selectedDistrito 
                ? "Primeiro selecione o distrito"
                : loading.concelhos 
                  ? "Carregando concelhos..." 
                  : "Selecione o concelho"
            } />
          </SelectTrigger>
          <SelectContent>
            {concelhos.map((concelho) => (
              <SelectItem key={concelho} value={concelho}>
                {concelho}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Freguesia - Opcional */}
      <div>
        <Label htmlFor="freguesia">Freguesia</Label>
        <Select 
          value={selectedFreguesia} 
          onValueChange={onFreguesiaChange}
          disabled={disabled || loading.freguesias || !selectedConcelho}
        >
          <SelectTrigger>
            <SelectValue placeholder={
              !selectedConcelho 
                ? "Primeiro selecione o concelho"
                : freguesias.length === 0
                  ? "Nenhuma freguesia disponível"
                  : loading.freguesias 
                    ? "Carregando freguesias..." 
                    : "Selecione a freguesia (opcional)"
            } />
          </SelectTrigger>
          <SelectContent>
            {freguesias.map((freguesia) => (
              <SelectItem key={freguesia} value={freguesia}>
                {freguesia}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Indicador de status das APIs */}
      <div className="text-xs text-gray-500">
        <p>
          📍 Dados fornecidos por APIs públicas portuguesas oficiais
        </p>
        {(loading.distritos || loading.concelhos || loading.freguesias) && (
          <p>⏳ Carregando dados geográficos...</p>
        )}
      </div>
    </div>
  )
}