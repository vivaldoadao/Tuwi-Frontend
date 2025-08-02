/**
 * Utility functions for generating and handling order numbers
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Generate a unique 8-character order number
 * Format: XXXXXXXX (e.g., 6F0EBBD4)
 */
export function generateOrderNumber(): string {
  // Create a base from current timestamp (last 4 digits) + random
  const timestamp = Date.now().toString().slice(-4)
  const random = Math.random().toString(36).substr(2, 4).toUpperCase()
  
  // Combine and ensure it's 8 characters
  let orderNumber = (timestamp + random).replace(/[^A-Z0-9]/g, '').substr(0, 8)
  
  // Pad with random chars if needed
  while (orderNumber.length < 8) {
    orderNumber += Math.random().toString(36).substr(2, 1).toUpperCase()
  }
  
  return orderNumber.substr(0, 8)
}

/**
 * Check if an order number already exists
 */
export async function orderNumberExists(orderNumber: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .eq('order_number', orderNumber)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking order number:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Unexpected error checking order number:', error)
    return false
  }
}

/**
 * Generate a unique order number (checks database for duplicates)
 */
export async function generateUniqueOrderNumber(maxAttempts: number = 10): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const orderNumber = generateOrderNumber()
    const exists = await orderNumberExists(orderNumber)
    
    if (!exists) {
      return orderNumber
    }
  }
  
  // Fallback: use timestamp-based number
  const fallback = Date.now().toString().slice(-8).toUpperCase()
  return fallback.padStart(8, '0')
}

/**
 * Format order number for display (adds # prefix)
 */
export function formatOrderNumber(orderNumber: string): string {
  return `#${orderNumber}`
}

/**
 * Parse display order number (removes # prefix and normalizes)
 */
export function parseOrderNumber(displayOrderNumber: string): string {
  return displayOrderNumber.replace('#', '').trim().toUpperCase()
}

/**
 * Validate order number format (8 alphanumeric characters)
 */
export function isValidOrderNumber(orderNumber: string): boolean {
  const cleaned = parseOrderNumber(orderNumber)
  return /^[A-Z0-9]{8}$/.test(cleaned)
}