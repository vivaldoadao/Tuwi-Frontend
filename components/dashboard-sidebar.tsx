"use client"
import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Home, ShoppingCart, Package, Settings, ChevronDown, User2, Users, UserCheck } from "lucide-react"

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
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  const handleLogout = () => {
    // TODO: Implement logout functionality
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
      title: "Trancistas",
      href: "/dashboard/braiders",
      icon: Users,
    },
    {
      title: "Usuários",
      href: "/dashboard/users",
      icon: UserCheck,
    },
    {
      title: "Configurações",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ]

  return (
    <Sidebar collapsible="offcanvas" variant="sidebar" className="border-r">
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
                      href={item.href as any}
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
