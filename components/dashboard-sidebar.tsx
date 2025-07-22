"use client"
import Link from "next/link"
import Image from "next/image"
import { Home, ShoppingCart, Package, Settings, ChevronDown, User2, Users } from "lucide-react" // Importar Users icon

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/auth-context"
import { useRouter, usePathname } from "next/navigation"

export function DashboardSidebar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const navItems = [
    {
      title: "Visão Geral",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "Pedidos",
      href: "/dashboard/orders",
      icon: ShoppingCart,
    },
    {
      title: "Produtos",
      href: "/dashboard/products",
      icon: Package,
    },
    {
      title: "Trancistas", // Novo item para gerenciar trancistas
      href: "/dashboard/braiders",
      icon: Users, // Ícone de usuários
    },
    {
      title: "Configurações",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ]

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2 p-2">
          <Image
            src="/wilnara-logo.png"
            alt="Wilnara Tranças Logo"
            width={32}
            height={32}
            className="rounded-full"
            unoptimized={true}
          />
          <span className="text-xl font-bold text-brand-primary group-data-[state=collapsed]/sidebar-wrapper:hidden">
            WILNARA
          </span>
          <span className="text-md font-semibold text-brand-accent group-data-[state=collapsed]/sidebar-wrapper:hidden">
            TRANÇAS
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        if (isMobile) {
                          setOpenMobile(false)
                        }
                      }}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 /> {user?.name || "Usuário"}
                  <ChevronDown className="ml-auto group-data-[state=collapsed]/sidebar-wrapper:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                <DropdownMenuItem>
                  <span>Meu Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
