/**
 * SISTEMA DE COMBOS E ASSINATURAS DE PROMOÇÕES - Wilnara Tranças
 * 
 * Lógica de negócio para:
 * - Gestão de combos de promoções
 * - Assinaturas com renovação automática
 * - Aplicação de cupons de desconto
 * - Templates de promoção
 */

import { createServerClient } from '@supabase/ssr'

// Types
export interface PromotionCombo {
  id: string
  name: string
  description: string
  included_types: string[]
  profile_highlight_days: number
  hero_banner_days: number
  combo_package_days: number
  regular_price: number
  combo_price: number
  discount_percentage: number
  badge_text: string
  highlight_color: string
  features: string[]
  is_active: boolean
  is_featured: boolean
  sort_order: number
  min_subscription_months: number
  max_uses_per_user?: number
}

export interface PromotionSubscription {
  id: string
  user_id: string
  combo_id?: string
  package_id?: string
  billing_cycle: 'monthly' | 'quarterly' | 'yearly'
  cycle_price: number
  currency: string
  status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'suspended' | 'expired'
  trial_ends_at?: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  cancelled_at?: string
  stripe_subscription_id?: string
  stripe_customer_id?: string
  auto_renew_promotions: boolean
  next_promotion_start?: string
  total_promotions_created: number
  total_amount_paid: number
}

export interface PromotionCoupon {
  id: string
  code: string
  name: string
  description: string
  discount_type: 'percentage' | 'fixed_amount' | 'free_trial'
  discount_value: number
  applicable_to: string[]
  min_purchase_amount?: number
  max_discount_amount?: number
  usage_limit?: number
  usage_count: number
  usage_limit_per_user: number
  valid_from: string
  valid_until?: string
  is_active: boolean
  first_time_users_only: boolean
}

export interface ComboCalculation {
  combo: PromotionCombo
  original_price: number
  final_price: number
  discount_amount: number
  coupon_discount?: number
  total_savings: number
  promotions_to_create: {
    type: string
    duration: number
    start_date: string
    end_date: string
  }[]
}

