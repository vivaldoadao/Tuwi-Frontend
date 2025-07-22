"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { getBraiderById, updateBraiderProfile, type Braider } from "@/lib/data" // Importar updateBraiderProfile

export default function BraiderProfileSettingsPage() {
  // Simular que o braider-1 está logado
  const braiderId = "braider-1"
  const initialBraider = getBraiderById(braiderId)

  const [braider, setBraider] = useState<Braider | undefined>(initialBraider)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    // Em um cenário real, você buscaria o perfil da trancista logada aqui
    if (!initialBraider) {
      setMessage({ type: "error", text: "Perfil da trancista não encontrado." })
    }
  }, [initialBraider])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    if (braider) {
      setBraider({ ...braider, [id]: value })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (!braider) {
      setMessage({ type: "error", text: "Erro: Dados do perfil ausentes." })
      return
    }

    setLoading(true)
    const result = await updateBraiderProfile(braider.id, {
      name: braider.name,
      bio: braider.bio,
      location: braider.location,
      contactEmail: braider.contactEmail,
      contactPhone: braider.contactPhone,
      profileImageUrl: braider.profileImageUrl,
      // Não atualizamos serviços ou portfolioImages por aqui neste formulário simplificado
    })

    if (result.success) {
      setMessage({ type: "success", text: result.message })
    } else {
      setMessage({ type: "error", text: result.message })
    }
    setLoading(false)
  }

  if (!braider && !message) {
    return <p className="text-gray-700">Carregando perfil...</p>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-brand-primary">Configurar Meu Perfil</h2>
      <Card className="bg-white text-gray-900 shadow-lg rounded-lg p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-2xl font-bold text-brand-primary">Informações Pessoais</CardTitle>
          <CardDescription className="text-gray-700">Atualize suas informações de contato e biografia.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {message && (
            <div
              className={`mb-4 p-3 rounded-md text-center ${
                message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}
          {braider ? (
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-gray-900">
                  Nome
                </Label>
                <Input
                  id="name"
                  value={braider.name}
                  onChange={handleChange}
                  className="bg-gray-100 border-gray-300 text-gray-900 focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bio" className="text-gray-900">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  value={braider.bio}
                  onChange={handleChange}
                  rows={4}
                  className="bg-gray-100 border-gray-300 text-gray-900 focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location" className="text-gray-900">
                  Localidade
                </Label>
                <Input
                  id="location"
                  value={braider.location}
                  onChange={handleChange}
                  className="bg-gray-100 border-gray-300 text-gray-900 focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contactEmail" className="text-gray-900">
                  Email de Contato
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={braider.contactEmail}
                  onChange={handleChange}
                  className="bg-gray-100 border-gray-300 text-gray-900 focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contactPhone" className="text-gray-900">
                  Telefone de Contato
                </Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={braider.contactPhone}
                  onChange={handleChange}
                  className="bg-gray-100 border-gray-300 text-gray-900 focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-brand-accent hover:bg-brand-background text-brand-primary hover:text-white px-8 py-3 text-lg font-semibold rounded-full transition-colors shadow-lg mt-4"
                disabled={loading}
              >
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </form>
          ) : (
            <p className="text-red-500">Não foi possível carregar o perfil da trancista.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
