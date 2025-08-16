// ===================================
// HOOK PARA ESTADO DE CARDS
// ===================================

import { useState, useCallback, useEffect } from 'react'
import type { UseCardStateOptions, UseCardStateReturn } from '@/types/card'

export function useCardState(options: UseCardStateOptions = {}): UseCardStateReturn {
  const {
    favoriteKey = 'card-favorites',
    initialFavorites = [],
    onFavoriteChange
  } = options

  // State for favorites
  const [favorites, setFavorites] = useState<string[]>(initialFavorites)

  // Load favorites from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(favoriteKey)
        if (stored) {
          const parsedFavorites = JSON.parse(stored)
          if (Array.isArray(parsedFavorites)) {
            setFavorites(parsedFavorites)
          }
        }
      } catch (error) {
        console.error('Error loading favorites from localStorage:', error)
      }
    }
  }, [favoriteKey])

  // Save favorites to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(favoriteKey, JSON.stringify(favorites))
      } catch (error) {
        console.error('Error saving favorites to localStorage:', error)
      }
    }
  }, [favorites, favoriteKey])

  // Check if item is favorite
  const isFavorite = useCallback((id: string): boolean => {
    return favorites.includes(id)
  }, [favorites])

  // Toggle favorite status
  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const isCurrentlyFavorite = prev.includes(id)
      const newFavorites = isCurrentlyFavorite
        ? prev.filter(fav => fav !== id)
        : [...prev, id]
      
      // Call callback if provided
      if (onFavoriteChange) {
        onFavoriteChange(id, !isCurrentlyFavorite)
      }
      
      return newFavorites
    })
  }, [onFavoriteChange])

  // Clear all favorites
  const clearFavorites = useCallback(() => {
    setFavorites([])
    
    // Notify about all cleared favorites
    if (onFavoriteChange) {
      favorites.forEach(id => {
        onFavoriteChange(id, false)
      })
    }
  }, [favorites, onFavoriteChange])

  return {
    isFavorite,
    toggleFavorite,
    favorites,
    clearFavorites
  }
}