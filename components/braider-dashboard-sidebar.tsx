"use client"
import Link from "next/link"
import Image from "next/image"
import { Home, CalendarCheck, UserCog, ChevronDown, CalendarDays } from "lucide-react" // Importar CalendarDays
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
import type { Braider } from "@/lib/data"

interface BraiderDashboardSidebarProps {
  braider: Braider // Receber os dados da trancista
}

export function BraiderDashboardSidebar({ braider }: BraiderDashboardSidebarProps) {
  const { logout } = useAuth()
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
      href: "/braider-dashboard",
      icon: Home,
    },
    {
      title: "Meus Agendamentos",
      href: "/braider-dashboard/bookings",
      icon: CalendarCheck,
    },
    {
      title: "Minha Disponibilidade", // NOVO ITEM
      href: "/braider-dashboard/availability",
      icon: CalendarDays, // Ícone para disponibilidade
    },
    {
      title: "Meu Perfil",
      href: "/braider-dashboard/profile",
      icon: UserCog,
    },
  ]

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <Link href="/braider-dashboard" className="flex items-center gap-2 p-2">
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
                  <Image
                    src={braider.profileImageUrl || "/placeholder.svg?height=20&width=20&text=T"}
                    alt={braider.name}
                    width={20}
                    height={20}
                    className="rounded-full object-cover"
                    unoptimized={true}
                  />{" "}
                  {braider.name || "Trancista"}
                  <ChevronDown className="ml-auto group-data-[state=collapsed]/sidebar-wrapper:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                <DropdownMenuItem asChild>
                  <Link href="/braider-dashboard/profile">Meu Perfil</Link>
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