class PromotionComboService {
  private supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() { return undefined },
        set() {},
        remove() {}
      }
    }
  )

  /**
   * Obter todos os combos disponíveis
   */
  async getAvailableCombos(options: {
    includeInactive?: boolean
    featuredOnly?: boolean
  } = {}): Promise<PromotionCombo[]> {
    try {
      let query = this.supabase
        .from('promotion_combos')
        .select('*')
        .order('sort_order', { ascending: true })

      if (!options.includeInactive) {
        query = query.eq('is_active', true)
      }

      if (options.featuredOnly) {
        query = query.eq('is_featured', true)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching combos:', error)
        return []
      }

      return data || []

    } catch (error) {
      console.error('Error in getAvailableCombos:', error)
      return []
    }
  }

  /**
   * Obter combo específico por ID
   */
  async getComboById(comboId: string): Promise<PromotionCombo | null> {
    try {
      const { data, error } = await this.supabase
        .from('promotion_combos')
        .select('*')
        .eq('id', comboId)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        console.error('Error fetching combo:', error)
        return null
      }

      return data

    } catch (error) {
      console.error('Error in getComboById:', error)
      return null
    }
  }

  /**
   * Calcular preço final de um combo com possível cupom
   */
  async calculateComboPrice(
    comboId: string,
    couponCode?: string,
    userId?: string
  ): Promise<ComboCalculation | null> {
    try {
      const combo = await this.getComboById(comboId)
      if (!combo) return null

      const startDate = new Date()
      const promotionsToCreate = []

      // Calcular promoções que serão criadas
      if (combo.profile_highlight_days > 0) {
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + combo.profile_highlight_days)

        promotionsToCreate.push({
          type: 'profile_highlight',
          duration: combo.profile_highlight_days,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        })
      }

      if (combo.hero_banner_days > 0) {
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + combo.hero_banner_days)

        promotionsToCreate.push({
          type: 'hero_banner',
          duration: combo.hero_banner_days,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        })
      }

      let finalPrice = combo.combo_price
      let couponDiscount = 0
      const comboDiscount = combo.regular_price - combo.combo_price

      // Aplicar cupom se fornecido
      if (couponCode && userId) {
        const couponResult = await this.validateAndApplyCoupon(
          couponCode, 
          userId, 
          finalPrice,
          'combo'
        )
        
        if (couponResult.valid) {
          couponDiscount = couponResult.discount_amount
          finalPrice = couponResult.final_amount
        }
      }

      return {
        combo,
        original_price: combo.regular_price,
        final_price: finalPrice,
        discount_amount: comboDiscount,
        coupon_discount: couponDiscount,
        total_savings: comboDiscount + couponDiscount,
        promotions_to_create: promotionsToCreate
      }

    } catch (error) {
      console.error('Error calculating combo price:', error)
      return null
    }
  }

  /**
   * Validar e aplicar cupom de desconto
   */
  async validateAndApplyCoupon(
    couponCode: string,
    userId: string,
    originalAmount: number,
    applicationType: 'combo' | 'package' | 'subscription'
  ): Promise<{
    valid: boolean
    coupon?: PromotionCoupon
    discount_amount: number
    final_amount: number
    error?: string
  }> {
    try {
      // 1. Buscar cupom
      const { data: coupon, error } = await this.supabase
        .from('promotion_coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single()

      if (error || !coupon) {
        return {
          valid: false,
          discount_amount: 0,
          final_amount: originalAmount,
          error: 'Cupom não encontrado ou inativo'
        }
      }

      // 2. Verificar se é aplicável ao tipo
      if (!coupon.applicable_to.includes(applicationType)) {
        return {
          valid: false,
          discount_amount: 0,
          final_amount: originalAmount,
          error: 'Cupom não aplicável a este tipo de compra'
        }
      }

      // 3. Verificar validade temporal
      const now = new Date()
      if (new Date(coupon.valid_from) > now) {
        return {
          valid: false,
          discount_amount: 0,
          final_amount: originalAmount,
          error: 'Cupom ainda não está válido'
        }
      }

      if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        return {
          valid: false,
          discount_amount: 0,
          final_amount: originalAmount,
          error: 'Cupom expirado'
        }
      }

      // 4. Verificar limite de uso geral
      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        return {
          valid: false,
          discount_amount: 0,
          final_amount: originalAmount,
          error: 'Cupom esgotado'
        }
      }

      // 5. Verificar uso por usuário
      const { data: userUses, error: usesError } = await this.supabase
        .from('promotion_coupon_uses')
        .select('id')
        .eq('coupon_id', coupon.id)
        .eq('user_id', userId)

      if (usesError) {
        console.error('Error checking coupon uses:', usesError)
      }

      if (userUses && userUses.length >= coupon.usage_limit_per_user) {
        return {
          valid: false,
          discount_amount: 0,
          final_amount: originalAmount,
          error: 'Você já utilizou este cupom o máximo de vezes permitido'
        }
      }

      // 6. Verificar valor mínimo
      if (coupon.min_purchase_amount && originalAmount < coupon.min_purchase_amount) {
        return {
          valid: false,
          discount_amount: 0,
          final_amount: originalAmount,
          error: `Valor mínimo de €${coupon.min_purchase_amount} não atingido`
        }
      }

      // 7. Verificar se é só para novos usuários
      if (coupon.first_time_users_only) {
        const { data: previousPurchases } = await this.supabase
          .from('promotion_transactions')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .limit(1)

        if (previousPurchases && previousPurchases.length > 0) {
          return {
            valid: false,
            discount_amount: 0,
            final_amount: originalAmount,
            error: 'Cupom válido apenas para novos usuários'
          }
        }
      }

      // 8. Calcular desconto
      let discountAmount = 0
      let finalAmount = originalAmount

      if (coupon.discount_type === 'free_trial') {
        // Lógica especial para trial gratuito será implementada na assinatura
        discountAmount = 0
        finalAmount = originalAmount
      } else if (coupon.discount_type === 'percentage') {
        discountAmount = (originalAmount * coupon.discount_value) / 100
        
        // Aplicar cap se definido
        if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
          discountAmount = coupon.max_discount_amount
        }
        
        finalAmount = originalAmount - discountAmount
      } else if (coupon.discount_type === 'fixed_amount') {
        discountAmount = Math.min(coupon.discount_value, originalAmount)
        finalAmount = originalAmount - discountAmount
      }

      return {
        valid: true,
        coupon,
        discount_amount: discountAmount,
        final_amount: Math.max(0, finalAmount) // Nunca negativo
      }

    } catch (error) {
      console.error('Error validating coupon:', error)
      return {
        valid: false,
        discount_amount: 0,
        final_amount: originalAmount,
        error: 'Erro interno ao validar cupom'
      }
    }
  }

  /**
   * Registrar uso de cupom
   */
  async recordCouponUse(
    couponId: string,
    userId: string,
    originalAmount: number,
    discountAmount: number,
    finalAmount: number,
    transactionId?: string,
    subscriptionId?: string
  ): Promise<boolean> {
    try {
      const { error: insertError } = await this.supabase
        .from('promotion_coupon_uses')
        .insert({
          coupon_id: couponId,
          user_id: userId,
          original_amount: originalAmount,
          discount_amount: discountAmount,
          final_amount: finalAmount,
          transaction_id: transactionId,
          subscription_id: subscriptionId,
          usage_metadata: {
            timestamp: new Date().toISOString()
          }
        })

      if (insertError) {
        console.error('Error recording coupon use:', insertError)
        return false
      }

      // Atualizar contador de uso do cupom
      const { error: updateError } = await this.supabase
        .rpc('increment_coupon_usage', { coupon_id: couponId })

      if (updateError) {
        console.error('Error updating coupon usage count:', updateError)
      }

      return true

    } catch (error) {
      console.error('Error in recordCouponUse:', error)
      return false
    }
  }

  /**
   * Criar promoções de um combo
   */
  async createComboPromotions(
    userId: string,
    comboId: string,
    transactionId?: string
  ): Promise<{
    success: boolean
    promotion_ids: string[]
    error?: string
  }> {
    try {
      const combo = await this.getComboById(comboId)
      if (!combo) {
        return {
          success: false,
          promotion_ids: [],
          error: 'Combo não encontrado'
        }
      }

      const promotionIds: string[] = []
      const startDate = new Date()

      // Criar promoção de destaque de perfil
      if (combo.profile_highlight_days > 0) {
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + combo.profile_highlight_days)

        const { data: promotion, error } = await this.supabase
          .from('promotions')
          .insert({
            user_id: userId,
            type: 'profile_highlight',
            title: `${combo.name} - Destaque de Perfil`,
            description: `Destaque por ${combo.profile_highlight_days} dias via ${combo.name}`,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            status: 'active',
            is_paid: true,
            price: 0, // Preço já foi pago no combo
            content_data: {
              source: 'combo',
              combo_id: comboId,
              combo_name: combo.name
            },
            metadata: {
              combo_id: comboId,
              transaction_id: transactionId,
              created_via: 'combo_purchase'
            }
          })
          .select()
          .single()

        if (error) {
          console.error('Error creating profile highlight promotion:', error)
        } else {
          promotionIds.push(promotion.id)
        }
      }

      // Criar promoção de banner
      if (combo.hero_banner_days > 0) {
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + combo.hero_banner_days)

        const { data: promotion, error } = await this.supabase
          .from('promotions')
          .insert({
            user_id: userId,
            type: 'hero_banner',
            title: `${combo.name} - Banner Principal`,
            description: `Banner por ${combo.hero_banner_days} dias via ${combo.name}`,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            status: 'pending', // Banner precisa de aprovação de conteúdo
            is_paid: true,
            price: 0,
            content_data: {
              source: 'combo',
              combo_id: comboId,
              combo_name: combo.name,
              needs_content: true // Usuário precisa definir conteúdo
            },
            metadata: {
              combo_id: comboId,
              transaction_id: transactionId,
              created_via: 'combo_purchase'
            }
          })
          .select()
          .single()

        if (error) {
          console.error('Error creating hero banner promotion:', error)
        } else {
          promotionIds.push(promotion.id)
        }
      }

      return {
        success: promotionIds.length > 0,
        promotion_ids: promotionIds
      }

    } catch (error) {
      console.error('Error creating combo promotions:', error)
      return {
        success: false,
        promotion_ids: [],
        error: 'Erro interno ao criar promoções'
      }
    }
  }

  /**
   * Obter templates disponíveis
   */
  async getPromotionTemplates(options: {
    promotionType?: string
    category?: string
    premiumOnly?: boolean
  } = {}): Promise<any[]> {
    try {
      let query = this.supabase
        .from('promotion_templates')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false })

      if (options.promotionType) {
        query = query.eq('promotion_type', options.promotionType)
      }

      if (options.category) {
        query = query.eq('category', options.category)
      }

      if (options.premiumOnly !== undefined) {
        query = query.eq('is_premium', options.premiumOnly)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching templates:', error)
        return []
      }

      return data || []

    } catch (error) {
      console.error('Error in getPromotionTemplates:', error)
      return []
    }
  }
}

// Instância singleton
export const promotionComboService = new PromotionComboService()

// Hook para uso em React
export function usePromotionCombos() {
  return {
    getAvailableCombos: promotionComboService.getAvailableCombos.bind(promotionComboService),
    getComboById: promotionComboService.getComboById.bind(promotionComboService),
    calculateComboPrice: promotionComboService.calculateComboPrice.bind(promotionComboService),
    validateAndApplyCoupon: promotionComboService.validateAndApplyCoupon.bind(promotionComboService),
    createComboPromotions: promotionComboService.createComboPromotions.bind(promotionComboService),
    getPromotionTemplates: promotionComboService.getPromotionTemplates.bind(promotionComboService)
  }
}

// All types are already exported above as interfaces