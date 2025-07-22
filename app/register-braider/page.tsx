"use client"

import type React from "react"
import { useState } from "react"
import SiteHeader from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { addBraider } from "@/lib/data"
import Image from "next/image"
import { cn } from "@/lib/utils"

export default function RegisterBraiderPage() {
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [location, setLocation] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [profileImageUrl, setProfileImageUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!name || !bio || !location || !contactEmail || !contactPhone) {
      setMessage({ type: "error", text: "Por favor, preencha todos os campos obrigatórios." })
      return
    }

    setLoading(true)
    const result = await addBraider({
      name,
      bio,
      location,
      contactEmail,
      contactPhone,
      profileImageUrl,
    })

    if (result.success) {
      setMessage({ type: "success", text: result.message })
      // Clear form
      setName("")
      setBio("")
      setLocation("")
      setContactEmail("")
      setContactPhone("")
      setProfileImageUrl("")
    } else {
      setMessage({ type: "error", text: result.message })
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-20 flex items-center justify-center">
        <Card className="w-full max-w-2xl bg-white text-gray-900 shadow-lg rounded-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-brand-primary">Torne-se uma Trancista Parceira</CardTitle>
            <CardDescription className="text-gray-700">
              Preencha o formulário abaixo para se juntar à nossa rede de trancistas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-gray-900">
                  Seu Nome Completo
                </Label>
                <Input
                  id="name"
                  placeholder="Nome e Sobrenome"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bio" className="text-gray-900">
                  Sua Biografia (Fale sobre você e sua experiência)
                </Label>
                <Textarea
                  id="bio"
                  placeholder="Ex: Especialista em Box Braids com 5 anos de experiência..."
                  rows={4}
                  required
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location" className="text-gray-900">
                  Sua Localidade (Cidade, País)
                </Label>
                <Input
                  id="location"
                  placeholder="Ex: Lisboa, Portugal"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contactEmail" className="text-gray-900">
                  Email de Contato
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contactPhone" className="text-gray-900">
                  Telefone de Contato
                </Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  placeholder="(XX) XXXXX-XXXX"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="profileImageUrl" className="text-gray-900">
                  URL da Imagem de Perfil (Opcional)
                </Label>
                <Input
                  id="profileImageUrl"
                  placeholder="https://exemplo.com/sua-foto.jpg"
                  value={profileImageUrl}
                  onChange={(e) => setProfileImageUrl(e.target.value)}
                  className="bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>

              {message && (
                <div
                  className={cn(
                    "p-3 rounded-md text-center",
                    message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
                  )}
                >
                  {message.text}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-brand-accent hover:bg-brand-background text-brand-primary hover:text-white px-8 py-3 text-lg font-semibold rounded-full transition-colors shadow-lg"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar Cadastro"}
              </Button>
            </form>
          </CardContent>
        </Card>
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
