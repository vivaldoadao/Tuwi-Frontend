import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/braiders - Get all braiders with optional filtering (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const featured = searchParams.get('featured')
    const limit = searchParams.get('limit')

    const supabase = await createClient()
    
    // First, let's try to get braiders without the join to avoid foreign key issues
    let query = supabase
      .from('braiders')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (featured === 'true') {
      // For featured braiders, we can add additional filtering logic later
      query = query.limit(parseInt(limit || '2'))
    }

    if (limit && featured !== 'true') {
      query = query.limit(parseInt(limit))
    }

    const { data: braiders, error } = await query

    if (error) {
      console.error('Error fetching braiders:', error)
      // Return empty array instead of error for now since there are no braiders yet
      return NextResponse.json({ braiders: [] })
    }

    // If no braiders exist, return some mock data for development
    if (!braiders || braiders.length === 0) {
      const mockBraiders = [
        {
          id: 'mock-1',
          name: 'Maria Silva',
          bio: 'Especialista em tranças africanas com mais de 10 anos de experiência.',
          location: 'São Paulo, SP',
          contactEmail: 'maria@example.com',
          contactPhone: '(11) 99999-1234',
          profileImageUrl: '/placeholder.svg?height=200&width=200&text=Maria',
          services: [],
          portfolioImages: ['/placeholder.svg?height=300&width=300&text=Portfolio1'],
          status: 'approved',
          averageRating: 4.8,
          totalReviews: 45
        },
        {
          id: 'mock-2',
          name: 'Ana Costa',
          bio: 'Trancista profissional especializada em box braids e twist braids.',
          location: 'Rio de Janeiro, RJ',
          contactEmail: 'ana@example.com',
          contactPhone: '(21) 99999-5678',
          profileImageUrl: '/placeholder.svg?height=200&width=200&text=Ana',
          services: [],
          portfolioImages: ['/placeholder.svg?height=300&width=300&text=Portfolio2'],
          status: 'approved',
          averageRating: 4.9,
          totalReviews: 32
        }
      ]

      const featuredMockBraiders = featured === 'true' 
        ? mockBraiders.slice(0, parseInt(limit || '2'))
        : mockBraiders

      return NextResponse.json({ braiders: featuredMockBraiders })
    }

    // Transform data to match frontend expectations (for real data when it exists)
    const transformedBraiders = braiders.map(braider => ({
      id: braider.id,
      name: 'Nome não disponível', // We'll get this from users table later
      bio: braider.bio,
      location: braider.location,
      contactEmail: '',
      contactPhone: braider.contact_phone || '',
      profileImageUrl: '/placeholder.svg?height=200&width=200&text=Braider',
      services: [],
      portfolioImages: braider.portfolio_images || [],
      status: braider.status,
      averageRating: braider.average_rating || 0,
      totalReviews: braider.total_reviews || 0
    }))

    return NextResponse.json({ braiders: transformedBraiders })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}