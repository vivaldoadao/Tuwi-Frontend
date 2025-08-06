// Client-side API functions for calling our Next.js API routes

export async function registerBraider(braiderData: {
  name: string
  bio: string
  location: string
  contactEmail: string
  contactPhone: string
  profileImageUrl?: string
  whatsapp?: string
  instagram?: string
  district?: string
  concelho?: string
  freguesia?: string
  address?: string
  postalCode?: string
  servesHome?: boolean
  servesStudio?: boolean
  servesSalon?: boolean
  maxTravelDistance?: number
  salonName?: string
  salonAddress?: string
  specialties?: string[]
  yearsExperience?: string
  certificates?: string
  minPrice?: number
  maxPrice?: number
  availability?: {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
  }
}): Promise<{ success: boolean; message: string; braider?: any }> {
  try {
    const response = await fetch('/api/braiders/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(braiderData),
    })

    const result = await response.json()
    
    if (!response.ok) {
      return {
        success: false,
        message: result.message || 'Erro na comunicação com o servidor'
      }
    }
    
    return result
  } catch (error) {
    console.error('Error calling braider registration API:', error)
    return {
      success: false,
      message: 'Erro de conexão. Verifique sua internet e tente novamente.'
    }
  }
}