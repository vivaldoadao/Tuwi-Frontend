import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { CartProvider } from "@/context/cart-context"
import { AuthProvider } from "@/context/django-auth-context"
import { FavoritesProvider } from "@/context/favorites-context"
import { NotificationsProviderV2 } from "@/context/notifications-context-v2"
import { ToastContainer } from "@/components/toast-container"
import { Toaster } from "react-hot-toast"
import PresenceProvider from "@/components/presence-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Wilnara Tranças - E-commerce de Postiços Femininos",
  description: "Realce sua beleza natural com nossas tranças e postiços de alta qualidade.",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <PresenceProvider>
            <NotificationsProviderV2>
              <CartProvider>
                <FavoritesProvider>
                  {children}
                  <ToastContainer />
                  <Toaster position="top-right" />
                </FavoritesProvider>
              </CartProvider>
            </NotificationsProviderV2>
          </PresenceProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
