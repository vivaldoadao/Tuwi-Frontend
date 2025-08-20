"use client"

import React, { useState } from "react"
import { ModernSidebar } from "@/components/modern-sidebar"
import { ModernDashboardHeader } from "@/components/modern-dashboard-header"
import { useAuth } from "@/context/django-auth-context"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

interface ModernDashboardLayoutProps {
  children: React.ReactNode
  userRole: "admin" | "braider" | "customer"
}

export const ModernDashboardLayout = ({ children, userRole }: ModernDashboardLayoutProps) => {
  const { user } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const getPageTitle = () => {
    if (pathname.includes("/dashboard") && !pathname.includes("/braider-dashboard")) {
      if (pathname === "/dashboard") return "Dashboard Admin"
      if (pathname.includes("/products")) return "Gestão de Produtos"
      if (pathname.includes("/orders")) return "Gestão de Pedidos"
      if (pathname.includes("/users")) return "Gestão de Utilizadores"
      if (pathname.includes("/braiders")) return "Gestão de Profissionais"
      if (pathname.includes("/settings")) return "Definições"
      return "Dashboard Admin"
    }
    if (pathname.includes("/braider-dashboard")) {
      if (pathname === "/braider-dashboard") return "Dashboard Profissional"
      if (pathname.includes("/bookings")) return "Meus Agendamentos"
      if (pathname.includes("/messages")) return "Mensagens"
      if (pathname.includes("/earnings")) return "Ganhos"
      if (pathname.includes("/promotions")) return "Promoções"
      if (pathname.includes("/profile")) return "Meu Perfil"
      return "Dashboard Profissional"
    }
    return "Dashboard"
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <ModernSidebar 
          userRole={userRole}
          userName={user?.name || "Utilizador"}
          userPlan="Pro Plan"
          currentPath={pathname}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 z-50 w-64 md:hidden"
            >
              <ModernSidebar 
                userRole={userRole}
                userName={user?.name || "Utilizador"}
                userPlan="Pro Plan"
                currentPath={pathname}
                onOptionClick={() => setMobileMenuOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <ModernDashboardHeader 
          title={getPageTitle()}
          subtitle={userRole === "admin" ? "Painel Administrativo" : "Painel do Profissional"}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          showMobileMenu={mobileMenuOpen}
        />
        
        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}