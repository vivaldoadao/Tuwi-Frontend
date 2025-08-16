import { z } from "zod"

// Schema para dados pessoais
export const personalDataSchema = z.object({
  name: z
    .string()
    .min(2, "Nome é obrigatório e deve ter pelo menos 2 caracteres")
    .max(100, "Nome não pode ter mais de 100 caracteres"),
  
  bio: z
    .string()
    .min(10, "Biografia é obrigatória e deve ter pelo menos 10 caracteres")
    .max(1000, "Biografia não pode ter mais de 1000 caracteres"),
  
  contactEmail: z
    .string()
    .email("Email deve ter um formato válido")
    .min(1, "Email é obrigatório"),
  
  contactPhone: z
    .string()
    .min(9, "Telefone é obrigatório e deve ter pelo menos 9 dígitos")
    .regex(/^[\+]?[0-9\s\-\(\)]+$/, "Telefone deve conter apenas números, espaços, +, -, ( e )"),
  
  whatsapp: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 9, {
      message: "WhatsApp deve ter pelo menos 9 dígitos se fornecido"
    }),
  
  instagram: z
    .string()
    .optional()
    .refine((val) => !val || val.startsWith("@") || !val.includes("@"), {
      message: "Instagram deve ser um username (com ou sem @) ou deixe vazio"
    }),
  
  profileImageUrl: z.string().url().optional().or(z.literal(""))
})

// Schema para dados de localização
export const locationDataSchema = z
  .object({
    district: z
      .string()
      .min(1, "Distrito é obrigatório"),
    
    concelho: z
      .string()
      .min(1, "Concelho é obrigatório"),
    
    freguesia: z
      .string()
      .optional(),
    
    address: z
      .string()
      .optional(),
    
    postalCode: z
      .string()
      .optional()
      .refine((val) => !val || /^\d{4}-\d{3}$/.test(val), {
        message: "Código postal deve ter o formato XXXX-XXX"
      }),
    
    servesHome: z.boolean(),
    servesStudio: z.boolean(),
    servesSalon: z.boolean(),
    
    maxTravelDistance: z
      .number()
      .min(1, "Distância deve ser pelo menos 1 km")
      .max(200, "Distância não pode ser maior que 200 km")
      .optional(),
    
    salonName: z.string().optional(),
    salonAddress: z.string().optional()
  })
  .refine((data) => data.servesHome || data.servesStudio || data.servesSalon, {
    message: "Selecione pelo menos uma modalidade de atendimento"
  })
  .refine(
    (data) => {
      if (data.servesSalon) {
        return data.salonName && data.salonName.length > 0 && data.salonAddress && data.salonAddress.length > 0
      }
      return true
    },
    {
      message: "Nome e endereço do salão são obrigatórios quando atende no salão"
    }
  )

// Schema para dados de serviços
export const serviceDataSchema = z
  .object({
    specialties: z
      .array(z.string())
      .min(1, "Selecione pelo menos uma especialidade"),
    
    yearsExperience: z
      .enum(["iniciante", "1-2", "3-5", "6-10", "10+"], {
        errorMap: () => ({ message: "Experiência é obrigatória" })
      }),
    
    certificates: z
      .string()
      .optional(),
    
    portfolio: z
      .array(z.string())
      .optional(),
    
    minPrice: z
      .number()
      .min(0, "Preço mínimo deve ser maior ou igual a 0")
      .optional(),
    
    maxPrice: z
      .number()
      .min(0, "Preço máximo deve ser maior ou igual a 0")  
      .optional(),
    
    availability: z.object({
      monday: z.boolean(),
      tuesday: z.boolean(),
      wednesday: z.boolean(),
      thursday: z.boolean(),
      friday: z.boolean(),
      saturday: z.boolean(),
      sunday: z.boolean()
    })
  })
  .refine(
    (data) => {
      if (data.minPrice !== undefined && data.maxPrice !== undefined) {
        return data.minPrice <= data.maxPrice
      }
      return true
    },
    {
      message: "Preço mínimo não pode ser maior que o preço máximo",
      path: ["minPrice"] // Error will be attached to minPrice field
    }
  )

// Schema completo do formulário de registro
export const braiderRegistrationSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório e deve ter pelo menos 2 caracteres"),
  bio: z.string().min(10, "Biografia é obrigatória e deve ter pelo menos 10 caracteres"),
  location: z.string().min(1, "Localização é obrigatória"),
  contactEmail: z.string().email("Email deve ter um formato válido"),
  contactPhone: z.string().min(9, "Telefone é obrigatório"),
  profileImageUrl: z.string().optional(),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  district: z.string().min(1, "Distrito é obrigatório"),
  concelho: z.string().min(1, "Concelho é obrigatório"),
  freguesia: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  servesHome: z.boolean(),
  servesStudio: z.boolean(),
  servesSalon: z.boolean(),
  maxTravelDistance: z.number().optional(),
  salonName: z.string().optional(),
  salonAddress: z.string().optional(),
  specialties: z.array(z.string()).min(1, "Selecione pelo menos uma especialidade"),
  yearsExperience: z.enum(["iniciante", "1-2", "3-5", "6-10", "10+"], {
    errorMap: () => ({ message: "Selecione sua experiência" })
  }),
  certificates: z.string().optional(),
  minPrice: z.number().positive("Preço mínimo deve ser maior que zero").optional(),
  maxPrice: z.number().positive("Preço máximo deve ser maior que zero").optional(),
  availability: z.object({
    monday: z.boolean(),
    tuesday: z.boolean(),
    wednesday: z.boolean(),
    thursday: z.boolean(),
    friday: z.boolean(),
    saturday: z.boolean(),
    sunday: z.boolean()
  })
}).refine(
  (data) => data.servesHome || data.servesStudio || data.servesSalon,
  {
    message: "Selecione pelo menos uma modalidade de atendimento",
    path: ["servesHome"] // Error attached to service types
  }
).refine(
  (data) => {
    if (data.servesSalon) {
      return data.salonName && data.salonName.length > 0 && data.salonAddress && data.salonAddress.length > 0
    }
    return true
  },
  {
    message: "Nome e endereço do salão são obrigatórios quando atende no salão",
    path: ["salonName"]
  }
).refine(
  (data) => {
    if (data.minPrice && data.maxPrice) {
      return data.minPrice <= data.maxPrice
    }
    return true // Se um dos preços não está definido, não validar
  },
  {
    message: "O preço mínimo deve ser menor ou igual ao preço máximo",
    path: ["maxPrice"] // Error will be attached to maxPrice field
  }
)

// Tipos TypeScript baseados nos schemas
export type PersonalData = z.infer<typeof personalDataSchema>
export type LocationData = z.infer<typeof locationDataSchema>
export type ServiceData = z.infer<typeof serviceDataSchema>
export type BraiderRegistrationData = z.infer<typeof braiderRegistrationSchema>

// Função utilitária para validar cada step
export function validateStep1(data: Partial<PersonalData>) {
  return personalDataSchema.safeParse(data)
}

export function validateStep2(data: Partial<LocationData>) {
  return locationDataSchema.safeParse(data)
}

export function validateStep3(data: Partial<ServiceData>) {
  return serviceDataSchema.safeParse(data)
}

// Função para validar os dados completos
export function validateBraiderRegistration(data: Partial<BraiderRegistrationData>) {
  return braiderRegistrationSchema.safeParse(data)
}