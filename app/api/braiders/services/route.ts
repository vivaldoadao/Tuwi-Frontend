import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side service client with admin privileges
const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Getting services with pagination...')
    
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '6')
    const offset = (page - 1) * limit
    
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        message: 'Email é obrigatório' 
      }, { status: 400 })
    }
    
    const serviceSupabase = getServiceClient()
    
    // Find user by email
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()
    
    if (userError || !userData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      }, { status: 404 })
    }

    // Find braider by user_id
    const { data: braiderData, error: braiderError } = await serviceSupabase
      .from('braiders')
      .select('id')
      .eq('user_id', userData.id)
      .single()
    
    if (braiderError || !braiderData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Perfil de trancista não encontrado' 
      }, { status: 404 })
    }

    // Get total count of services
    const { count, error: countError } = await serviceSupabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('braider_id', braiderData.id)
    
    if (countError) {
      console.error('❌ Error counting services:', countError)
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao contar serviços' 
      }, { status: 500 })
    }

    // Get paginated services
    const { data: servicesData, error: servicesError } = await serviceSupabase
      .from('services')
      .select('*')
      .eq('braider_id', braiderData.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (servicesError) {
      console.error('❌ Error fetching services:', servicesError)
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao buscar serviços: ' + servicesError.message 
      }, { status: 500 })
    }
    
    // Format services to match frontend expectations
    const formattedServices = (servicesData || []).map((service: any) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      price: parseFloat(service.price),
      durationMinutes: service.duration_minutes,
      imageUrl: service.image_url,
      isAvailable: service.is_available
    }))
    
    const totalPages = Math.ceil((count || 0) / limit)
    
    console.log('✅ Services fetched successfully:', formattedServices.length, 'of', count)
    
    return NextResponse.json({ 
      success: true, 
      data: {
        services: formattedServices,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    })
    
  } catch (error) {
    console.error('💥 Error fetching services:', error)
    
    return NextResponse.json({ 
      success: false, 
      message: 'Erro inesperado ao buscar serviços',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Creating new service...')
    
    const { email, name, description, price, durationMinutes } = await request.json()
    
    if (!email || !name || !price || !durationMinutes) {
      return NextResponse.json({ 
        success: false, 
        message: 'Todos os campos são obrigatórios' 
      }, { status: 400 })
    }
    
    const serviceSupabase = getServiceClient()
    
    // Find user by email
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()
    
    if (userError || !userData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      }, { status: 404 })
    }

    // Find braider by user_id
    const { data: braiderData, error: braiderError } = await serviceSupabase
      .from('braiders')
      .select('id')
      .eq('user_id', userData.id)
      .single()
    
    if (braiderError || !braiderData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Perfil de trancista não encontrado' 
      }, { status: 404 })
    }

    // Create new service
    const serviceData = {
      braider_id: braiderData.id,
      name: name.trim(),
      description: description?.trim() || '',
      price: parseFloat(price),
      duration_minutes: parseInt(durationMinutes),
      is_available: true,
      image_url: '/placeholder.svg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data: newService, error: serviceError } = await serviceSupabase
      .from('services')
      .insert(serviceData)
      .select()
      .single()
    
    if (serviceError) {
      console.error('❌ Error creating service:', serviceError)
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao criar serviço: ' + serviceError.message 
      }, { status: 500 })
    }
    
    console.log('✅ Service created successfully:', newService.id)
    
    // Format response to match frontend expectations
    const formattedService = {
      id: newService.id,
      name: newService.name,
      description: newService.description,
      price: parseFloat(newService.price),
      durationMinutes: newService.duration_minutes,
      imageUrl: newService.image_url,
      isAvailable: newService.is_available
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Serviço criado com sucesso!',
      data: formattedService
    })
    
  } catch (error) {
    console.error('💥 Error creating service:', error)
    
    return NextResponse.json({ 
      success: false, 
      message: 'Erro inesperado ao criar serviço',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Deleting service...')
    
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId')
    const email = searchParams.get('email')
    
    if (!serviceId || !email) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID do serviço e email são obrigatórios' 
      }, { status: 400 })
    }
    
    const serviceSupabase = getServiceClient()
    
    // Find user by email
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()
    
    if (userError || !userData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      }, { status: 404 })
    }

    // Find braider by user_id
    const { data: braiderData, error: braiderError } = await serviceSupabase
      .from('braiders')
      .select('id')
      .eq('user_id', userData.id)
      .single()
    
    if (braiderError || !braiderData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Perfil de trancista não encontrado' 
      }, { status: 404 })
    }

    // Verify service belongs to this braider
    const { data: serviceData, error: serviceCheckError } = await serviceSupabase
      .from('services')
      .select('id')
      .eq('id', serviceId)
      .eq('braider_id', braiderData.id)
      .single()
    
    if (serviceCheckError || !serviceData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Serviço não encontrado ou não autorizado' 
      }, { status: 404 })
    }

    // Delete the service
    const { error: deleteError } = await serviceSupabase
      .from('services')
      .delete()
      .eq('id', serviceId)
    
    if (deleteError) {
      console.error('❌ Error deleting service:', deleteError)
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao deletar serviço: ' + deleteError.message 
      }, { status: 500 })
    }
    
    console.log('✅ Service deleted successfully:', serviceId)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Serviço removido com sucesso!'
    })
    
  } catch (error) {
    console.error('💥 Error deleting service:', error)
    
    return NextResponse.json({ 
      success: false, 
      message: 'Erro inesperado ao remover serviço',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('✏️ Updating service...')
    
    const { serviceId, email, name, description, price, durationMinutes } = await request.json()
    
    if (!serviceId || !email || !name || !price || !durationMinutes) {
      return NextResponse.json({ 
        success: false, 
        message: 'Todos os campos são obrigatórios' 
      }, { status: 400 })
    }
    
    const serviceSupabase = getServiceClient()
    
    // Find user by email
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()
    
    if (userError || !userData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      }, { status: 404 })
    }

    // Find braider by user_id
    const { data: braiderData, error: braiderError } = await serviceSupabase
      .from('braiders')
      .select('id')
      .eq('user_id', userData.id)
      .single()
    
    if (braiderError || !braiderData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Perfil de trancista não encontrado' 
      }, { status: 404 })
    }

    // Verify service belongs to this braider
    const { data: existingService, error: serviceCheckError } = await serviceSupabase
      .from('services')
      .select('id')
      .eq('id', serviceId)
      .eq('braider_id', braiderData.id)
      .single()
    
    if (serviceCheckError || !existingService) {
      return NextResponse.json({ 
        success: false, 
        message: 'Serviço não encontrado ou não autorizado' 
      }, { status: 404 })
    }

    // Update service
    const updateData = {
      name: name.trim(),
      description: description?.trim() || '',
      price: parseFloat(price),
      duration_minutes: parseInt(durationMinutes),
      updated_at: new Date().toISOString()
    }
    
    const { data: updatedService, error: updateError } = await serviceSupabase
      .from('services')
      .update(updateData)
      .eq('id', serviceId)
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Error updating service:', updateError)
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao atualizar serviço: ' + updateError.message 
      }, { status: 500 })
    }
    
    console.log('✅ Service updated successfully:', updatedService.id)
    
    // Format response to match frontend expectations
    const formattedService = {
      id: updatedService.id,
      name: updatedService.name,
      description: updatedService.description,
      price: parseFloat(updatedService.price),
      durationMinutes: updatedService.duration_minutes,
      imageUrl: updatedService.image_url,
      isAvailable: updatedService.is_available
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Serviço atualizado com sucesso!',
      data: formattedService
    })
    
  } catch (error) {
    console.error('💥 Error updating service:', error)
    
    return NextResponse.json({ 
      success: false, 
      message: 'Erro inesperado ao atualizar serviço',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}