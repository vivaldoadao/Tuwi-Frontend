"use client"

import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button" 
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Star, SlidersHorizontal, MapPin, Filter, Clock } from "lucide-react"
import BraiderCard from "@/components/braider-card"
import { portugalDistricts } from "@/lib/portugal-data"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Braider } from "@/lib/data"

interface BraidersClientProps {
  initialBraiders: Braider[]
  serverGeneratedAt: string
  serverPerformance: {
    fetchTime: number
    count: number
  }
}

export function BraidersClientComponent({ 
  initialBraiders, 
  serverGeneratedAt, 
  serverPerformance 
}: BraidersClientProps) {
  const [braiders, setBraiders] = useState<Braider[]>(initialBraiders)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [selectedDistrito, setSelectedDistrito] = useState("all")
  const [selectedConcelho, setSelectedConcelho] = useState("all")
  const [sortBy, setSortBy] = useState("rating") // rating, name, location
  const [showFilters, setShowFilters] = useState(false)

  // 🎯 FILTERED BRAIDERS com otimização useMemo
  const filteredBraiders = useMemo(() => {
    let filtered = braiders

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(braider =>
        braider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        braider.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        braider.bio.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Rating filter  
    if (selectedFilter === "top_rated") {
      filtered = filtered.filter(braider => (braider.averageRating || 0) >= 4.5)
    } else if (selectedFilter === "new") {
      // Ordenar por mais recentes (assumindo que têm menos reviews)
      filtered = filtered.filter(braider => (braider.totalReviews || 0) < 5)
    }

    // Location filters
    if (selectedDistrito !== "all") {
      filtered = filtered.filter(braider =>
        braider.location.toLowerCase().includes(selectedDistrito.toLowerCase())
      )
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.averageRating || 0) - (a.averageRating || 0)
        case "name":
          return a.name.localeCompare(b.name, 'pt')
        case "location":
          return a.location.localeCompare(b.location, 'pt')
        default:
          return 0
      }
    })

    return filtered
  }, [braiders, searchTerm, selectedFilter, selectedDistrito, sortBy])

  // 🎨 DISTRICTS para filtro
  const availableDistricts = useMemo(() => {
    const districts = new Set<string>()
    braiders.forEach(braider => {
      // Extract district from location (ex: "Lisboa, Portugal" -> "Lisboa")
      const parts = braider.location.split(',')
      if (parts.length > 0) {
        districts.add(parts[0].trim())
      }
    })
    return Array.from(districts).sort()
  }, [braiders])

  return (
    <div className="max-w-7xl mx-auto px-4 pb-16">
      
      {/* 📊 Performance Stats (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mb-6 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Server: {serverPerformance.fetchTime}ms
              </div>
              <div>Cache: {new Date(serverGeneratedAt).toLocaleTimeString('pt')}</div>
              <div>Total: {serverPerformance.count} braiders</div>
              <div>Filtered: {filteredBraiders.length}</div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 🔍 SEARCH & FILTERS */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, localização ou especialidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-lg py-6"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("all")}
              >
                Todas
              </Button>
              <Button
                variant={selectedFilter === "top_rated" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("top_rated")}
                className="flex items-center gap-1"
              >
                <Star className="h-3 w-3" />
                Top Rated
              </Button>
              <Button
                variant={selectedFilter === "new" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("new")}
              >
                Novas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1"
              >
                <SlidersHorizontal className="h-3 w-3" />
                Filtros
              </Button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <Select value={selectedDistrito} onValueChange={setSelectedDistrito}>
                  <SelectTrigger>
                    <SelectValue placeholder="Distrito/Região" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Distritos</SelectItem>
                    {availableDistricts.map(district => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Melhor Avaliação</SelectItem>
                    <SelectItem value="name">Nome A-Z</SelectItem>
                    <SelectItem value="location">Localização</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {filteredBraiders.length} trancista{filteredBraiders.length !== 1 ? 's' : ''} encontrada{filteredBraiders.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 👩‍🦱 BRAIDERS GRID */}
      {filteredBraiders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBraiders.map((braider) => (
            <BraiderCard key={braider.id} braider={braider} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma trancista encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                Tente ajustar os filtros ou termos de busca.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedFilter("all")
                  setSelectedDistrito("all")
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}