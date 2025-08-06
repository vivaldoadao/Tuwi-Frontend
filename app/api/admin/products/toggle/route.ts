import { NextRequest, NextResponse } from 'next/server'
import { toggleProductStatusAdmin } from '@/lib/data-admin'

// Simple admin check - in production you'd check roles from database
async function isAdmin(req: NextRequest) {
  return true
}

export async function PUT(request: NextRequest) {
  try {
    if (!await isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId } = await request.json()
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    const result = await toggleProductStatusAdmin(productId)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error toggling product status:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}