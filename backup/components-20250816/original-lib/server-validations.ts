import { z } from 'zod'

// Product validation schemas
export const createProductSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(200, 'Nome muito longo'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  price: z.number().positive('Preço deve ser positivo'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  inventory: z.number().int().min(0, 'Estoque deve ser um número inteiro não negativo'),
  images: z.array(z.string().url('URL da imagem inválida')).min(1, 'Pelo menos uma imagem é obrigatória'),
  featured: z.boolean().optional(),
  tags: z.array(z.string()).optional()
})

export const updateProductSchema = createProductSchema.partial()

// User validation schemas
export const registerUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
  phone: z.string().optional(),
  role: z.enum(['customer', 'braider', 'admin']).default('customer')
})

export const updateUserSchema = registerUserSchema.omit({ password: true }).partial()

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(8, 'Nova senha deve ter pelo menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"]
})

// Braider validation schemas
export const registerBraiderSchema = z.object({
  userId: z.string().uuid('ID do usuário inválido'),
  bio: z.string().min(50, 'Bio deve ter pelo menos 50 caracteres').max(1000, 'Bio muito longa'),
  location: z.string().min(5, 'Localização deve ser mais específica'),
  contactPhone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato de telefone inválido'),
  portfolioImages: z.array(z.string().url('URL da imagem inválida')).min(1, 'Pelo menos uma imagem do portfólio é obrigatória'),
  services: z.array(z.object({
    name: z.string().min(1, 'Nome do serviço é obrigatório'),
    description: z.string().min(10, 'Descrição do serviço deve ter pelo menos 10 caracteres'),
    price: z.number().positive('Preço deve ser positivo'),
    duration: z.number().int().positive('Duração deve ser um número positivo'),
    category: z.string().min(1, 'Categoria é obrigatória')
  })).min(1, 'Pelo menos um serviço deve ser cadastrado')
})

export const updateBraiderSchema = registerBraiderSchema.omit({ userId: true }).partial()

// Booking validation schemas
export const createBookingSchema = z.object({
  braiderId: z.string().min(1, 'ID do trancista é obrigatório'),
  serviceId: z.string().min(1, 'ID do serviço é obrigatório'),
  clientName: z.string().min(2, 'Nome do cliente é obrigatório'),
  clientEmail: z.string().email('Email inválido'),
  clientPhone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').max(20, 'Telefone muito longo'),
  date: z.string().refine((date) => {
    const bookingDate = new Date(date)
    const now = new Date()
    return bookingDate > now
  }, 'Data deve ser no futuro'),
  time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato de hora inválido'),
  locationType: z.enum(['salon', 'client_home'], { errorMap: () => ({ message: 'Tipo de localização inválido' }) }),
  address: z.string().optional(),
  notes: z.string().max(500, 'Observações muito longas').optional()
})

export const updateBookingStatusSchema = z.object({
  bookingId: z.string().min(1, 'ID do agendamento é obrigatório'),
  status: z.enum(['Pendente', 'Confirmado', 'Em Andamento', 'Concluído', 'Cancelado'], { errorMap: () => ({ message: 'Status inválido' }) }),
  notes: z.string().max(500, 'Observações muito longas').optional()
})

// Order validation schemas
export const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1, 'ID do produto é obrigatório'),
    quantity: z.number().int().positive('Quantidade deve ser um número inteiro positivo'),
    price: z.number().positive('Preço deve ser positivo')
  })).min(1, 'Pelo menos um item é obrigatório'),
  total: z.number().positive('Total deve ser positivo'),
  shippingAddress: z.object({
    street: z.string().min(5, 'Endereço deve ser mais específico'),
    city: z.string().min(2, 'Cidade é obrigatória'),
    state: z.string().min(2, 'Estado é obrigatório'),
    zipCode: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
    country: z.string().default('Brasil')
  }),
  paymentMethod: z.enum(['credit_card', 'debit_card', 'pix', 'bank_transfer'], { errorMap: () => ({ message: 'Método de pagamento inválido' }) }),
  notes: z.string().max(500, 'Observações muito longas').optional()
})

// Review validation schemas
export const createReviewSchema = z.object({
  rating: z.number().int().min(1, 'Avaliação deve ser entre 1 e 5').max(5, 'Avaliação deve ser entre 1 e 5'),
  comment: z.string().min(10, 'Comentário deve ter pelo menos 10 caracteres').max(1000, 'Comentário muito longo'),
  orderId: z.string().optional(),
  bookingId: z.string().optional()
}).refine((data) => data.orderId || data.bookingId, {
  message: "ID do pedido ou agendamento é obrigatório"
})

// Generic validation helper
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return { success: false, error: firstError.message }
    }
    return { success: false, error: 'Dados inválidos' }
  }
}

// Email validation
export const emailValidation = z.string().email('Email inválido')

// Phone validation (Brazilian format)
export const phoneValidation = z.string().regex(
  /^\(\d{2}\)\s\d{4,5}-\d{4}$/, 
  'Formato de telefone inválido. Use: (XX) XXXXX-XXXX'
)

// CPF validation (Brazilian document)
export const cpfValidation = z.string().regex(
  /^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 
  'CPF inválido. Use o formato: XXX.XXX.XXX-XX'
)

// Password strength validation
export const passwordValidation = z.string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .regex(/^(?=.*[a-z])/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/^(?=.*[A-Z])/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/^(?=.*\d)/, 'Senha deve conter pelo menos um número')
  .regex(/^(?=.*[@$!%*?&])/, 'Senha deve conter pelo menos um símbolo (@$!%*?&)')

// File upload validation
export const imageUploadValidation = z.object({
  file: z.instanceof(File, { message: 'Arquivo inválido' }),
  maxSize: z.number().default(5 * 1024 * 1024) // 5MB default
}).refine((data) => data.file.size <= data.maxSize, {
  message: 'Arquivo muito grande. Máximo 5MB'
}).refine((data) => ['image/jpeg', 'image/png', 'image/webp'].includes(data.file.type), {
  message: 'Tipo de arquivo inválido. Use JPEG, PNG ou WebP'
})