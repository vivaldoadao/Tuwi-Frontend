import { z } from 'zod'

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
})

// Braider schemas
export const braiderRegistrationSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  bio: z.string().min(50, 'Bio deve ter pelo menos 50 caracteres'),
  location: z.string().min(5, 'Localização deve ter pelo menos 5 caracteres'),
})

export const serviceSchema = z.object({
  name: z.string().min(5, 'Nome deve ter pelo menos 5 caracteres'),
  description: z.string().min(20, 'Descrição deve ter pelo menos 20 caracteres'),
  price: z.number().min(0, 'Preço deve ser positivo'),
  duration_minutes: z.number().min(30, 'Duração mínima de 30 minutos'),
  image_url: z.string().url().optional(),
})

// Booking schemas
export const bookingSchema = z.object({
  service_id: z.string().uuid('Service ID inválido'),
  booking_date: z.string().refine(date => {
    const bookingDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return bookingDate >= today
  }, 'Data deve ser futura'),
  booking_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
  service_type: z.enum(['domicilio', 'trancista']),
  client_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  client_email: z.string().email('Email inválido'),
  client_phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  client_address: z.string().optional(),
  notes: z.string().optional(),
})

// Product schemas
export const productSchema = z.object({
  name: z.string().min(5, 'Nome deve ter pelo menos 5 caracteres'),
  description: z.string().min(20, 'Descrição deve ter pelo menos 20 caracteres'),
  long_description: z.string().optional(),
  price: z.number().min(0, 'Preço deve ser positivo'),
  category: z.string().min(2, 'Categoria deve ter pelo menos 2 caracteres'),
  stock_quantity: z.number().int().min(0, 'Estoque deve ser não negativo'),
  images: z.array(z.string().url()).min(1, 'Pelo menos uma imagem é necessária'),
})

// Order schemas
export const orderSchema = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().min(1, 'Quantidade mínima é 1'),
  })).min(1, 'Pelo menos um item é necessário'),
  shipping_address: z.object({
    street: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
    city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
    state: z.string().min(2, 'Estado deve ter pelo menos 2 caracteres'),
    zip_code: z.string().min(5, 'CEP deve ter pelo menos 5 caracteres'),
    country: z.string().default('Brasil'),
  }),
  billing_address: z.object({
    street: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
    city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
    state: z.string().min(2, 'Estado deve ter pelo menos 2 caracteres'),
    zip_code: z.string().min(5, 'CEP deve ter pelo menos 5 caracteres'),
    country: z.string().default('Brasil'),
  }).optional(),
})

// Review schemas
export const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Avaliação mínima é 1').max(5, 'Avaliação máxima é 5'),
  comment: z.string().min(10, 'Comentário deve ter pelo menos 10 caracteres').optional(),
  booking_id: z.string().uuid('Booking ID inválido'),
})

// Availability schemas
export const availabilitySchema = z.object({
  available_date: z.string().refine(date => {
    const availableDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return availableDate >= today
  }, 'Data deve ser futura'),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
}).refine(data => data.start_time < data.end_time, {
  message: 'Hora de início deve ser anterior à hora de fim',
  path: ['end_time'],
})

// Export types
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type BraiderRegistrationInput = z.infer<typeof braiderRegistrationSchema>
export type ServiceInput = z.infer<typeof serviceSchema>
export type BookingInput = z.infer<typeof bookingSchema>
export type ProductInput = z.infer<typeof productSchema>
export type OrderInput = z.infer<typeof orderSchema>
export type ReviewInput = z.infer<typeof reviewSchema>
export type AvailabilityInput = z.infer<typeof availabilitySchema>