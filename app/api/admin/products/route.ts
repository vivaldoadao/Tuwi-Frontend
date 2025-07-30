import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { 
  createProductAdmin, 
  getAllProductsAdminSecure,
  updateProductAdmin,
  toggleProductStatusAdmin,
  deleteProductAdmin 
} from '@/lib/data-admin'

// Simple admin check - in production you'd check roles from database
async function isAdmin(req: NextRequest) {
  // For now, we'll assume all authenticated users are admins
  // In production, check user role from database
  return true
}

export async function GET(request: NextRequest) {
  try {
    if (!await isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || undefined
    const category = searchParams.get('category') || undefined

    const result = await getAllProductsAdminSecure(page, limit, search, category)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in products API:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const productData = await request.json()
    const result = await createProductAdmin(productData)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!await isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId, ...productData } = await request.json()
    const result = await updateProductAdmin(productId, productData)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!await isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('id')
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    const result = await deleteProductAdmin(productId)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}