"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import {
  ChevronDown,
  ChevronsRight,
  DollarSign,
  Home,
  Monitor,
  ShoppingCart,
  Users,
  Settings,
  Package,
  Calendar,
  MessageSquare,
  TrendingUp,
  UserCheck,
  Star
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface SidebarOption {
  icon: React.ComponentType
  title: string
  href: string
  notifs?: number
}

interface ModernSidebarProps {
  userRole: "admin" | "braider" | "customer"
  userName: string
  userPlan?: string
  currentPath: string
  onOptionClick?: () => void
}

export const ModernSidebar = ({ userRole, userName, userPlan, currentPath, onOptionClick }: ModernSidebarProps) => {
  const [open, setOpen] = useState(true)
  const [selected, setSelected] = useState(getSelectedFromPath(currentPath))

  function getSelectedFromPath(path: string): string {
    if (path.includes("/dashboard") && !path.includes("/braider-dashboard")) return "Dashboard"
    if (path.includes("/braider-dashboard")) return "Dashboard"
    if (path.includes("/products")) return "Produtos"
    if (path.includes("/orders")) return "Pedidos"
    if (path.includes("/bookings")) return "Agendamentos"
    if (path.includes("/analytics")) return "Análises"
    if (path.includes("/users")) return "Utilizadores"
    if (path.includes("/braiders")) return "Profissionais"
    if (path.includes("/settings")) return "Definições"
    if (path.includes("/messages")) return "Mensagens"
    if (path.includes("/promotions")) return "Promoções"
    return "Dashboard"
  }

  const getOptionsForRole = (): SidebarOption[] => {
    switch (userRole) {
      case "admin":
        return [
          { icon: Home, title: "Dashboard", href: "/dashboard" },
          { icon: ShoppingCart, title: "Produtos", href: "/dashboard/products" },
          { icon: Package, title: "Pedidos", href: "/dashboard/orders" },
          { icon: Users, title: "Utilizadores", href: "/dashboard/users" },
          { icon: UserCheck, title: "Profissionais", href: "/dashboard/braiders" },
          { icon: DollarSign, title: "Comissões", href: "/dashboard/commissions" },
          { icon: Star, title: "Promoções", href: "/dashboard/promotions" },
          { icon: Settings, title: "Definições", href: "/dashboard/settings" },
          { icon: Monitor, title: "Ver Site", href: "/" }
        ]
      case "braider":
        return [
          { icon: Home, title: "Dashboard", href: "/braider-dashboard" },
          { icon: Calendar, title: "Agendamentos", href: "/braider-dashboard/bookings" },
          { icon: MessageSquare, title: "Mensagens", href: "/braider-dashboard/messages" },
          { icon: TrendingUp, title: "Ganhos", href: "/braider-dashboard/earnings" },
          { icon: Star, title: "Promoções", href: "/braider-dashboard/promotions" },
          { icon: Settings, title: "Perfil", href: "/braider-dashboard/profile" },
          { icon: Monitor, title: "Ver Site", href: "/" }
        ]
      default:
        return [
          { icon: Home, title: "Dashboard", href: "/profile" },
          { icon: Monitor, title: "Ver Site", href: "/" }
        ]
    }
  }

  const options = getOptionsForRole()

  return (
    <motion.nav
      layout
      className="sticky top-0 h-screen shrink-0 border-r border-gray-200 bg-white p-2 shadow-sm overflow-hidden"
      style={{
        width: open ? "240px" : "fit-content",
      }}
    >
      <TitleSection 
        open={open} 
        userName={userName} 
        userPlan={userPlan} 
        userRole={userRole}
      />

      <div className="space-y-1">
        {options.map((option) => (
          <Option
            key={option.title}
            Icon={option.icon}
            title={option.title}
            href={option.href}
            selected={selected}
            setSelected={setSelected}
            open={open}
            notifs={option.notifs}
            onOptionClick={onOptionClick}
          />
        ))}
      </div>

      <ToggleClose open={open} setOpen={setOpen} />
    </motion.nav>
  )
}

const Option = ({ Icon, title, href, selected, setSelected, open, notifs, onOptionClick }: {
  Icon: React.ComponentType
  title: string
  href: string
  selected: string
  setSelected: (title: string) => void
  open: boolean
  notifs?: number
  onOptionClick?: () => void
}) => {
  return (
    <Link href={href as any}>
      <motion.button
        layout
        onClick={() => {
          setSelected(title)
          onOptionClick?.()
        }}
        className={`relative flex h-10 w-full items-center rounded-md transition-colors ${
          selected === title 
            ? "bg-brand-100 text-brand-800" 
            : "text-slate-500 hover:bg-gray-100"
        }`}
      >
        <motion.div
          layout
          className="grid h-full w-10 place-content-center text-lg"
        >
          <Icon />
        </motion.div>
        {open && (
          <motion.span
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.125 }}
            className="text-xs font-medium"
          >
            {title}
          </motion.span>
        )}

        {notifs && open && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            style={{ y: "-50%" }}
            transition={{ delay: 0.5 }}
            className="absolute right-2 top-1/2 size-4 rounded bg-accent-500 text-xs text-white flex items-center justify-center"
          >
            {notifs}
          </motion.span>
        )}
      </motion.button>
    </Link>
  )
}

const TitleSection = ({ open, userName, userPlan, userRole }: {
  open: boolean
  userName: string
  userPlan?: string
  userRole: string
}) => {
  const getRoleName = () => {
    switch (userRole) {
      case "admin": return "Administrador"
      case "braider": return "Profissional"
      default: return "Utilizador"
    }
  }

  return (
    <div className="mb-3 border-b border-gray-200 pb-3">
      <div className="flex cursor-pointer items-center justify-between rounded-md transition-colors hover:bg-gray-50">
        <div className="flex items-center gap-2">
          <TuwiLogo />
          {open && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.125 }}
            >
              <span className="block text-xs font-semibold text-gray-900">
                {userName || "Utilizador"}
              </span>
              <span className="block text-xs text-gray-500">
                {getRoleName()}
              </span>
            </motion.div>
          )}
        </div>
        {open && <ChevronDown className="mr-2 h-4 w-4 text-gray-400" />}
      </div>
    </div>
  )
}

const TuwiLogo = () => {
  return (
    <motion.div
      layout
      className="grid size-10 shrink-0 place-content-center rounded-md bg-gradient-to-br from-brand-600 to-brand-700"
    >
      <Image
        src="/wilnara-logo.png"
        alt="Tuwi Logo"
        width={24}
        height={24}
        className="rounded-sm"
        unoptimized={true}
      />
    </motion.div>
  )
}

const ToggleClose = ({ open, setOpen }: {
  open: boolean
  setOpen: (fn: (prev: boolean) => boolean) => void
}) => {
  return (
    <motion.button
      layout
      onClick={() => setOpen((pv) => !pv)}
      className="absolute bottom-0 left-0 right-0 border-t border-gray-200 transition-colors hover:bg-gray-50"
    >
      <div className="flex items-center p-2">
        <motion.div
          layout
          className="grid size-10 place-content-center text-lg"
        >
          <ChevronsRight
            className={`h-4 w-4 transition-transform text-gray-400 ${open && "rotate-180"}`}
          />
        </motion.div>
        {open && (
          <motion.span
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.125 }}
            className="text-xs font-medium text-gray-500"
          >
            Ocultar
          </motion.span>
        )}
      </div>
    </motion.button>
  )
}