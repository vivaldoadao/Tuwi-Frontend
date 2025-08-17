"use client"

import Link from "next/link"
import Image from "next/image"
import { Menu, ShoppingCart, User, LogOut, Heart, Bell, Search, Shield, UserCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth-context"
import { useFavorites } from "@/context/favorites-context"
import { useNotifications } from "@/context/notifications-context-v2"
import { NotificationCenter } from "@/components/notification-center"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function SiteHeader() {
  const { cartItemCount } = useCart()
  const { user } = useAuth()
  const { favoriteProducts, favoriteBraiders } = useFavorites()
  const { unreadCount } = useNotifications()
  const router = useRouter()
  const [notificationOpen, setNotificationOpen] = useState(false)
  
  const favoriteCount = favoriteProducts.length + favoriteBraiders.length

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  // Função para determinar o link e texto do dashboard baseado na role
  const getDashboardInfo = () => {
    if (!user?.role) {
      return { href: "/profile", text: "Minha Conta", icon: User }
    }

    switch (user.role) {
      case 'admin':
        return { 
          href: "/dashboard", 
          text: "Dashboard Admin", 
          icon: Shield 
        }
      case 'braider':
        return { 
          href: "/braider-dashboard", 
          text: "Dashboard Profissional", 
          icon: UserCheck 
        }
      case 'customer':
      default:
        return { 
          href: "/profile", 
          text: "Minha Conta", 
          icon: User 
        }
    }
  }

  const dashboardInfo = getDashboardInfo()

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="container flex h-20 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <Image
              src="/wilnara-logo.png"
              alt="Tuwi Logo"
              width={48}
              height={48}
              className="rounded-full shadow-md group-hover:shadow-lg transition-shadow duration-300"
              unoptimized={true}
            />
            <div className="absolute inset-0 bg-brand-600 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
          </div>
          <div className="hidden sm:block">
            <span className="text-2xl font-bold text-brand-800 font-heading">TUWI</span>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-base font-medium">
          <Link href="/" className="relative text-gray-700 hover:text-brand-700 transition-colors group py-2">
            Início
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-600 group-hover:w-full transition-all duration-300" />
          </Link>
          <Link href="/products" className="relative text-gray-700 hover:text-brand-700 transition-colors group py-2">
            Produtos
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-600 group-hover:w-full transition-all duration-300" />
          </Link>
          <Link href="/braiders" className="relative text-gray-700 hover:text-brand-700 transition-colors group py-2">
            Profissionais
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-600 group-hover:w-full transition-all duration-300" />
          </Link>
          <Link href="/about" className="relative text-gray-700 hover:text-brand-700 transition-colors group py-2">
            Sobre
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-600 group-hover:w-full transition-all duration-300" />
          </Link>
          <Link href="/contact" className="relative text-gray-700 hover:text-brand-700 transition-colors group py-2">
            Contato
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-600 group-hover:w-full transition-all duration-300" />
          </Link>
          <Link href="/track-order" className="relative text-gray-700 hover:text-brand-700 transition-colors group py-2">
            Rastrear Pedido
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-600 group-hover:w-full transition-all duration-300" />
          </Link>
          {user && (
            <Link href={dashboardInfo.href as any} className="relative text-gray-700 hover:text-brand-700 transition-colors group py-2 flex items-center gap-1">
              <dashboardInfo.icon className="h-4 w-4" />
              {dashboardInfo.text}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-600 group-hover:w-full transition-all duration-300" />
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Notifications */}
              <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-full">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white shadow-md">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                    <span className="sr-only">Notificações</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="p-0 w-auto border-0 shadow-none bg-transparent" 
                  align="end"
                  sideOffset={8}
                >
                  <NotificationCenter onClose={() => setNotificationOpen(false)} />
                </PopoverContent>
              </Popover>
              
              <Link href="/favorites">
                <Button variant="ghost" size="icon" className="relative text-gray-700 hover:text-pink-600 hover:bg-pink-50 rounded-full">
                  <Heart className="h-5 w-5" />
                  {favoriteCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-xs font-bold text-white shadow-md">
                      {favoriteCount}
                    </span>
                  )}
                  <span className="sr-only">Favoritos</span>
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost" size="icon" className="text-gray-700 hover:text-brand-700 hover:bg-brand-50 rounded-full">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Perfil</span>
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-full">
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Sair</span>
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="ghost" className="text-gray-700 hover:text-brand-700 hover:bg-brand-50 px-4 py-2 rounded-full font-medium">
                <User className="h-4 w-4 mr-2" />
                Login
              </Button>
            </Link>
          )}

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative text-gray-700 hover:text-brand-700 hover:bg-brand-50 rounded-full">
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-white shadow-md">
                  {cartItemCount}
                </span>
              )}
              <span className="sr-only">Carrinho</span>
            </Button>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-gray-700 hover:text-brand-700 hover:bg-brand-50 rounded-full">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-white border-r border-gray-200">
              <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
              <Link href="/" className="flex items-center gap-3 mb-8">
                <Image
                  src="/wilnara-logo.png"
                  alt="Tuwi Logo"
                  width={48}
                  height={48}
                  className="rounded-full shadow-md"
                  unoptimized={true}
                />
                <div>
                  <span className="text-2xl font-bold text-brand-800 font-heading block">WILNARA</span>
                  <span className="text-lg font-semibold text-accent-600 font-heading">TRANÇAS</span>
                </div>
              </Link>
              <nav className="grid gap-6 text-base font-medium">
                <Link href="/" className="text-gray-700 hover:text-brand-700 transition-colors py-2 border-b border-gray-100">
                  Início
                </Link>
                <Link href="/products" className="text-gray-700 hover:text-brand-700 transition-colors py-2 border-b border-gray-100">
                  Produtos
                </Link>
                <Link href="/braiders" className="text-gray-700 hover:text-brand-700 transition-colors py-2 border-b border-gray-100">
                  Profissionais
                </Link>
                <Link href="/about" className="text-gray-700 hover:text-brand-700 transition-colors py-2 border-b border-gray-100">
                  Sobre
                </Link>
                <Link href="/contact" className="text-gray-700 hover:text-brand-700 transition-colors py-2 border-b border-gray-100">
                  Contato
                </Link>
                <Link href="/track-order" className="text-gray-700 hover:text-brand-700 transition-colors py-2 border-b border-gray-100">
                  Rastrear Pedido
                </Link>
                {user && (
                  <Link href={dashboardInfo.href as any} className="text-gray-700 hover:text-brand-700 transition-colors py-2 border-b border-gray-100 flex items-center gap-2">
                    <dashboardInfo.icon className="h-4 w-4" />
                    {dashboardInfo.text}
                  </Link>
                )}
                <Link href="/cart" className="text-gray-700 hover:text-brand-700 transition-colors py-2 border-b border-gray-100 flex items-center justify-between">
                  Carrinho
                  {cartItemCount > 0 && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-white">
                      {cartItemCount}
                    </span>
                  )}
                </Link>
                {user ? (
                  <>
                    <Link href="/favorites" className="text-gray-700 hover:text-pink-600 transition-colors py-2 border-b border-gray-100 flex items-center justify-between">
                      Favoritos
                      {favoriteCount > 0 && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-xs font-bold text-white">
                          {favoriteCount}
                        </span>
                      )}
                    </Link>
                    <Link href="/profile" className="text-gray-700 hover:text-brand-700 transition-colors py-2 border-b border-gray-100">
                      Perfil
                    </Link>
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="justify-start px-0 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md"
                    >
                      Sair
                    </Button>
                  </>
                ) : (
                  <Link href="/login" className="text-gray-700 hover:text-brand-700 transition-colors py-2">
                    Login
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
