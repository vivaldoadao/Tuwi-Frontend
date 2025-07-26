"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useNotificationHelpers } from "@/hooks/use-notification-helpers"
import { getProductById, getBraiderById } from "@/lib/data"

interface FavoritesContextType {
  favoriteProducts: string[]
  favoriteBraiders: string[]
  addFavoriteProduct: (productId: string) => void
  removeFavoriteProduct: (productId: string) => void
  addFavoriteBraider: (braiderId: string) => void
  removeFavoriteBraider: (braiderId: string) => void
  isFavoriteProduct: (productId: string) => boolean
  isFavoriteBraider: (braiderId: string) => boolean
  toggleFavoriteProduct: (productId: string) => void
  toggleFavoriteBraider: (braiderId: string) => void
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteProducts, setFavoriteProducts] = useState<string[]>([])
  const [favoriteBraiders, setFavoriteBraiders] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Try to get notification helpers, but don't fail if not available
  let notifyProductAddedToFavorites: ((product: any) => void) | undefined
  let notifyProductRemovedFromFavorites: ((product: any) => void) | undefined
  let notifyBraiderAddedToFavorites: ((braider: any) => void) | undefined
  let notifyBraiderRemovedFromFavorites: ((braider: any) => void) | undefined
  
  try {
    const helpers = useNotificationHelpers()
    notifyProductAddedToFavorites = helpers.notifyProductAddedToFavorites
    notifyProductRemovedFromFavorites = helpers.notifyProductRemovedFromFavorites
    notifyBraiderAddedToFavorites = helpers.notifyBraiderAddedToFavorites
    notifyBraiderRemovedFromFavorites = helpers.notifyBraiderRemovedFromFavorites
  } catch {
    // Notifications not available, continue without them
  }

  // Load favorites from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedProducts = localStorage.getItem("wilnara_favorite_products")
      const savedBraiders = localStorage.getItem("wilnara_favorite_braiders")
      
      if (savedProducts) {
        try {
          setFavoriteProducts(JSON.parse(savedProducts))
        } catch (error) {
          console.error("Error loading favorite products:", error)
        }
      }
      
      if (savedBraiders) {
        try {
          setFavoriteBraiders(JSON.parse(savedBraiders))
        } catch (error) {
          console.error("Error loading favorite braiders:", error)
        }
      }
      
      setIsInitialized(true)
    }
  }, [])

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem("wilnara_favorite_products", JSON.stringify(favoriteProducts))
    }
  }, [favoriteProducts, isInitialized])

  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem("wilnara_favorite_braiders", JSON.stringify(favoriteBraiders))
    }
  }, [favoriteBraiders, isInitialized])

  const addFavoriteProduct = (productId: string) => {
    setFavoriteProducts(prev => {
      if (!prev.includes(productId)) {
        // Get product data and trigger notification if available
        const product = getProductById(productId)
        if (product && notifyProductAddedToFavorites) {
          notifyProductAddedToFavorites(product)
        }
        return [...prev, productId]
      }
      return prev
    })
  }

  const removeFavoriteProduct = (productId: string) => {
    // Get product data before removing
    const product = getProductById(productId)
    setFavoriteProducts(prev => prev.filter(id => id !== productId))
    if (product && notifyProductRemovedFromFavorites) {
      notifyProductRemovedFromFavorites(product)
    }
  }

  const addFavoriteBraider = (braiderId: string) => {
    setFavoriteBraiders(prev => {
      if (!prev.includes(braiderId)) {
        // Get braider data and trigger notification if available
        const braider = getBraiderById(braiderId)
        if (braider && notifyBraiderAddedToFavorites) {
          notifyBraiderAddedToFavorites(braider)
        }
        return [...prev, braiderId]
      }
      return prev
    })
  }

  const removeFavoriteBraider = (braiderId: string) => {
    // Get braider data before removing
    const braider = getBraiderById(braiderId)
    setFavoriteBraiders(prev => prev.filter(id => id !== braiderId))
    if (braider && notifyBraiderRemovedFromFavorites) {
      notifyBraiderRemovedFromFavorites(braider)
    }
  }

  const isFavoriteProduct = (productId: string) => {
    return favoriteProducts.includes(productId)
  }

  const isFavoriteBraider = (braiderId: string) => {
    return favoriteBraiders.includes(braiderId)
  }

  const toggleFavoriteProduct = (productId: string) => {
    if (isFavoriteProduct(productId)) {
      removeFavoriteProduct(productId)
    } else {
      addFavoriteProduct(productId)
    }
  }

  const toggleFavoriteBraider = (braiderId: string) => {
    if (isFavoriteBraider(braiderId)) {
      removeFavoriteBraider(braiderId)
    } else {
      addFavoriteBraider(braiderId)
    }
  }

  const value = {
    favoriteProducts,
    favoriteBraiders,
    addFavoriteProduct,
    removeFavoriteProduct,
    addFavoriteBraider,
    removeFavoriteBraider,
    isFavoriteProduct,
    isFavoriteBraider,
    toggleFavoriteProduct,
    toggleFavoriteBraider,
  }

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider")
  }
  return context
}