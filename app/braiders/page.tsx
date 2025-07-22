"use client" // Adicionar 'use client' pois haverá estado e interatividade

import SiteHeader from "@/components/site-header"
import BraiderCard from "@/components/braider-card"
import { allBraiders } from "@/lib/data"
import Image from "next/image"
import { Input } from "@/components/ui/input" // Importar Input
import { useState } from "react" // Importar useState

export default function BraidersPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredBraiders = allBraiders.filter((braider) =>
    braider.location.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-20">
        <div className="container px-4 md:px-6">
          <h1 className="text-4xl font-bold text-center mb-10 text-brand-primary">Encontre sua Trancista Ideal</h1>
          <div className="mb-8 max-w-md mx-auto">
            <Input
              type="text"
              placeholder="Buscar por localidade (ex: Lisboa, Porto)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-brand-accent focus:border-brand-accent"
            />
          </div>
          {filteredBraiders.length === 0 ? (
            <p className="text-center text-lg text-gray-700">
              Nenhuma trancista encontrada para a localidade "{searchTerm}".
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBraiders.map((braider) => (
                <BraiderCard key={braider.id} braider={braider} />
              ))}
            </div>
          )}
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
