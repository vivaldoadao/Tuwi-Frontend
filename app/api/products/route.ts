import { NextRequest, NextResponse } from 'next/server'
// Temporarily disable auth import until NextAuth is fully configured
// import { auth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { productSchema } from '@/lib/validations'
import { z } from 'zod'

// GET /api/products - Get all products with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const limit = searchParams.get('limit')

    const supabase = await createClient()
    
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    if (limit) {
      query = query.limit(parseInt(limit))
    }

    const { data: products, error } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar produtos' },
        { status: 500 }
      )
    }

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create new product (admin only)
export async function POST(request: NextRequest) {
  try {
    // TODO: Re-enable auth after NextAuth setup is complete
    // const session = await auth()
    // 
    // if (!session?.user || session.user.role !== 'admin') {
    //   return NextResponse.json(
    //     { error: 'Acesso negado' },
    //     { status: 403 }
    //   )
    // }

    const body = await request.json()
    const validatedData = productSchema.parse(body)

    const supabase = await createClient()
    
    const { data: product, error } = await supabase
      .from('products')
      .insert([validatedData])
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error)
      return NextResponse.json(
        { error: 'Erro ao criar produto' },
        { status: 500 }
      )
    }

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}