"use client"

import Link from "next/link"
import Image from "next/image"
import { Menu, ShoppingCart, User, LogOut } from "lucide-react" // Importar LayoutDashboard

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"

export default function SiteHeader() {
  const { cartItemCount } = useCart()
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login") // Redirect to login page after logout
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-brand-background text-white shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/wilnara-logo.png"
            alt="Wilnara Tranças Logo"
            width={40}
            height={40}
            className="rounded-full"
            unoptimized={true}
          />
          <span className="text-2xl font-bold text-brand-primary hidden sm:block">WILNARA</span>
          <span className="text-lg font-semibold text-brand-accent hidden sm:block">TRANÇAS</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-lg font-medium">
          <Link href="/" className="hover:text-brand-accent transition-colors">
            Início
          </Link>
          <Link href="/products" className="hover:text-brand-accent transition-colors">
            Produtos
          </Link>
          <Link href="/braiders" className="hover:text-brand-accent transition-colors">
            Encontrar Trancistas
          </Link>
          <Link href="/about" className="hover:text-brand-accent transition-colors">
            Sobre Nós
          </Link>
          <Link href="/contact" className="hover:text-brand-accent transition-colors">
            Contato
          </Link>
          {user && ( // Adicionar link para o painel de administração (loja)
            <Link href="/dashboard" className="hover:text-brand-accent transition-colors">
              Painel Admin
            </Link>
          )}
          {user && ( // Adicionar link para o painel da trancista
            <Link href="/braider-dashboard" className="hover:text-brand-accent transition-colors">
              Painel Trancista
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/profile">
                <Button variant="ghost" size="icon" className="text-white hover:text-brand-accent">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Perfil</span>
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white hover:text-brand-accent">
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Sair</span>
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="icon" className="text-white hover:text-brand-accent">
                <User className="h-5 w-5" />
                <span className="sr-only">Login</span>
              </Button>
            </Link>
          )}

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative text-white hover:text-brand-accent">
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-accent text-xs font-bold text-brand-primary">
                  {cartItemCount}
                </span>
              )}
              <span className="sr-only">Carrinho</span>
            </Button>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-white hover:text-brand-accent">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-brand-background text-white">
              <Link href="/" className="flex items-center gap-2 mb-6">
                <Image
                  src="/wilnara-logo.png"
                  alt="Wilnara Tranças Logo"
                  width={40}
                  height={40}
                  className="rounded-full"
                  unoptimized={true}
                />
                <span className="text-2xl font-bold text-brand-primary">WILNARA</span>
                <span className="text-lg font-semibold text-brand-accent">TRANÇAS</span>
              </Link>
              <nav className="grid gap-4 text-lg font-medium">
                <Link href="/" className="hover:text-brand-accent transition-colors">
                  Início
                </Link>
                <Link href="/products" className="hover:text-brand-accent transition-colors">
                  Produtos
                </Link>
                <Link href="/braiders" className="hover:text-brand-accent transition-colors">
                  Encontrar Trancistas
                </Link>
                <Link href="/about" className="hover:text-brand-accent transition-colors">
                  Sobre Nós
                </Link>
                <Link href="/contact" className="hover:text-brand-accent transition-colors">
                  Contato
                </Link>
                {user && ( // Adicionar link para o painel de administração (loja) no mobile
                  <Link href="/dashboard" className="hover:text-brand-accent transition-colors">
                    Painel Admin
                  </Link>
                )}
                {user && ( // Adicionar link para o painel da trancista no mobile
                  <Link href="/braider-dashboard" className="hover:text-brand-accent transition-colors">
                    Painel Trancista
                  </Link>
                )}
                <Link href="/cart" className="hover:text-brand-accent transition-colors flex items-center gap-2">
                  Carrinho
                  {cartItemCount > 0 && (
                    <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-brand-accent text-xs font-bold text-brand-primary">
                      {cartItemCount}
                    </span>
                  )}
                </Link>
                {user ? (
                  <>
                    <Link href="/profile" className="hover:text-brand-accent transition-colors">
                      Perfil
                    </Link>
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="justify-start px-0 text-white hover:text-brand-accent"
                    >
                      Sair
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="hover:text-brand-accent transition-colors">
                      Login
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
