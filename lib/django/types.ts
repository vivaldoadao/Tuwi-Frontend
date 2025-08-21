/**
 * Types específicos para as APIs Django E-commerce
 */

// Django Product Admin type (baseado na estrutura do serializer Django)
export interface DjangoProductAdmin {
  id: string
  name: string
  slug: string
  short_description: string
  category: string
  category_name: string
  brand: string | null
  brand_name: string | null
  price: string // Django returns as string
  sale_price: string | null
  cost_price: string | null
  current_price: string
  discount_percentage: number
  is_on_sale: boolean
  sku: string
  stock_quantity: number
  low_stock_threshold: number
  is_active: boolean
  is_featured: boolean
  is_digital: boolean
  average_rating: string
  total_reviews: number
  primary_image: string | null
  images_urls: string[]
  is_in_stock: boolean
  is_low_stock: boolean
  created_at: string
  updated_at: string
}

// Django Category type
export interface DjangoCategory {
  id: string
  name: string
  slug: string
  description: string
  image: string | null
  parent: string | null
  is_active: boolean
  sort_order: number
  full_path: string
  products_count: number
  created_at: string
}

// Django E-commerce Statistics
export interface DjangoEcommerceStats {
  total_products: number
  active_products: number
  inactive_products: number
  featured_products: number
  low_stock_products: number
  out_of_stock_products: number
  total_product_value: number
  average_product_price: number
  total_orders: number
  pending_orders: number
  processing_orders: number
  shipped_orders: number
  delivered_orders: number
  total_revenue: number
  monthly_revenue: number
  average_order_value: number
  orders_by_status: Array<{ status: string; count: number }>
  top_selling_products: Array<{ name: string; orders_count: number }>
  recent_orders: Array<{
    id: string
    order_number: string
    user__email: string
    status: string
    total_amount: number
    created_at: string
  }>
  total_customers: number
  active_carts: number
}

// Frontend ProductAdmin type (compatível com o formato atual)
export interface ProductAdmin {
  id: string
  name: string
  description: string
  longDescription?: string // For compatibility with existing types
  category: string
  price: number
  salePrice?: number | null
  costPrice?: number | null
  currentPrice: number
  stockQuantity: number
  lowStockThreshold?: number
  isActive: boolean
  isFeatured?: boolean
  isDigital?: boolean
  sku: string
  imageUrl: string | null
  images: string[]
  averageRating?: number
  totalReviews?: number
  isInStock: boolean
  isLowStock?: boolean
  isOnSale?: boolean
  discountPercentage?: number
  createdAt: string
  updatedAt?: string
  slug?: string
}