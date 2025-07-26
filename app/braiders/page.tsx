"use client"

import SiteHeader from "@/components/site-header"
import BraiderCard from "@/components/braider-card"
import { allBraiders } from "@/lib/data"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { Search, Users, Star, SlidersHorizontal } from "lucide-react"

export default function BraidersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")

  // Filter braiders based on search and filters
  const filteredBraiders = allBraiders.filter((braider) => {
    const matchesSearch = 
      braider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      braider.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      braider.bio.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = selectedFilter === "all" || braider.status === selectedFilter
    
    return matchesSearch && matchesFilter
  })

  // Sort braiders
  const sortedBraiders = [...filteredBraiders].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name)
      case "location":
        return a.location.localeCompare(b.location)
      case "services":
        return b.services.length - a.services.length
      default:
        return 0
    }
  })

  const approvedCount = allBraiders.filter(b => b.status === 'approved').length
  const totalServices = allBraiders.reduce((sum, b) => sum + b.services.length, 0)

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <SiteHeader />
      
      {/* Modern Hero Section */}
      <div className="relative bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold font-heading mb-4">
              Encontre sua{" "}
              <span className="bg-gradient-to-r from-accent-300 to-accent-400 bg-clip-text text-transparent">
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
                    <Star className="h-6 w-6 fill-accent-400 text-accent-400" />
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
                    className="pl-12 h-14 text-lg bg-gray-50 border-gray-200 rounded-2xl focus:ring-accent-500 focus:border-accent-500 transition-all duration-300"
                  />
                </div>

                {/* Filters and Sort */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  
                  {/* Filter Buttons */}
                  <div className="flex items-center gap-3">
                    <SlidersHorizontal className="h-5 w-5 text-gray-600" />
                    <div className="flex gap-2">
                      <Button
                        variant={selectedFilter === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedFilter("all")}
                        className={`rounded-full ${
                          selectedFilter === "all" 
                            ? "bg-accent-500 hover:bg-accent-600 text-white" 
                            : "hover:bg-accent-50 hover:text-accent-700"
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
                            ? "bg-accent-500 hover:bg-accent-600 text-white" 
                            : "hover:bg-accent-50 hover:text-accent-700"
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
                            ? "bg-accent-500 hover:bg-accent-600 text-white" 
                            : "hover:bg-accent-50 hover:text-accent-700"
                        }`}
                      >
                        Novas
                      </Button>
                    </div>
                  </div>

                  {/* Sort Options */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">Ordenar por:</span>
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-accent-500 focus:border-accent-500"
                    >
                      <option value="name">Nome</option>
                      <option value="location">Localização</option>
                      <option value="services">Nº de Serviços</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="space-y-6">
            
            {/* Results Count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold font-heading text-gray-900">
                  {sortedBraiders.length === 0 ? "Nenhuma trancista encontrada" : "Nossas Trancistas"}
                </h2>
                <Badge variant="secondary" className="bg-accent-100 text-accent-700 px-3 py-1">
                  {sortedBraiders.length} {sortedBraiders.length === 1 ? "resultado" : "resultados"}
                </Badge>
              </div>
              
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Limpar busca
                </Button>
              )}
            </div>

            {/* Braiders Grid */}
            {sortedBraiders.length === 0 ? (
              <Card className="bg-white/90 backdrop-blur-sm shadow-lg rounded-3xl border-0">
                <CardContent className="text-center py-16">
                  <div className="text-6xl mb-6">🔍</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Nenhuma trancista encontrada</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {searchTerm 
                      ? `Não encontramos trancistas que correspondem à busca "${searchTerm}". Tente outros termos.`
                      : "Não há trancistas disponíveis no momento com os filtros selecionados."
                    }
                  </p>
                  {searchTerm && (
                    <Button 
                      onClick={() => setSearchTerm("")}
                      className="bg-accent-500 hover:bg-accent-600 text-white rounded-full"
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
          <Card className="bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-2xl rounded-3xl border-0 overflow-hidden mt-16">
            <CardContent className="text-center p-12">
              <h3 className="text-3xl font-bold font-heading mb-4">Você é uma Trancista?</h3>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Junte-se à nossa comunidade de profissionais e conecte-se com novos clientes. 
                Cadastre-se agora e faça parte da Wilnara Tranças!
              </p>
              <Button
                size="lg"
                className="bg-white text-accent-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Users className="mr-2 h-5 w-5" />
                Cadastre-se como Trancista
              </Button>
            </CardContent>
          </Card>

        </div>
      </main>

      {/* Modern Footer */}
      <footer className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 text-white py-12 mt-16">
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
            <span className="text-2xl font-bold font-heading text-accent-300">WILNARA TRANÇAS</span>
          </div>
          <p className="text-white/80">
            © {new Date().getFullYear()} Wilnara Tranças. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
