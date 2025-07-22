"use client"

import { useEffect, useState } from "react"
import { notFound } from "next/navigation"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Mail, Clock, Edit, Trash2, PlusCircle } from "lucide-react"
import { getBraiderById, type Braider, type Service } from "@/lib/data"

export default function DashboardBraiderDetailPage({ params }: { params: { id: string } }) {
  const [braider, setBraider] = useState<Braider | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBraider = async () => {
      setLoading(true)
      const fetchedBraider = getBraiderById(params.id) // Simula a busca
      setBraider(fetchedBraider)
      setLoading(false)
    }
    fetchBraider()
  }, [params.id])

  if (loading) {
    return <p className="text-gray-700">Carregando detalhes da trancista...</p>
  }

  if (!braider) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-brand-primary">Detalhes da Trancista: {braider.name}</h2>

      <Card className="bg-white text-gray-900 shadow-lg rounded-lg overflow-hidden">
        <CardContent className="grid md:grid-cols-3 gap-8 p-6 md:p-8">
          {/* Braider Info */}
          <div className="md:col-span-1 flex flex-col items-center text-center space-y-4">
            <Image
              src={braider.profileImageUrl || "/placeholder.svg?height=250&width=250&text=Trancista"}
              alt={braider.name}
              width={250}
              height={250}
              className="rounded-full object-cover border-4 border-brand-accent shadow-md"
              unoptimized={true}
            />
            <h1 className="text-3xl font-bold text-brand-primary">{braider.name}</h1>
            <p className="text-md text-gray-700">{braider.bio}</p>
            <div className="space-y-2 text-left w-full max-w-xs">
              <div className="flex items-center text-gray-700">
                <MapPin className="h-5 w-5 mr-2 text-brand-accent" />
                {braider.location}
              </div>
              <div className="flex items-center text-gray-700">
                <Phone className="h-5 w-5 mr-2 text-brand-accent" />
                {braider.contactPhone}
              </div>
              <div className="flex items-center text-gray-700">
                <Mail className="h-5 w-5 mr-2 text-brand-accent" />
                {braider.contactEmail}
              </div>
              <div className="flex items-center text-gray-700">
                Status:{" "}
                <span
                  className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                    braider.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : braider.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {braider.status === "pending" && "Pendente"}
                  {braider.status === "approved" && "Aprovada"}
                  {braider.status === "rejected" && "Rejeitada"}
                </span>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white bg-transparent"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Perfil
              </Button>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Trancista
              </Button>
            </div>
          </div>

          {/* Services and Portfolio */}
          <div className="md:col-span-2 space-y-8">
            {/* Services */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-brand-primary border-b pb-2">Serviços Oferecidos</h3>
              {braider.services && braider.services.length > 0 ? (
                <div className="grid gap-4">
                  {braider.services.map((service: Service) => (
                    <Card key={service.id} className="bg-gray-50 shadow-sm rounded-lg">
                      <CardContent className="flex items-center gap-4 p-4">
                        <Image
                          src={service.imageUrl || "/placeholder.svg?height=80&width=80&text=Servico"}
                          alt={service.name}
                          width={80}
                          height={80}
                          className="rounded-md object-cover"
                          unoptimized={true}
                        />
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-brand-primary">{service.name}</h4>
                          <p className="text-sm text-gray-700">{service.description}</p>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <Clock className="h-4 w-4 mr-1" />
                            {service.durationMinutes} min
                          </div>
                        </div>
                        <p className="font-semibold text-brand-accent text-xl">€{service.price.toFixed(2)}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Nenhum serviço cadastrado.</p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white bg-transparent"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Adicionar Serviço
              </Button>
            </div>

            {/* Portfolio Images */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-brand-primary border-b pb-2">Portfólio de Imagens</h3>
              {braider.portfolioImages && braider.portfolioImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {braider.portfolioImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={image || "/placeholder.svg"}
                        alt={`Portfólio ${index + 1}`}
                        width={200}
                        height={150}
                        className="rounded-lg object-cover w-full h-32 shadow-sm"
                        unoptimized={true}
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remover imagem</span>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Nenhuma imagem de portfólio disponível.</p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white bg-transparent"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Adicionar Imagem
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
