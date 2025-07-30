import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Simple admin check - in production you'd check roles from database
async function isAdmin(req: NextRequest) {
  return true
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()
    
    const { data, error } = await adminSupabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching product:', error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    // Transform to ProductAdmin format
    const product = {
      id: data.id,
      name: data.name,
      price: parseFloat(data.price),
      imageUrl: data.images[0] || '/placeholder.svg',
      description: data.description || '',
      longDescription: data.long_description || '',
      category: data.category || 'Outros',
      stockQuantity: data.stock_quantity || 0,
      isActive: data.is_active ?? true,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      images: data.images || []
    }
    
    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error in product detail API:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}