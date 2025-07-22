"use client"

import Image from "next/image"
import { notFound } from "next/navigation"
import SiteHeader from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getBraiderById } from "@/lib/data"
import { MapPin, Phone, Mail, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useState } from "react" // Importar useState

export default function BraiderDetailPage({ params }: { params: { id: string } }) {
  const braider = getBraiderById(params.id)
  const [currentPortfolioImageIndex, setCurrentPortfolioImageIndex] = useState(0)

  if (!braider) {
    notFound()
  }

  const hasMultiplePortfolioImages = braider.portfolioImages && braider.portfolioImages.length > 1

  const handleNextPortfolioImage = () => {
    setCurrentPortfolioImageIndex((prevIndex) => (prevIndex + 1) % braider.portfolioImages.length)
  }

  const handlePrevPortfolioImage = () => {
    setCurrentPortfolioImageIndex((prevIndex) => (prevIndex === 0 ? braider.portfolioImages.length - 1 : prevIndex - 1))
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-20">
        <div className="container px-4 md:px-6">
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
                </div>
                <Button
                  asChild
                  className="w-full bg-brand-accent hover:bg-brand-background text-brand-primary hover:text-white px-8 py-3 text-lg font-semibold rounded-full transition-colors shadow-lg mt-4"
                >
                  <Link href={`/braiders/${braider.id}/book`}>Agendar um Serviço</Link>
                </Button>
              </div>

              {/* Services and Portfolio */}
              <div className="md:col-span-2 space-y-8">
                {/* Services */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-brand-primary border-b pb-2">Serviços Oferecidos</h2>
                  <div className="grid gap-4">
                    {braider.services.map((service) => (
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
                            <h3 className="font-bold text-lg text-brand-primary">{service.name}</h3>
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
                </div>

                {/* Portfolio Carousel */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-brand-primary border-b pb-2">Portfólio</h2>
                  {braider.portfolioImages && braider.portfolioImages.length > 0 ? (
                    <div className="relative">
                      <Image
                        src={braider.portfolioImages[currentPortfolioImageIndex] || "/placeholder.svg"}
                        alt={`Portfólio de ${braider.name} ${currentPortfolioImageIndex + 1}`}
                        width={600}
                        height={400}
                        className="rounded-lg object-cover w-full h-[300px] shadow-md"
                        unoptimized={true}
                      />
                      {hasMultiplePortfolioImages && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 hover:text-white"
                            onClick={handlePrevPortfolioImage}
                          >
                            <ChevronLeft className="h-5 w-5" />
                            <span className="sr-only">Imagem anterior</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 hover:text-white"
                            onClick={handleNextPortfolioImage}
                          >
                            <ChevronRight className="h-5 w-5" />
                            <span className="sr-only">Próxima imagem</span>
                          </Button>
                          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                            {braider.portfolioImages.map((_, index) => (
                              <span
                                key={index}
                                className={`h-2 w-2 rounded-full ${index === currentPortfolioImageIndex ? "bg-white" : "bg-gray-400"}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600">Nenhuma imagem de portfólio disponível.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
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
