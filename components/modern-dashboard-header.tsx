"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Bell, 
  Home, 
  LogOut, 
  User,
  ChevronDown,
  Settings,
  UserCircle,
  Menu
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useNotifications } from "@/context/notifications-context-v2"
import { NotificationCenter } from "@/components/notification-center"
import AvatarWithInitials from "@/components/avatar-with-initials"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ModernDashboardHeaderProps {
  title?: string
  subtitle?: string
  onMobileMenuToggle?: () => void
  showMobileMenu?: boolean
}

export const ModernDashboardHeader = ({ 
  title = "Dashboard", 
  subtitle,
  onMobileMenuToggle,
  showMobileMenu = false
}: ModernDashboardHeaderProps) => {
  const { user } = useAuth()
  const { unreadCount } = useNotifications()
  const router = useRouter()
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  const getRoleName = () => {
    if (!user?.role) return "Utilizador"
    switch (user.role) {
      case "admin": return "Administrador"
      case "braider": return "Profissional"
      default: return "Utilizador"
    }
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm"
    >
      <div className="flex h-14 md:h-16 items-center justify-between px-4 md:px-6">
        {/* Left side - Mobile menu + Title */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Mobile Menu Button */}
          {onMobileMenuToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMobileMenuToggle}
              className="md:hidden h-8 w-8 rounded-full hover:bg-gray-100"
            >
              <Menu className="h-4 w-4 text-gray-600" />
            </Button>
          )}
          
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 font-heading">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs md:text-sm text-gray-500 hidden sm:block">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Home Button */}
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="relative h-8 w-8 md:h-9 md:w-9 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Link href="/">
              <Home className="h-4 w-4 text-gray-600" />
            </Link>
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="relative h-8 w-8 md:h-9 md:w-9 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Bell className="h-4 w-4 text-gray-600" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-0.5 -right-0.5 h-4 w-4 md:h-5 md:w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </Button>

            {/* Notification Panel */}
            <AnimatePresence>
              {notificationOpen && (
                <>
                  {/* Overlay for mobile */}
                  <div 
                    className="fixed inset-0 z-40 md:hidden" 
                    onClick={() => setNotificationOpen(false)}
                  />
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-10 md:top-12 z-50 w-80 md:w-96"
                  >
                    <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden max-h-96 md:max-h-[500px]">
                      <NotificationCenter />
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Dropdown */}
          <DropdownMenu open={profileOpen} onOpenChange={setProfileOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 md:h-9 md:w-9 rounded-full hover:bg-gray-100 transition-colors p-0"
              >
                <AvatarWithInitials
                  name={user?.name || "U"}
                  avatarUrl={user?.image}
                  size="sm"
                  className="h-7 w-7 md:h-8 md:w-8"
                />
                <ChevronDown className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-gray-400 bg-white rounded-full border border-gray-200" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-gray-200">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || "Utilizador"}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                <p className="text-xs text-brand-600 font-medium mt-1">
                  {getRoleName()}
                </p>
              </div>
              
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/profile" className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4" />
                  Meu Perfil
                </Link>
              </DropdownMenuItem>
              
              {user?.role === "braider" && (
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/braider-dashboard/profile" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Definições
                  </Link>
                </DropdownMenuItem>
              )}
              
              {user?.role === "admin" && (
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/dashboard/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Definições
                  </Link>
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleLogout}
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Terminar Sessão
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  )
}