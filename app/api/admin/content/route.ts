import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'

// Service client para contornar RLS
const getServiceClient = () => {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Admin check using existing auth system
async function isAdmin() {
  try {
    const session = await auth()
    return session?.user?.role === 'admin'
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

// GET /api/admin/content - Listar todos os conteúdos
export async function GET(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const serviceClient = getServiceClient()

    const url = new URL(request.url)
    const section = url.searchParams.get('section')
    const type = url.searchParams.get('type')

    let query = serviceClient
      .from('site_contents')
      .select('*')
      .order('page_section')
      .order('display_order')

    if (section) {
      query = query.eq('page_section', section)
    }

    if (type) {
      query = query.eq('content_type', type)
    }

    const { data: contents, error } = await query

    if (error) {
      console.error('Error fetching contents:', error)
      return NextResponse.json({ error: 'Failed to fetch contents' }, { status: 500 })
    }

    return NextResponse.json({ contents })

  } catch (error) {
    console.error('Error in content API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/content - Criar novo conteúdo
export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = getServiceClient()

    const body = await request.json()
    const { 
      key, 
      title, 
      content_type, 
      content, 
      meta_data = {}, 
      page_section, 
      display_order = 0,
      is_active = true 
    } = body

    // Validações
    if (!key || !title || !content_type || !page_section) {
      return NextResponse.json(
        { error: 'Key, title, content_type and page_section are required' },
        { status: 400 }
      )
    }

    const { data: newContent, error } = await serviceClient
      .from('site_contents')
      .insert({
        key,
        title,
        content_type,
        content,
        meta_data,
        page_section,
        display_order,
        is_active,
        updated_by: session.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating content:', error)
      return NextResponse.json({ error: 'Failed to create content' }, { status: 500 })
    }

    return NextResponse.json({ content: newContent }, { status: 201 })

  } catch (error) {
    console.error('Error in content POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/content - Atualizar conteúdo existente
export async function PUT(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = getServiceClient()

    const body = await request.json()
    const { 
      id,
      title, 
      content, 
      meta_data, 
      display_order,
      is_active 
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Content ID is required' }, { status: 400 })
    }

    const updates: any = {
      updated_by: session.user.id
    }

    if (title !== undefined) updates.title = title
    if (content !== undefined) updates.content = content
    if (meta_data !== undefined) updates.meta_data = meta_data
    if (display_order !== undefined) updates.display_order = display_order
    if (is_active !== undefined) updates.is_active = is_active

    const { data: updatedContent, error } = await serviceClient
      .from('site_contents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating content:', error)
      return NextResponse.json({ error: 'Failed to update content' }, { status: 500 })
    }

    return NextResponse.json({ content: updatedContent })

  } catch (error) {
    console.error('Error in content PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/content - Deletar conteúdo
export async function DELETE(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const serviceClient = getServiceClient()

    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Content ID is required' }, { status: 400 })
    }

    const { error } = await serviceClient
      .from('site_contents')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting content:', error)
      return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Content deleted successfully' })

  } catch (error) {
    console.error('Error in content DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}