"use client"

import SiteHeader from "@/components/site-header"
import BraiderCard from "@/components/braider-card"
import { getAllBraidersLegacy } from "@/lib/data-supabase"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { Search, Star, SlidersHorizontal, MapPin, Filter } from "lucide-react"
import BraiderRegisterButton from "@/components/auth/braider-register-button"
import { Braider } from "@/lib/data"
import { portugalDistricts } from "@/lib/portugal-data"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function BraidersPage() {
  const [braiders, setBraiders] = useState<Braider[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [selectedDistrito, setSelectedDistrito] = useState("all")
  const [selectedConcelho, setSelectedConcelho] = useState("all")
  const [selectedFreguesia, setSelectedFreguesia] = useState("all")
  const [sortBy, setSortBy] = useState("name")

  // Load braiders from database
  useEffect(() => {
    async function loadBraiders() {
      try {
        setLoading(true)
        console.log('Starting to load braiders...')
        const data = await getAllBraidersLegacy()
        console.log('Braiders loaded:', data.length, data)
        setBraiders(data)
      } catch (error) {
        console.error('Error loading braiders:', error)
      } finally {
        setLoading(false)
      }
    }
    loadBraiders()
  }, [])

  // Get available distritos from actual braider data
  const availableDistritos = Array.from(new Set(
    braiders
      .filter(b => b.district)
      .map(b => b.district!)
  )).sort()
  
  // Get available concelhos based on selected distrito and actual data
  const availableConcelhos = selectedDistrito !== "all" 
    ? Array.from(new Set(
        braiders
          .filter(b => b.district === selectedDistrito && b.concelho)
          .map(b => b.concelho!)
      )).sort()
    : []

  // Get available freguesias based on selected concelho and actual data
  const availableFreguesias = selectedDistrito !== "all" && selectedConcelho !== "all" 
    ? Array.from(new Set(
        braiders
          .filter(b => b.district === selectedDistrito && b.concelho === selectedConcelho && b.freguesia)
          .map(b => b.freguesia!)
      )).sort()
    : []

  // Clear child filters when parent changes
  useEffect(() => {
    if (selectedDistrito === "all") {
      setSelectedConcelho("all")
      setSelectedFreguesia("all")
    }
  }, [selectedDistrito])

  useEffect(() => {
    if (selectedConcelho === "all") {
      setSelectedFreguesia("all")
    }
  }, [selectedConcelho])

  // Enhanced filtering with Portuguese location hierarchy
  const filteredBraiders = braiders.filter((braider) => {
    const matchesSearch = 
      braider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      braider.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      braider.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (braider.district && braider.district.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (braider.concelho && braider.concelho.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (braider.freguesia && braider.freguesia.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesFilter = selectedFilter === "all" || braider.status === selectedFilter
    
    const matchesDistrito = selectedDistrito === "all" || braider.district === selectedDistrito
    const matchesConcelho = selectedConcelho === "all" || braider.concelho === selectedConcelho  
    const matchesFreguesia = selectedFreguesia === "all" || braider.freguesia === selectedFreguesia
    
    return matchesSearch && matchesFilter && matchesDistrito && matchesConcelho && matchesFreguesia
  })

  // Enhanced sorting with location option
  const sortedBraiders = [...filteredBraiders].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name)
      case "location":
        return a.location.localeCompare(b.location)
      case "services":
        return b.services.length - a.services.length
      case "experience":
        const getExperienceWeight = (exp?: string) => {
          if (!exp) return 0
          if (exp === "iniciante") return 1
          if (exp === "1-2") return 2
          if (exp === "3-5") return 3
          if (exp === "6-10") return 4
          if (exp === "10+") return 5
          return 0
        }
        return getExperienceWeight(b.yearsExperience) - getExperienceWeight(a.yearsExperience)
      default:
        return 0
    }
  })

  const approvedCount = braiders.filter(b => b.status === 'approved').length
  const totalServices = braiders.reduce((sum, b) => sum + b.services.length, 0)

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <SiteHeader />
      
      {/* Modern Hero Section */}
      <div className="relative bg-gradient-to-r from-brand-700 via-brand-800 to-accent-700 text-white overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-gradient-to-r from-brand-700 via-brand-800 to-accent-700 flex items-center justify-center z-10">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg">Carregando trancistas...</p>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold font-heading mb-4">
              Encontre sua{" "}
              <span className="text-accent-200">
                Trancista Ideal
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Descubra profissionais talentosas especializadas na arte das tranças. 
              Conecte-se com quem entende do assunto e transforme seu visual!
            </p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
              <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
                <CardContent className="text-center p-6">
                  <div className="text-3xl font-bold mb-2">{approvedCount}</div>
                  <div className="text-sm text-white/80">Trancistas Verificadas</div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
                <CardContent className="text-center p-6">
                  <div className="text-3xl font-bold mb-2">{totalServices}</div>
                  <div className="text-sm text-white/80">Serviços Disponíveis</div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
                <CardContent className="text-center p-6">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <Star className="h-6 w-6 fill-accent-200 text-accent-200" />
                    <span className="text-3xl font-bold">4.8</span>
                  </div>
                  <div className="text-sm text-white/80">Avaliação Média</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 -mt-16 relative z-10">
        <div className="container mx-auto px-4 space-y-8">
          
          {/* Modern Search and Filter Section */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl border-0">
            <CardContent className="p-8">
              <div className="space-y-6">
                
                {/* Search Bar */}
                <div className="relative max-w-2xl mx-auto">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar por nome, localidade ou especialidade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-14 text-lg bg-gray-50 border-gray-200 rounded-2xl focus:ring-brand-500 focus:border-brand-500 transition-all duration-300"
                  />
                </div>

                {/* Filters and Sort */}
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                  
                  {/* Filter Buttons */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <SlidersHorizontal className="h-5 w-5 text-gray-600" />
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant={selectedFilter === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedFilter("all")}
                        className={`rounded-full ${
                          selectedFilter === "all" 
                            ? "bg-brand-500 hover:bg-brand-600 text-white" 
                            : "hover:bg-brand-50 hover:text-brand-700"
                        }`}
                      >
                        Todas
                      </Button>
                      <Button
                        variant={selectedFilter === "approved" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedFilter("approved")}
                        className={`rounded-full ${
                          selectedFilter === "approved" 
                            ? "bg-brand-500 hover:bg-brand-600 text-white" 
                            : "hover:bg-brand-50 hover:text-brand-700"
                        }`}
                      >
                        Verificadas
                      </Button>
                      <Button
                        variant={selectedFilter === "pending" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedFilter("pending")}
                        className={`rounded-full ${
                          selectedFilter === "pending" 
                            ? "bg-brand-500 hover:bg-brand-600 text-white" 
                            : "hover:bg-brand-50 hover:text-brand-700"
                        }`}
                      >
                        Novas
                      </Button>
                    </div>
                  </div>

                  {/* Portuguese Location Filters and Sort */}
                  <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
                    
                    {/* Portuguese Location Hierarchy */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <MapPin className="h-5 w-5 text-gray-600" />
                      
                      {/* Distrito Filter */}
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 mb-1">Distrito</span>
                        <Select value={selectedDistrito} onValueChange={setSelectedDistrito}>
                          <SelectTrigger className="w-40 bg-gray-50 border-gray-200 rounded-xl">
                            <SelectValue placeholder="Distrito" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {availableDistritos.map((distrito) => (
                              <SelectItem key={distrito} value={distrito}>
                                {distrito}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Concelho Filter */}
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 mb-1">Concelho</span>
                        <Select 
                          value={selectedConcelho} 
                          onValueChange={setSelectedConcelho}
                          disabled={selectedDistrito === "all"}
                        >
                          <SelectTrigger className="w-40 bg-gray-50 border-gray-200 rounded-xl">
                            <SelectValue placeholder="Concelho" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {availableConcelhos.map((concelho) => (
                              <SelectItem key={concelho} value={concelho}>
                                {concelho}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Freguesia Filter */}
                      {availableFreguesias.length > 0 && (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 mb-1">Freguesia</span>
                          <Select 
                            value={selectedFreguesia} 
                            onValueChange={setSelectedFreguesia}
                            disabled={selectedConcelho === "all"}
                          >
                            <SelectTrigger className="w-40 bg-gray-50 border-gray-200 rounded-xl">
                              <SelectValue placeholder="Freguesia" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas</SelectItem>
                              {availableFreguesias.map((freguesia) => (
                                <SelectItem key={freguesia} value={freguesia}>
                                  {freguesia}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Sort Options */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">Ordenar por:</span>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-40 bg-gray-50 border-gray-200 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Nome</SelectItem>
                          <SelectItem value="location">Localização</SelectItem>
                          <SelectItem value="services">Nº de Serviços</SelectItem>
                          <SelectItem value="experience">Experiência</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="space-y-6">
            
            {/* Results Count and Filters Summary */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold font-heading text-gray-900">
                  {loading ? "Carregando..." : sortedBraiders.length === 0 ? "Nenhuma trancista encontrada" : "Nossas Trancistas"}
                </h2>
                <Badge variant="secondary" className="bg-brand-100 text-brand-700 px-3 py-1">
                  {sortedBraiders.length} {sortedBraiders.length === 1 ? "resultado" : "resultados"}
                </Badge>
                
                {/* Location filter badges */}
                {selectedDistrito !== "all" && (
                  <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                    📍 {selectedDistrito}
                  </Badge>
                )}
                {selectedConcelho !== "all" && (
                  <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                    🏘️ {selectedConcelho}
                  </Badge>
                )}
                {selectedFreguesia !== "all" && (
                  <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">
                    🏡 {selectedFreguesia}
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2">
                {(searchTerm || selectedDistrito !== "all" || selectedConcelho !== "all" || selectedFreguesia !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedDistrito("all")
                      setSelectedConcelho("all")
                      setSelectedFreguesia("all")
                      setSelectedFilter("all")
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Limpar filtros
                  </Button>
                )}
              </div>
            </div>

            {/* Braiders Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="bg-white/90 backdrop-blur-sm shadow-lg rounded-3xl border-0 animate-pulse">
                    <CardContent className="p-6">
                      <div className="bg-gray-200 h-48 rounded-2xl mb-4"></div>
                      <div className="space-y-2">
                        <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                        <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                        <div className="bg-gray-200 h-3 rounded w-full"></div>
                        <div className="bg-gray-200 h-3 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : sortedBraiders.length === 0 ? (
              <Card className="bg-white/90 backdrop-blur-sm shadow-lg rounded-3xl border-0">
                <CardContent className="text-center py-16">
                  <div className="text-6xl mb-6">🔍</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Nenhuma trancista encontrada</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {searchTerm || selectedDistrito !== "all" || selectedConcelho !== "all" || selectedFreguesia !== "all"
                      ? "Não encontramos trancistas que correspondem aos filtros selecionados. Tente ajustar os filtros."
                      : "Não há trancistas disponíveis no momento."
                    }
                  </p>
                  {(searchTerm || selectedDistrito !== "all" || selectedConcelho !== "all" || selectedFreguesia !== "all") && (
                    <Button 
                      onClick={() => {
                        setSearchTerm("")
                        setSelectedDistrito("all")
                        setSelectedConcelho("all")
                        setSelectedFreguesia("all")
                        setSelectedFilter("all")
                      }}
                      className="bg-brand-500 hover:bg-brand-600 text-white rounded-full"
                    >
                      Ver todas as trancistas
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {sortedBraiders.map((braider) => (
                  <BraiderCard key={braider.id} braider={braider} />
                ))}
              </div>
            )}
          </div>

          {/* Call to Action Section */}
          <Card className="bg-gradient-to-r from-brand-600 to-accent-600 text-white shadow-2xl rounded-3xl border-0 overflow-hidden mt-16">
            <CardContent className="text-center p-12">
              <h3 className="text-3xl font-bold font-heading mb-4">Você é uma Trancista?</h3>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Junte-se à nossa comunidade de {approvedCount} profissionais verificadas e conecte-se com novos clientes. 
                Cadastre-se agora e faça parte da Wilnara Tranças!
              </p>
              <BraiderRegisterButton 
                variant="default"
                className="bg-white text-brand-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              />
            </CardContent>
          </Card>

        </div>
      </main>

      {/* Modern Footer */}
      <footer className="bg-gradient-to-r from-brand-800 to-brand-900 text-white py-12 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image
              src="/wilnara-logo.png"
              alt="Wilnara Tranças Logo"
              width={40}
              height={40}
              className="rounded-full"
              unoptimized={true}
            />
            <span className="text-2xl font-bold font-heading text-brand-200">WILNARA TRANÇAS</span>
          </div>
          <p className="text-white/80">
            © {new Date().getFullYear()} Wilnara Tranças. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}