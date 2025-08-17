import { createClient as createServiceClient } from '@supabase/supabase-js'

// Service client para contornar RLS
const getServiceClient = () => {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface SiteContent {
  id: string
  key: string
  title: string
  content_type: 'text' | 'html' | 'image' | 'json'
  content: string | null
  meta_data: Record<string, any>
  page_section: string
  display_order: number
  is_active: boolean
}

interface SiteSetting {
  id: string
  key: string
  value: string
  description: string
  data_type: 'text' | 'number' | 'boolean' | 'json'
  category: string
  is_public: boolean
}

export interface HeroSlideData {
  title: string
  subtitle: string
  description: string
  imageUrl: string
  ctaText: string
  ctaLink: string
  secondaryCtaText: string
  secondaryCtaLink: string
}

export interface AboutValues {
  title: string
  description: string
  icon: string
}

export interface AboutStatistics {
  value: string
  label: string
  color: string
}

// Cache para melhorar performance
let contentCache: Map<string, SiteContent[]> = new Map()
let settingsCache: Map<string, SiteSetting[]> = new Map()
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

function isCacheValid(): boolean {
  return Date.now() - cacheTimestamp < CACHE_TTL
}

async function fetchContentBySection(section: string): Promise<SiteContent[]> {
  const cacheKey = `section_${section}`
  
  if (isCacheValid() && contentCache.has(cacheKey)) {
    return contentCache.get(cacheKey)!
  }

  try {
    const serviceClient = getServiceClient()
    
    const { data, error } = await serviceClient
      .from('site_contents')
      .select('*')
      .eq('page_section', section)
      .eq('is_active', true)
      .order('display_order')

    if (error) {
      console.error(`Error fetching content for section ${section}:`, error)
      return []
    }

    const contents = data || []
    contentCache.set(cacheKey, contents)
    cacheTimestamp = Date.now()

    return contents

  } catch (error) {
    console.error(`Error fetching content for section ${section}:`, error)
    return []
  }
}

async function fetchContentByKey(key: string): Promise<SiteContent | null> {
  try {
    const serviceClient = getServiceClient()
    
    const { data, error } = await serviceClient
      .from('site_contents')
      .select('*')
      .eq('key', key)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return null
    }

    return data

  } catch (error) {
    console.error(`Error fetching content for key ${key}:`, error)
    return null
  }
}

async function fetchSettings(category?: string): Promise<SiteSetting[]> {
  const cacheKey = category ? `settings_${category}` : 'settings_all'
  
  if (isCacheValid() && settingsCache.has(cacheKey)) {
    return settingsCache.get(cacheKey)!
  }

  try {
    const serviceClient = getServiceClient()
    
    let query = serviceClient
      .from('site_settings')
      .select('*')
      .eq('is_public', true)

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query.order('key')

    if (error) {
      console.error('Error fetching settings:', error)
      return []
    }

    const settings = data || []
    settingsCache.set(cacheKey, settings)
    cacheTimestamp = Date.now()

    return settings

  } catch (error) {
    console.error('Error fetching settings:', error)
    return []
  }
}

// ===== HERO CAROUSEL =====
export async function getHeroSlides(): Promise<HeroSlideData[]> {
  const heroContents = await fetchContentBySection('hero')
  
  return heroContents
    .filter(content => content.content_type === 'json')
    .map(content => {
      try {
        return JSON.parse(content.content || '{}') as HeroSlideData
      } catch {
        return {
          title: 'TUWI',
          subtitle: 'Sua Beleza, Nossa Especialidade',
          description: 'Descubra os melhores profissionais de beleza especializados em cuidados africanos em Portugal.',
          imageUrl: '/hero-braids.png',
          ctaText: 'Ver Produtos',
          ctaLink: '/products',
          secondaryCtaText: 'Encontrar Profissionais',
          secondaryCtaLink: '/braiders'
        }
      }
    })
}

// ===== ABOUT PAGE =====
export async function getAboutContent() {
  const aboutContents = await fetchContentBySection('about')
  
  const getContentByKey = (key: string) => {
    const content = aboutContents.find(c => c.key === key)
    return content?.content || ''
  }

  const getJsonContentByKey = (key: string) => {
    const content = aboutContents.find(c => c.key === key)
    try {
      return JSON.parse(content?.content || '[]')
    } catch {
      return []
    }
  }

  return {
    heroTitle: getContentByKey('about_hero_title') || 'Sobre a Tuwi',
    heroSubtitle: getContentByKey('about_hero_subtitle') || 'Uma jornada de paixão pela beleza africana.',
    missionTitle: getContentByKey('about_mission_title') || 'Nossa Missão',
    missionContent: getContentByKey('about_mission_content') || 'Bem-vindo à Tuwi...',
    missionImage: getContentByKey('about_mission_image') || '/placeholder.svg?height=400&width=400',
    values: getJsonContentByKey('about_values') as AboutValues[] || [],
    statistics: getJsonContentByKey('about_statistics') as AboutStatistics[] || []
  }
}

