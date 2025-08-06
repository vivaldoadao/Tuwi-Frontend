"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { Users, LogIn, UserPlus, ArrowRight } from "lucide-react"
import { checkBraiderStatus } from "@/lib/braider-utils"

interface BraiderRegisterButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  className?: string
  showIcon?: boolean
  children?: React.ReactNode
}

export default function BraiderRegisterButton({ 
  variant = "default",
  className = "",
  showIcon = true,
  children
}: BraiderRegisterButtonProps) {
  const { user, isLoading } = useAuth()

  // Se está carregando, mostrar botão desabilitado
  if (isLoading) {
    return (
      <Button 
        disabled 
        variant={variant}
        className={className}
      >
        <div className="animate-pulse flex items-center">
          {showIcon && <Users className="mr-2 h-5 w-5" />}
          Carregando...
        </div>
      </Button>
    )
  }

  // Se não está logado, mostrar mensagem informativa
  if (!user) {
    return (
      <div className="space-y-3">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Users className="h-3 w-3 text-white" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">
                Quer se tornar uma Trancista?
              </p>
              <p className="text-blue-700 mb-3">
                Para se registrar como trancista, você precisa primeiro ter uma conta na plataforma.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Link href="/login" className="inline-block">
                  <Button 
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Fazer Login
                  </Button>
                </Link>
                <Link href="/register" className="inline-block">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Criar Conta
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Se está logado, verificar se já é trancista
  const braiderStatus = checkBraiderStatus(user.email || "")
  
  // Se já é trancista, mostrar ação contextual
  if (braiderStatus.isBraider) {
    switch (braiderStatus.status) {
      case "approved":
        return (
          <Link href="/dashboard/braider">
            <Button 
              variant={variant}
              className={className}
            >
              {showIcon && <Users className="mr-2 h-5 w-5" />}
              Meu Dashboard de Trancista
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )
      
      case "pending":
        return (
          <Link href="/profile/braider-status">
            <Button 
              variant="outline"
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
            >
              {showIcon && <Users className="mr-2 h-5 w-5" />}
              Aguardando Aprovação
            </Button>
          </Link>
        )
      
      case "rejected":
        return (
          <Link href="/register-braider">
            <Button 
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              {showIcon && <Users className="mr-2 h-5 w-5" />}
              Solicitar Nova Análise
            </Button>
          </Link>
        )
    }
  }

  // Se está logado e não é trancista, mostrar botão normal
  return (
    <Link href="/register-braider">
      <Button 
        variant={variant}
        className={className}
      >
        {showIcon && <Users className="mr-2 h-5 w-5" />}
        {children || "Cadastre-se como Trancista"}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </Link>
  )
}