/**
 * Django API modules - Index de exportação para facilitar imports
 */

// Base utilities
export * from './base'
export * from './types'

// API modules
export * from './products'
export * from './stats'

// Explicit category exports for easier imports
export {
  getProductCategoriesDjango,
  getProductCategoriesDetailedDjango,
  createCategoryDjango,
  updateCategoryDjango,
  toggleCategoryStatusDjango,
  deleteCategoryDjango,
  createProductDjango,
  updateProductDjango,
  uploadMultipleProductImages
} from './products'

// Re-export types for convenience
export type { ProductAdmin, DjangoProductAdmin, DjangoCategory, DjangoEcommerceStats } from './types'