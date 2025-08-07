import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { SessionProvider } from "next-auth/react"
import "./globals.css"
import { CartProvider } from "@/context/cart-context"
import { AuthProvider } from "@/context/auth-context"
import { FavoritesProvider } from "@/context/favorites-context"
import { NotificationsProvider } from "@/context/notifications-context"
import { ToastContainer } from "@/components/toast-container"
import { Toaster } from "react-hot-toast"

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
        <SessionProvider>
          <AuthProvider>
            <NotificationsProvider>
              <CartProvider>
                <FavoritesProvider>
                  {children}
                  <ToastContainer />
                  <Toaster position="top-right" />
                </FavoritesProvider>
              </CartProvider>
            </NotificationsProvider>
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
