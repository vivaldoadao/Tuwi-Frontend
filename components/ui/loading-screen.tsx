"use client"

import SiteHeader from "@/components/site-header"

interface LoadingScreenProps {
  message?: string
  showHeader?: boolean
}

export default function LoadingScreen({ 
  message = "Carregando...", 
  showHeader = true 
}: LoadingScreenProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50">
      {showHeader && <SiteHeader />}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  )
}