/**
 * Utility functions for currency formatting
 */

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

export function formatEuroCompact(amount: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(amount)
}

export function parseEuroString(euroString: string): number {
  // Remove currency symbol and parse
  return parseFloat(euroString.replace(/[€\s,]/g, '').replace(',', '.')) || 0
}

export const CURRENCY_SYMBOL = '€'
export const CURRENCY_CODE = 'EUR'