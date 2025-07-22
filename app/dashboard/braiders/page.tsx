"use client"

import { CardDescription } from "@/components/ui/card"

import { useEffect, useState } from "react"
import { Card, CardTitle } from "@/components/ui/card"
import { getAllBraiders, updateBraiderStatus, type Braider } from "@/lib/data"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { PlusCircle, CheckCircle, XCircle, Eye } from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function DashboardBraidersPage() {
  const [braiders, setBraiders] = useState<Braider[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")

  useEffect(() => {
    const fetchBraiders = async () => {
      setLoading(true)
      const fetchedBraiders = await getAllBraiders()
      setBraiders(fetchedBraiders)
      setLoading(false)
    }
    fetchBraiders()
  }, [])

  const handleUpdateStatus = async (braiderId: string, newStatus: Braider["status"]) => {
    setLoading(true)
    const result = await updateBraiderStatus(braiderId, newStatus)
    if (result.success) {
      // Atualiza o estado local para refletir a mudança
      setBraiders((prevBraiders) => prevBraiders.map((b) => (b.id === braiderId ? { ...b, status: newStatus } : b)))
    } else {
      console.error("Erro ao atualizar status:", result.message)
      // Poderia adicionar um toast ou mensagem de erro aqui
    }
    setLoading(false)
  }

  const filteredBraiders = braiders.filter((braider) => {
    if (filter === "all") return true
    return braider.status === filter
  })

  const getStatusBadgeVariant = (status: Braider["status"]) => {
    switch (status) {
      case "approved":
        return "default" // ou 'success' se tiver um
      case "pending":
        return "secondary" // ou 'warning'
      case "rejected":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-brand-primary">Gerenciar Trancistas</h2>
        <Button asChild className="bg-brand-accent hover:bg-brand-background text-brand-primary hover:text-white">
          <Link href="/register-braider">
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Nova Trancista
          </Link>
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          className={
            filter === "all"
              ? "bg-brand-primary text-white"
              : "border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white"
          }
        >
          Todas
        </Button>
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          onClick={() => setFilter("pending")}
          className={
            filter === "pending"
              ? "bg-brand-primary text-white"
              : "border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white"
          }
        >
          Pendentes
        </Button>
        <Button
          variant={filter === "approved" ? "default" : "outline"}
          onClick={() => setFilter("approved")}
          className={
            filter === "approved"
              ? "bg-brand-primary text-white"
              : "border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white"
          }
        >
          Aprovadas
        </Button>
        <Button
          variant={filter === "rejected" ? "default" : "outline"}
          onClick={() => setFilter("rejected")}
          className={
            filter === "rejected"
              ? "bg-brand-primary text-white"
              : "border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white"
          }
        >
          Rejeitadas
        </Button>
      </div>

      {loading ? (
        <p className="text-gray-700">Carregando trancistas...</p>
      ) : filteredBraiders.length === 0 ? (
        <Card className="bg-white text-gray-900 p-6 text-center shadow-lg rounded-lg">
          <CardTitle className="text-xl mb-2 text-brand-primary">Nenhuma trancista encontrada.</CardTitle>
          <CardDescription className="text-gray-700">Não há trancistas para exibir com o filtro atual.</CardDescription>
        </Card>
      ) : (
        <Card className="bg-white text-gray-900 shadow-lg rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Foto</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Localidade</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBraiders.map((braider) => (
                <TableRow key={braider.id}>
                  <TableCell>
                    <Image
                      src={braider.profileImageUrl || "/placeholder.svg?height=50&width=50&text=T"}
                      alt={braider.name}
                      width={50}
                      height={50}
                      className="rounded-full object-cover"
                      unoptimized={true}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{braider.name}</TableCell>
                  <TableCell>{braider.location}</TableCell>
                  <TableCell>{braider.contactEmail}</TableCell>
                  <TableCell>{braider.contactPhone}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(braider.status)}>
                      {braider.status === "pending" && "Pendente"}
                      {braider.status === "approved" && "Aprovada"}
                      {braider.status === "rejected" && "Rejeitada"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/braiders/${braider.id}`}>
                          {" "}
                          {/* Link atualizado */}
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver Perfil</span>
                        </Link>
                      </Button>
                      {braider.status !== "approved" && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleUpdateStatus(braider.id, "approved")}
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span className="sr-only">Aprovar</span>
                        </Button>
                      )}
                      {braider.status !== "rejected" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleUpdateStatus(braider.id, "rejected")}
                        >
                          <XCircle className="h-4 w-4" />
                          <span className="sr-only">Rejeitar</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
