"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import SiteHeader from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"
import { useFavorites } from "@/context/favorites-context"
import { getAllProducts, getAllBraiders, type Product, type Braider } from "@/lib/data-supabase"
import { 
  Heart, 
  Search, 
  Star, 
  MapPin, 
  Package, 
  Award, 
  ShoppingBag, 
  Calendar,
  Filter,
  Grid3X3,
  List,
  Trash2,
  Eye,
  Clock,
  Euro,
  Phone,
  MessageSquare,
  TrendingUp
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

type ViewMode = 'grid' | 'list'

export default function FavoritesPage() {
  const { user } = useAuth()
  const { favoriteProducts, favoriteBraiders, removeFavoriteProduct, removeFavoriteBraider } = useFavorites()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [braiders, setBraiders] = useState<Braider[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const fetchData = async () => {
      setLoading(true)
      try {
        const [allProductsData, allBraidersData] = await Promise.all([
          getAllProducts(),
          getAllBraiders()
        ])
        setProducts(allProductsData)
        setBraiders(allBraidersData.braiders)
      } catch (error) {
        console.error('Error fetching favorites data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, router])

  const favoriteProductsList = products.filter(product => 
    favoriteProducts.includes(product.id)
  )
  
  const favoriteBraidersList = braiders.filter(braider => 
    favoriteBraiders.includes(braider.id) && braider.status === "approved"
  )

  const filteredProducts = favoriteProductsList.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredBraiders = favoriteBraidersList.filter(braider =>
    braider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    braider.location.toLowerCase().includes(searchTerm.toLowerCase())
  )


  if (!user) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <SiteHeader />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 py-16 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-3xl"></div>
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-4 border-white/30">
                <Heart className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-5xl font-bold font-heading mb-2">
                  Meus Favoritos 💖
                </h1>
                <p className="text-white/90 text-xl">
                  Seus produtos e trancistas favoritos em um só lugar
                </p>
                <p className="text-white/80 text-sm mt-2">
                  Gerencie e acesse rapidamente seus itens salvos
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <div className="text-3xl font-bold">{favoriteProductsList.length}</div>
                <div className="text-white/80 font-medium">Produtos</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <div className="text-3xl font-bold">{favoriteBraidersList.length}</div>
                <div className="text-white/80 font-medium">Trancistas</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 py-12">
        <div className="container px-4 md:px-6">
          {/* Search and Controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar nos favoritos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl border-gray-200 bg-white"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="rounded-xl"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="rounded-xl"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Favorites Tabs */}
          <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto mb-8 rounded-2xl">
              <TabsTrigger value="products" className="rounded-xl flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produtos ({favoriteProductsList.length})
              </TabsTrigger>
              <TabsTrigger value="braiders" className="rounded-xl flex items-center gap-2">
                <Award className="h-4 w-4" />
                Trancistas ({favoriteBraidersList.length})
              </TabsTrigger>
            </TabsList>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-6">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-64 bg-gray-200 rounded-2xl"></div>
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
                  <CardContent className="text-center py-16">
                    <Package className="h-20 w-20 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {searchTerm ? "Nenhum produto encontrado" : "Nenhum produto favorito"}
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      {searchTerm 
                        ? "Tente usar termos diferentes na sua pesquisa" 
                        : "Comece a adicionar produtos aos seus favoritos para vê-los aqui"
                      }
                    </p>
                    <Button asChild className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl">
                      <Link href="/products">
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Explorar Produtos
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className={cn(
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-4"
                )}>
                  {filteredProducts.map((product) => (
                    <Card key={product.id} className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0 hover:shadow-2xl transition-all duration-300 group">
                      <CardContent className={cn(
                        "p-6",
                        viewMode === 'list' && "flex items-center gap-6"
                      )}>
                        <div className={cn(
                          "relative mb-4",
                          viewMode === 'list' && "w-32 h-32 mb-0 flex-shrink-0"
                        )}>
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            width={viewMode === 'list' ? 128 : 300}
                            height={viewMode === 'list' ? 128 : 200}
                            className="w-full h-48 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                            unoptimized={true}
                          />
                          <div className="absolute top-3 right-3 flex gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => removeFavoriteProduct(product.id)}
                              className="w-8 h-8 bg-white/90 hover:bg-red-50 hover:border-red-300 rounded-full"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-xl font-bold font-heading text-gray-900 group-hover:text-pink-600 transition-colors">
                              {product.name}
                            </h3>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-pink-600">€{product.price.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {product.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                <span className="text-sm font-semibold">4.8</span>
                                <span className="text-xs text-gray-500">(124)</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button asChild size="sm" variant="outline" className="rounded-xl">
                                <Link href={`/products/${product.id}`}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver
                                </Link>
                              </Button>
                              <Button size="sm" className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl">
                                <ShoppingBag className="h-4 w-4 mr-1" />
                                Comprar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Braiders Tab */}
            <TabsContent value="braiders" className="space-y-6">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-80 bg-gray-200 rounded-2xl"></div>
                    </div>
                  ))}
                </div>
              ) : filteredBraiders.length === 0 ? (
                <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
                  <CardContent className="text-center py-16">
                    <Award className="h-20 w-20 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {searchTerm ? "Nenhuma trancista encontrada" : "Nenhuma trancista favorita"}
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      {searchTerm 
                        ? "Tente usar termos diferentes na sua pesquisa" 
                        : "Comece a adicionar trancistas aos seus favoritos para vê-las aqui"
                      }
                    </p>
                    <Button asChild className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl">
                      <Link href="/braiders">
                        <Award className="h-4 w-4 mr-2" />
                        Encontrar Trancistas
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className={cn(
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-4"
                )}>
                  {filteredBraiders.map((braider) => (
                    <Card key={braider.id} className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0 hover:shadow-2xl transition-all duration-300 group">
                      <CardContent className={cn(
                        "p-6",
                        viewMode === 'list' && "flex items-center gap-6"
                      )}>
                        <div className={cn(
                          "relative mb-4",
                          viewMode === 'list' && "w-32 h-32 mb-0 flex-shrink-0"
                        )}>
                          <Image
                            src={braider.profileImageUrl}
                            alt={braider.name}
                            width={viewMode === 'list' ? 128 : 300}
                            height={viewMode === 'list' ? 128 : 200}
                            className="w-full h-48 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                            unoptimized={true}
                          />
                          <div className="absolute top-3 right-3 flex gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => removeFavoriteBraider(braider.id)}
                              className="w-8 h-8 bg-white/90 hover:bg-red-50 hover:border-red-300 rounded-full"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                          <Badge className="absolute bottom-3 left-3 bg-green-500 text-white">
                            {braider.status === "approved" ? "Verificada" : "Pendente"}
                          </Badge>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-xl font-bold font-heading text-gray-900 group-hover:text-pink-600 transition-colors">
                              {braider.name}
                            </h3>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-semibold">4.9</span>
                              <span className="text-xs text-gray-500">(87)</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                            <MapPin className="h-4 w-4" />
                            <span>{braider.location}</span>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {braider.bio}
                          </p>
                          
                          <div className="flex items-center gap-2 mb-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {braider.services.length} serviços
                            </div>
                            <span className="text-gray-300">•</span>
                            <div className="text-sm text-gray-600">
                              A partir de €{Math.min(...braider.services.map(s => s.price)).toFixed(0)}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {braider.contactPhone}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button asChild size="sm" variant="outline" className="rounded-xl">
                                <Link href={`/braiders/${braider.id}`}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver Perfil
                                </Link>
                              </Button>
                              <Button asChild size="sm" className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl">
                                <Link href={`/braiders/${braider.id}/book`}>
                                  <Calendar className="h-4 w-4 mr-1" />
                                  Agendar
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <footer className="bg-brand-primary text-white py-8">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/wilnara-logo.png"
              alt="Wilnara Tranças Logo"
              width={30}
              height={30}
              className="rounded-full"
              unoptimized={true}
            />
            <span className="text-lg font-bold text-brand-accent">WILNARA TRANÇAS</span>
          </div>
          <p className="text-sm text-white/80">
            © {new Date().getFullYear()} Wilnara Tranças. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}