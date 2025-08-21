/**
 * Django Statistics API - responsável apenas pelas estatísticas e analytics
 */

import { apiCall } from './base'
import type { DjangoEcommerceStats } from './types'

// ============================================================================
// STATISTICS API
// ============================================================================

/**
 * Get e-commerce statistics for admin dashboard
 */
export async function getEcommerceStatsDjango(): Promise<DjangoEcommerceStats> {
  try {
    return await apiCall<DjangoEcommerceStats>('/admin/stats/')
  } catch (error) {
    console.error('Error fetching ecommerce stats from Django:', error)
    throw error
  }
}

/**
 * Get computed metrics from stats for dashboard cards
 */
export async function getDashboardMetrics(): Promise<{
  totalProducts: number
  activeProducts: number
  inactiveProducts: number
  lowStockProducts: number
  outOfStockProducts: number
  totalValue: number
  avgPrice: number
  totalOrders: number
  totalRevenue: number
  totalCustomers: number
}> {
  try {
    const stats = await getEcommerceStatsDjango()
    
    return {
      totalProducts: stats.total_products,
      activeProducts: stats.active_products,
      inactiveProducts: stats.inactive_products,
      lowStockProducts: stats.low_stock_products,
      outOfStockProducts: stats.out_of_stock_products,
      totalValue: stats.total_product_value,
      avgPrice: stats.average_product_price,
      totalOrders: stats.total_orders,
      totalRevenue: stats.total_revenue,
      totalCustomers: 0 // TODO: Add customer count to Django stats
    }
  } catch (error) {
    console.error('Error computing dashboard metrics:', error)
    throw error
  }
}