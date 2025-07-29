import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/api-auth'

// In a real app, this would connect to a database
// For now, we'll use in-memory storage per user session
const userFavorites = new Map<string, Set<string>>()

// GET /api/favorites - Get user favorites (authenticated)
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'product' or 'braider'

    const favorites = userFavorites.get(request.user.id) || new Set()
    let favoritesList = Array.from(favorites)

    if (type) {
      // Filter by type if needed (this would require additional metadata in a real app)
      favoritesList = favoritesList.filter(id => {
        if (type === 'product') return id.startsWith('product-')
        if (type === 'braider') return id.startsWith('braider-')
        return true
      })
    }

    return NextResponse.json({ 
      favorites: favoritesList,
      count: favoritesList.length 
    })
  } catch (error) {
    console.error('Error fetching user favorites:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar favoritos' },
      { status: 500 }
    )
  }
})

// POST /api/favorites - Add item to favorites (authenticated)
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json()
    const { itemId, type } = body

    if (!itemId) {
      return NextResponse.json(
        { error: 'ID do item é obrigatório' },
        { status: 400 }
      )
    }

    if (!type || !['product', 'braider'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo deve ser "product" ou "braider"' },
        { status: 400 }
      )
    }

    // Get or create user favorites set
    if (!userFavorites.has(request.user.id)) {
      userFavorites.set(request.user.id, new Set())
    }

    const favorites = userFavorites.get(request.user.id)!
    favorites.add(itemId)

    return NextResponse.json({ 
      success: true, 
      message: 'Item adicionado aos favoritos',
      favorites: Array.from(favorites)
    })
  } catch (error) {
    console.error('Error adding to favorites:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
})

// DELETE /api/favorites - Remove item from favorites (authenticated)
export const DELETE = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json(
        { error: 'ID do item é obrigatório' },
        { status: 400 }
      )
    }

    const favorites = userFavorites.get(request.user.id)
    if (!favorites) {
      return NextResponse.json(
        { error: 'Nenhum favorito encontrado' },
        { status: 404 }
      )
    }

    favorites.delete(itemId)

    return NextResponse.json({ 
      success: true, 
      message: 'Item removido dos favoritos',
      favorites: Array.from(favorites)
    })
  } catch (error) {
    console.error('Error removing from favorites:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
})