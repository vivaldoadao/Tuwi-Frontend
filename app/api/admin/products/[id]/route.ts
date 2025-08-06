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
      name: data.name || '',
      price: parseFloat(data.price || '0'),
      imageUrl: (data.images && data.images.length > 0) ? data.images[0] : '/placeholder.svg',
      description: data.description || '',
      longDescription: data.long_description || data.description || '',
      category: data.category || 'Outros',
      stockQuantity: parseInt(data.stock_quantity || '0'),
      isActive: data.is_active ?? true,
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || data.created_at || new Date().toISOString(),
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()
    
    // Transform data for database
    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.price !== undefined) updateData.price = body.price.toString()
    if (body.description !== undefined) updateData.description = body.description
    if (body.longDescription !== undefined) updateData.long_description = body.longDescription
    if (body.category !== undefined) updateData.category = body.category
    if (body.stockQuantity !== undefined) updateData.stock_quantity = body.stockQuantity
    if (body.isActive !== undefined) updateData.is_active = body.isActive
    if (body.images !== undefined) updateData.images = body.images
    updateData.updated_at = new Date().toISOString()
    
    const { data, error } = await adminSupabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating product:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Transform response to ProductAdmin format
    const product = {
      id: data.id,
      name: data.name || '',
      price: parseFloat(data.price || '0'),
      imageUrl: (data.images && data.images.length > 0) ? data.images[0] : '/placeholder.svg',
      description: data.description || '',
      longDescription: data.long_description || data.description || '',
      category: data.category || 'Outros',
      stockQuantity: parseInt(data.stock_quantity || '0'),
      isActive: data.is_active ?? true,
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || data.created_at || new Date().toISOString(),
      images: data.images || []
    }
    
    return NextResponse.json({ success: true, message: 'Product updated successfully', product })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    
    const { error } = await adminSupabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting product:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ success: true, message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}