// ===== CONTACT PAGE =====
export async function getContactContent() {
  const contactContents = await fetchContentBySection('contact')
  
  const getContentByKey = (key: string) => {
    const content = contactContents.find(c => c.key === key)
    return content?.content || ''
  }

  const getJsonContentByKey = (key: string) => {
    const content = contactContents.find(c => c.key === key)
    try {
      return JSON.parse(content?.content || '{}')
    } catch {
      return {}
    }
  }

  return {
    heroTitle: getContentByKey('contact_hero_title') || 'Fale Conosco',
    heroSubtitle: getContentByKey('contact_hero_subtitle') || 'Nossa equipe está pronta para atendê-la.',
    email: getContentByKey('contact_email') || 'contato@tuwi.com',
    phone: getContentByKey('contact_phone') || '+351 912 345 678',
    support: getContentByKey('contact_support') || 'Atendimento especializado',
    hours: getJsonContentByKey('contact_hours') || {
      weekdays: '9h às 18h',
      saturday: '9h às 15h', 
      sunday: 'Fechado'
    },
    location: getJsonContentByKey('contact_location') || {
      name: 'Tuwi',
      address: 'Rua das Flores, 123',
      postal: '1200-001 Lisboa, Portugal',
      note: 'Atendimento presencial apenas com agendamento prévio'
    }
  }
}

// ===== HOMEPAGE =====
export async function getHomepageContent() {
  const homepageContents = await fetchContentBySection('homepage')
  
  const getContentByKey = (key: string) => {
    const content = homepageContents.find(c => c.key === key)
    return content?.content || ''
  }

  return {
    productsTitle: getContentByKey('homepage_products_title') || 'Nossos Produtos em Destaque',
    braidersTitle: getContentByKey('homepage_braiders_title') || 'Nossos Profissionais de Beleza em Destaque',
    braidersSubtitle: getContentByKey('homepage_braiders_subtitle') || 'Encontre especialistas talentosos em tranças, tratamentos capilares e cuidados de beleza africanos.',
    ctaBraiderTitle: getContentByKey('homepage_cta_braider_title') || 'É Profissional de Beleza? Junte-se à Tuwi!',
    ctaBraiderSubtitle: getContentByKey('homepage_cta_braider_subtitle') || 'Expanda o seu negócio em Portugal e conecte-se com clientes que valorizam a sua expertise em beleza e cuidados capilares.',
    aboutTitle: getContentByKey('homepage_about_title') || 'Beleza Sem Limites, Tradição Sem Fronteiras',
    aboutSubtitle: getContentByKey('homepage_about_subtitle') || 'Na Tuwi, celebramos a diversidade da beleza africana. Conectamos-te aos melhores profissionais especializados em tranças, tratamentos capilares e cuidados únicos para o teu cabelo.'
  }
}

// ===== FOOTER =====
export async function getFooterContent() {
  const footerContents = await fetchContentBySection('footer')
  
  const getContentByKey = (key: string) => {
    const content = footerContents.find(c => c.key === key)
    return content?.content || ''
  }

  return {
    description: getContentByKey('footer_description') || 'Tuwi - Conectando beleza e diversidade.',
    facebook: getContentByKey('footer_social_facebook') || 'https://facebook.com/tuwi',
    instagram: getContentByKey('footer_social_instagram') || 'https://instagram.com/tuwi',
    copyright: getContentByKey('footer_copyright') || '© 2024 Tuwi. Todos os direitos reservados.'
  }
}

// ===== SITE SETTINGS =====
export async function getSiteSettings() {
  const settings = await fetchSettings()
  
  const getSettingValue = (key: string) => {
    const setting = settings.find(s => s.key === key)
    return setting?.value || ''
  }

  return {
    siteName: getSettingValue('site_name') || 'Tuwi',
    siteTagline: getSettingValue('site_tagline') || 'Marketplace de Serviços de Beleza',
    siteLogo: getSettingValue('site_logo') || '/images/logo.png',
    metaKeywords: getSettingValue('meta_keywords') || 'beleza, tranças, cabeleireiro, tratamentos capilares, cuidados africanos, portugal',
    socialSharingEnabled: getSettingValue('social_sharing_enabled') === 'true'
  }
}

// Clear cache function for testing
export function clearContentCache() {
  contentCache.clear()
  settingsCache.clear()
  cacheTimestamp = 0
}