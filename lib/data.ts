export type Product = {
  id: string
  name: string
  price: number
  imageUrl: string
  description: string
  longDescription: string
}

export type Service = {
  id: string
  name: string
  price: number
  durationMinutes: number
  description: string
  imageUrl: string
}

export type Braider = {
  id: string
  name: string
  bio: string
  location: string
  contactEmail: string
  contactPhone: string
  profileImageUrl: string
  services: Service[]
  portfolioImages: string[]
  status: "pending" | "approved" | "rejected"
  // Novos campos do formulário expandido
  whatsapp?: string
  instagram?: string
  district?: string
  concelho?: string
  freguesia?: string
  address?: string
  postalCode?: string
  servesHome?: boolean
  servesStudio?: boolean
  servesSalon?: boolean
  maxTravelDistance?: number
  salonName?: string
  salonAddress?: string
  specialties?: string[]
  yearsExperience?: "iniciante" | "1-2" | "3-5" | "6-10" | "10+"
  certificates?: string
  minPrice?: number
  maxPrice?: number
  availability?: {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
  }
}

export type Booking = {
  id: string
  braiderId: string
  serviceId: string
  clientName: string
  clientEmail: string
  clientPhone: string
  clientAddress?: string // NOVO CAMPO: Endereço do cliente (opcional, para agendamentos ao domicílio)
  date: string // YYYY-MM-DD
  time: string // HH:MM
  bookingType: "domicilio" | "trancista" // Novo campo
  status: "Pendente" | "Confirmado" | "Cancelado"
  createdAt: string
}

// NOVO TIPO: Disponibilidade da Trancista
export type BraiderAvailability = {
  id: string
  braiderId: string
  date: string // YYYY-MM-DD
  startTime: string // HH:MM
  endTime: string // HH:MM
  isBooked: boolean // True se o slot estiver agendado
}

export const allProducts: Product[] = [
  {
    id: "1",
    name: "Trança Box Braids Clássica",
    price: 150.0,
    imageUrl: "/placeholder.svg?height=300&width=400&text=Box+Braids",
    description: "Cabelo sintético de alta qualidade para um visual clássico e duradouro.",
    longDescription:
      "As Box Braids clássicas são uma escolha atemporal para quem busca um visual elegante e de baixa manutenção. Feitas com cabelo sintético premium, elas oferecem durabilidade e um acabamento impecável. Perfeitas para proteger seus fios naturais e experimentar um novo estilo.",
  },
  {
    id: "2",
    name: "Crochet Braids Onduladas",
    price: 180.0,
    imageUrl: "/placeholder.svg?height=300&width=400&text=Crochet+Braids",
    description: "Fios ondulados para um estilo volumoso e natural.",
    longDescription:
      "Nossas Crochet Braids onduladas são ideais para quem deseja volume e movimento. Com uma textura suave e cachos definidos, elas proporcionam um look natural e deslumbrante. Fáceis de instalar e remover, são a opção perfeita para uma transformação rápida e impactante.",
  },
  {
    id: "3",
    name: "Twists Senegalesas Longas",
    price: 220.0,
    imageUrl: "/placeholder.svg?height=300&width=400&text=Twists+Senegalesas",
    description: "Twists elegantes e leves, perfeitas para qualquer ocasião.",
    longDescription:
      "As Twists Senegalesas longas da Wilnara Tranças são sinônimo de elegância e leveza. Com um caimento perfeito e um brilho sutil, elas são versáteis para o dia a dia ou eventos especiais. Confeccionadas com material de alta qualidade para garantir conforto e um visual impecável.",
  },
  {
    id: "4",
    name: "Faux Locs Leves",
    price: 250.0,
    imageUrl: "/placeholder.svg?height=300&width=400&text=Faux+Locs",
    description: "Locs sintéticas que imitam o cabelo natural, com conforto e estilo.",
    longDescription:
      "Experimente a beleza das Faux Locs com a leveza e o conforto que você merece. Nossas locs sintéticas são cuidadosamente elaboradas para imitar a textura e o caimento do cabelo natural, oferecendo um estilo autêntico e protetor. Duráveis e fáceis de manter, são a escolha ideal para um visual ousado e sofisticado.",
  },
  {
    id: "5",
    name: "Trança Nagô com Cachos",
    price: 190.0,
    imageUrl: "/placeholder.svg?height=300&width=400&text=Nagô+Cachos",
    description: "Base nagô com cachos soltos para um look moderno.",
    longDescription:
      "A Trança Nagô com Cachos combina a tradição das tranças nagô com a modernidade dos cachos soltos. Este estilo versátil é perfeito para quem busca um visual único, que valoriza a beleza natural e oferece praticidade no dia a dia. Feita com materiais de alta qualidade para garantir conforto e durabilidade.",
  },
  {
    id: "6",
    name: "Dreadlocks Sintéticos",
    price: 280.0,
    imageUrl: "/placeholder.svg?height=300&width=400&text=Dreadlocks",
    description: "Dreadlocks sintéticos realistas e de fácil aplicação.",
    longDescription:
      "Nossos Dreadlocks Sintéticos são a opção ideal para quem deseja um visual alternativo e cheio de personalidade sem comprometer o cabelo natural. Realistas e leves, são fáceis de aplicar e manter, proporcionando um estilo autêntico e duradouro. Disponíveis em diversas cores e comprimentos.",
  },
]

export const allBraiders: Braider[] = [
  {
    id: "braider-1",
    name: "Ana Trancista",
    bio: "Especialista em Box Braids e Twists Senegalesas com mais de 10 anos de experiência. Atendimento personalizado e com muito carinho.",
    location: "Lisboa, Portugal",
    contactEmail: "ana.trancista@example.com",
    contactPhone: "(351) 91234-5678",
    profileImageUrl: "/placeholder.svg?height=200&width=200&text=Ana+Trancista",
    services: [
      {
        id: "s1",
        name: "Box Braids Médias",
        price: 300.0,
        durationMinutes: 240,
        description: "Tranças médias com acabamento impecável.",
        imageUrl: "/placeholder.svg?height=150&width=200&text=Box+Braids+Medias",
      },
      {
        id: "s2",
        name: "Twists Senegalesas Finas",
        price: 350.0,
        durationMinutes: 300,
        description: "Twists leves e elegantes para um visual sofisticado.",
        imageUrl: "/placeholder.svg?height=150&width=200&text=Twists+Senegalesas+Finas",
      },
    ],
    portfolioImages: [
      "/placeholder.svg?height=300&width=400&text=Portfolio+1",
      "/placeholder.svg?height=300&width=400&text=Portfolio+2",
      "/placeholder.svg?height=300&width=400&text=Portfolio+1-1",
      "/placeholder.svg?height=300&width=400&text=Portfolio+1-2",
    ],
    status: "approved", // Definir status
  },
  {
    id: "braider-2",
    name: "Bia Cachos & Tranças",
    bio: "Apaixonada por cabelos crespos e cacheados, especialista em Crochet Braids e Nagô. Crio estilos que realçam sua beleza natural.",
    location: "Porto, Portugal",
    contactEmail: "bia.trancista@example.com",
    contactPhone: "(351) 93456-7890",
    profileImageUrl: "/placeholder.svg?height=200&width=200&text=Bia+Trancista",
    services: [
      {
        id: "s3",
        name: "Crochet Braids Volumosas",
        price: 280.0,
        durationMinutes: 180,
        description: "Cachos volumosos e naturais com técnica de crochet.",
        imageUrl: "/placeholder.svg?height=150&width=200&text=Crochet+Braids+Volumosas",
      },
      {
        id: "s4",
        name: "Trança Nagô Lateral",
        price: 150.0,
        durationMinutes: 120,
        description: "Penteado nagô moderno com detalhes laterais.",
        imageUrl: "/placeholder.svg?height=150&width=200&text=Tranca+Nago+Lateral",
      },
    ],
    portfolioImages: [
      "/placeholder.svg?height=300&width=400&text=Portfolio+3",
      "/placeholder.svg?height=300&width=400&text=Portfolio+4",
      "/placeholder.svg?height=300&width=400&text=Portfolio+3-1",
      "/placeholder.svg?height=300&width=400&text=Portfolio+3-2",
    ],
    status: "approved", // Definir status
  },
  {
    id: "braider-3",
    name: "Carla Estilos",
    bio: "Nova trancista na área, especializada em tranças infantis e penteados com extensão. Buscando expandir minha clientela!",
    location: "Faro, Portugal",
    contactEmail: "carla.estilos@example.com",
    contactPhone: "(351) 91122-3344",
    profileImageUrl: "/placeholder.svg?height=200&width=200&text=Carla+Estilos",
    services: [
      {
        id: "s5",
        name: "Tranças Infantis",
        price: 80.0,
        durationMinutes: 90,
        description: "Tranças divertidas e seguras para crianças.",
        imageUrl: "/placeholder.svg?height=150&width=200&text=Trancas+Infantis",
      },
    ],
    portfolioImages: ["/placeholder.svg?height=300&width=400&text=Portfolio+5"],
    status: "pending", // Status pendente para aprovação
  },
  {
    id: "mock-1",
    name: "Maria Silva",
    bio: "Especialista em tranças africanas com mais de 10 anos de experiência.",
    location: "São Paulo, SP",
    contactEmail: "maria@example.com",
    contactPhone: "(11) 99999-1234",
    profileImageUrl: "/placeholder.svg?height=200&width=200&text=Maria",
    services: [
      {
        id: "s6",
        name: "Box Braids Clássicas",
        price: 250.0,
        durationMinutes: 240,
        description: "Box braids tradicionais com acabamento profissional.",
        imageUrl: "/placeholder.svg?height=150&width=200&text=Box+Braids+Classicas",
      },
      {
        id: "s7",
        name: "Tranças Africanas Tradicionais",
        price: 180.0,
        durationMinutes: 180,
        description: "Penteados tradicionais africanos com técnicas ancestrais.",
        imageUrl: "/placeholder.svg?height=150&width=200&text=Trancas+Africanas",
      },
    ],
    portfolioImages: ["/placeholder.svg?height=300&width=300&text=Portfolio1"],
    status: "approved",
  },
  {
    id: "mock-2",
    name: "Ana Costa",
    bio: "Trancista profissional especializada em box braids e twist braids.",
    location: "Rio de Janeiro, RJ",
    contactEmail: "ana@example.com",
    contactPhone: "(21) 99999-5678",
    profileImageUrl: "/placeholder.svg?height=200&width=200&text=Ana",
    services: [
      {
        id: "s8",
        name: "Box Braids Médias",
        price: 280.0,
        durationMinutes: 210,
        description: "Box braids de tamanho médio para um visual equilibrado.",
        imageUrl: "/placeholder.svg?height=150&width=200&text=Box+Braids+Medias",
      },
      {
        id: "s9",
        name: "Twist Braids Modernas",
        price: 320.0,
        durationMinutes: 240,
        description: "Twist braids com toque moderno e contemporâneo.",
        imageUrl: "/placeholder.svg?height=150&width=200&text=Twist+Braids",
      },
    ],
    portfolioImages: ["/placeholder.svg?height=300&width=300&text=Portfolio2"],
    status: "approved",
  },
  {
    id: "mock-3",
    name: "Joana Santos",
    bio: "Especialista em protective styles e tranças Nagô, com técnicas ancestrais.",
    location: "Salvador, BA",
    contactEmail: "joana@example.com",
    contactPhone: "(71) 99999-9012",
    profileImageUrl: "/placeholder.svg?height=200&width=200&text=Joana",
    services: [
      {
        id: "s10",
        name: "Tranças Nagô Tradicionais",
        price: 200.0,
        durationMinutes: 180,
        description: "Tranças nagô com técnicas tradicionais da Bahia.",
        imageUrl: "/placeholder.svg?height=150&width=200&text=Trancas+Nago",
      },
      {
        id: "s11",
        name: "Protective Styles",
        price: 350.0,
        durationMinutes: 300,
        description: "Penteados protetivos para cuidar dos seus cabelos.",
        imageUrl: "/placeholder.svg?height=150&width=200&text=Protective+Styles",
      },
    ],
    portfolioImages: ["/placeholder.svg?height=300&width=300&text=Portfolio3"],
    status: "approved",
  },
  {
    id: "mock-4",
    name: "Camila Oliveira",
    bio: "Criadora de estilos únicos com foco em fulani braids e cornrows artísticas.",
    location: "Brasília, DF",
    contactEmail: "camila@example.com",
    contactPhone: "(61) 99999-3456",
    profileImageUrl: "/placeholder.svg?height=200&width=200&text=Camila",
    services: [
      {
        id: "s12",
        name: "Fulani Braids Elegantes",
        price: 380.0,
        durationMinutes: 270,
        description: "Fulani braids com decorações e estilo elegante.",
        imageUrl: "/placeholder.svg?height=150&width=200&text=Fulani+Braids",
      },
      {
        id: "s13",
        name: "Cornrows Artísticas",
        price: 220.0,
        durationMinutes: 150,
        description: "Cornrows com padrões artísticos únicos e criativos.",
        imageUrl: "/placeholder.svg?height=150&width=200&text=Cornrows+Artisticas",
      },
    ],
    portfolioImages: ["/placeholder.svg?height=300&width=300&text=Portfolio4"],
    status: "approved",
  },
]

// Simulated database for bookings
const dummyBookings: Booking[] = [
  {
    id: "booking-1",
    braiderId: "braider-1",
    serviceId: "s1",
    clientName: "Maria Silva",
    clientEmail: "maria.s@example.com",
    clientPhone: "(351) 96123-4567",
    clientAddress: "Rua da Liberdade, 10, Lisboa", // Exemplo de endereço
    date: "2025-08-01",
    time: "10:00",
    bookingType: "trancista",
    status: "Confirmado",
    createdAt: "2025-07-20T10:00:00Z",
  },
  {
    id: "booking-2",
    braiderId: "braider-1",
    serviceId: "s2",
    clientName: "Joana Santos",
    clientEmail: "joana.s@example.com",
    clientPhone: "(351) 92345-6789",
    clientAddress: "Avenida dos Aliados, 25, Porto", // Exemplo de endereço
    date: "2025-08-05",
    time: "14:30",
    bookingType: "domicilio",
    status: "Pendente",
    createdAt: "2025-07-21T11:30:00Z",
  },
  {
    id: "booking-3",
    braiderId: "braider-2",
    serviceId: "s3",
    clientName: "Carla Pereira",
    clientEmail: "carla.p@example.com",
    clientPhone: "(351) 98765-4321",
    clientAddress: undefined, // Não aplicável para agendamento na casa da trancista
    date: "2025-08-02",
    time: "09:00",
    bookingType: "trancista",
    status: "Confirmado",
    createdAt: "2025-07-20T15:00:00Z",
  },
]

// NOVO: Simulated database for braider availabilities
const dummyAvailabilities: BraiderAvailability[] = [
  // Braider-1 (Ana Trancista) - Next 30 days
  // July 2025
  { id: "avail-1", braiderId: "braider-1", date: "2025-07-24", startTime: "09:00", endTime: "12:00", isBooked: false },
  { id: "avail-2", braiderId: "braider-1", date: "2025-07-24", startTime: "14:00", endTime: "17:00", isBooked: true },
  { id: "avail-3", braiderId: "braider-1", date: "2025-07-25", startTime: "09:00", endTime: "12:00", isBooked: true },
  { id: "avail-4", braiderId: "braider-1", date: "2025-07-25", startTime: "18:00", endTime: "21:00", isBooked: false },
  { id: "avail-5", braiderId: "braider-1", date: "2025-07-26", startTime: "10:00", endTime: "13:00", isBooked: false },
  { id: "avail-6", braiderId: "braider-1", date: "2025-07-28", startTime: "09:00", endTime: "12:00", isBooked: false },
  { id: "avail-7", braiderId: "braider-1", date: "2025-07-28", startTime: "14:00", endTime: "17:00", isBooked: false },
  { id: "avail-8", braiderId: "braider-1", date: "2025-07-29", startTime: "18:00", endTime: "21:00", isBooked: true },
  { id: "avail-9", braiderId: "braider-1", date: "2025-07-30", startTime: "09:00", endTime: "12:00", isBooked: false },
  { id: "avail-10", braiderId: "braider-1", date: "2025-07-31", startTime: "14:00", endTime: "17:00", isBooked: true },
  
  // August 2025
  { id: "avail-11", braiderId: "braider-1", date: "2025-08-01", startTime: "09:00", endTime: "12:00", isBooked: true },
  { id: "avail-12", braiderId: "braider-1", date: "2025-08-01", startTime: "13:00", endTime: "17:00", isBooked: false },
  { id: "avail-13", braiderId: "braider-1", date: "2025-08-02", startTime: "10:00", endTime: "13:00", isBooked: false },
  { id: "avail-14", braiderId: "braider-1", date: "2025-08-04", startTime: "09:00", endTime: "12:00", isBooked: true },
  { id: "avail-15", braiderId: "braider-1", date: "2025-08-05", startTime: "14:00", endTime: "18:00", isBooked: true },
  { id: "avail-16", braiderId: "braider-1", date: "2025-08-06", startTime: "18:00", endTime: "21:00", isBooked: false },
  { id: "avail-17", braiderId: "braider-1", date: "2025-08-07", startTime: "09:00", endTime: "12:00", isBooked: false },
  { id: "avail-18", braiderId: "braider-1", date: "2025-08-08", startTime: "14:00", endTime: "17:00", isBooked: true },
  { id: "avail-19", braiderId: "braider-1", date: "2025-08-11", startTime: "09:00", endTime: "12:00", isBooked: false },
  { id: "avail-20", braiderId: "braider-1", date: "2025-08-12", startTime: "14:00", endTime: "17:00", isBooked: false },
  { id: "avail-21", braiderId: "braider-1", date: "2025-08-14", startTime: "18:00", endTime: "21:00", isBooked: true },
  { id: "avail-22", braiderId: "braider-1", date: "2025-08-15", startTime: "09:00", endTime: "12:00", isBooked: false },
  { id: "avail-23", braiderId: "braider-1", date: "2025-08-18", startTime: "14:00", endTime: "17:00", isBooked: false },
  { id: "avail-24", braiderId: "braider-1", date: "2025-08-19", startTime: "09:00", endTime: "12:00", isBooked: true },
  { id: "avail-25", braiderId: "braider-1", date: "2025-08-21", startTime: "18:00", endTime: "21:00", isBooked: false },
  { id: "avail-26", braiderId: "braider-1", date: "2025-08-22", startTime: "10:00", endTime: "13:00", isBooked: false },

  // Braider-2 (Bia Cachos & Tranças) - Next 30 days
  // July 2025
  { id: "avail-27", braiderId: "braider-2", date: "2025-07-24", startTime: "10:00", endTime: "13:00", isBooked: true },
  { id: "avail-28", braiderId: "braider-2", date: "2025-07-24", startTime: "15:00", endTime: "18:00", isBooked: false },
  { id: "avail-29", braiderId: "braider-2", date: "2025-07-25", startTime: "09:00", endTime: "12:00", isBooked: false },
  { id: "avail-30", braiderId: "braider-2", date: "2025-07-26", startTime: "14:00", endTime: "17:00", isBooked: true },
  { id: "avail-31", braiderId: "braider-2", date: "2025-07-26", startTime: "18:00", endTime: "21:00", isBooked: false },
  { id: "avail-32", braiderId: "braider-2", date: "2025-07-28", startTime: "10:00", endTime: "13:00", isBooked: false },
  { id: "avail-33", braiderId: "braider-2", date: "2025-07-29", startTime: "09:00", endTime: "12:00", isBooked: true },
  { id: "avail-34", braiderId: "braider-2", date: "2025-07-30", startTime: "14:00", endTime: "17:00", isBooked: false },
  { id: "avail-35", braiderId: "braider-2", date: "2025-07-31", startTime: "18:00", endTime: "21:00", isBooked: true },
  
  // August 2025
  { id: "avail-36", braiderId: "braider-2", date: "2025-08-01", startTime: "10:00", endTime: "13:00", isBooked: false },
  { id: "avail-37", braiderId: "braider-2", date: "2025-08-02", startTime: "09:00", endTime: "13:00", isBooked: true },
  { id: "avail-38", braiderId: "braider-2", date: "2025-08-03", startTime: "10:00", endTime: "16:00", isBooked: false },
  { id: "avail-39", braiderId: "braider-2", date: "2025-08-04", startTime: "14:00", endTime: "17:00", isBooked: false },
  { id: "avail-40", braiderId: "braider-2", date: "2025-08-05", startTime: "09:00", endTime: "12:00", isBooked: true },
  { id: "avail-41", braiderId: "braider-2", date: "2025-08-06", startTime: "15:00", endTime: "18:00", isBooked: false },
  { id: "avail-42", braiderId: "braider-2", date: "2025-08-07", startTime: "18:00", endTime: "21:00", isBooked: true },
  { id: "avail-43", braiderId: "braider-2", date: "2025-08-08", startTime: "10:00", endTime: "13:00", isBooked: false },
  { id: "avail-44", braiderId: "braider-2", date: "2025-08-11", startTime: "14:00", endTime: "17:00", isBooked: false },
  { id: "avail-45", braiderId: "braider-2", date: "2025-08-12", startTime: "09:00", endTime: "12:00", isBooked: true },
  { id: "avail-46", braiderId: "braider-2", date: "2025-08-13", startTime: "15:00", endTime: "18:00", isBooked: false },
  { id: "avail-47", braiderId: "braider-2", date: "2025-08-14", startTime: "10:00", endTime: "13:00", isBooked: true },
  { id: "avail-48", braiderId: "braider-2", date: "2025-08-15", startTime: "18:00", endTime: "21:00", isBooked: false },
  { id: "avail-49", braiderId: "braider-2", date: "2025-08-18", startTime: "09:00", endTime: "12:00", isBooked: false },
  { id: "avail-50", braiderId: "braider-2", date: "2025-08-19", startTime: "14:00", endTime: "17:00", isBooked: true },
  { id: "avail-51", braiderId: "braider-2", date: "2025-08-21", startTime: "10:00", endTime: "13:00", isBooked: false },
  { id: "avail-52", braiderId: "braider-2", date: "2025-08-22", startTime: "15:00", endTime: "18:00", isBooked: false },

  // Braider-3 (Carla Estilos) - Next 30 days
  // July 2025
  { id: "avail-53", braiderId: "braider-3", date: "2025-07-24", startTime: "09:00", endTime: "12:00", isBooked: false },
  { id: "avail-54", braiderId: "braider-3", date: "2025-07-25", startTime: "14:00", endTime: "17:00", isBooked: true },
  { id: "avail-55", braiderId: "braider-3", date: "2025-07-26", startTime: "10:00", endTime: "13:00", isBooked: false },
  { id: "avail-56", braiderId: "braider-3", date: "2025-07-28", startTime: "15:00", endTime: "18:00", isBooked: false },
  { id: "avail-57", braiderId: "braider-3", date: "2025-07-29", startTime: "09:00", endTime: "12:00", isBooked: true },
  { id: "avail-58", braiderId: "braider-3", date: "2025-07-30", startTime: "14:00", endTime: "17:00", isBooked: false },
  { id: "avail-59", braiderId: "braider-3", date: "2025-07-31", startTime: "10:00", endTime: "13:00", isBooked: false },
  
  // August 2025
  { id: "avail-60", braiderId: "braider-3", date: "2025-08-01", startTime: "09:00", endTime: "12:00", isBooked: true },
  { id: "avail-61", braiderId: "braider-3", date: "2025-08-02", startTime: "15:00", endTime: "18:00", isBooked: false },
  { id: "avail-62", braiderId: "braider-3", date: "2025-08-04", startTime: "10:00", endTime: "13:00", isBooked: false },
  { id: "avail-63", braiderId: "braider-3", date: "2025-08-05", startTime: "14:00", endTime: "17:00", isBooked: true },
  { id: "avail-64", braiderId: "braider-3", date: "2025-08-06", startTime: "09:00", endTime: "12:00", isBooked: false },
  { id: "avail-65", braiderId: "braider-3", date: "2025-08-07", startTime: "15:00", endTime: "18:00", isBooked: false },
  { id: "avail-66", braiderId: "braider-3", date: "2025-08-08", startTime: "10:00", endTime: "13:00", isBooked: true },
  { id: "avail-67", braiderId: "braider-3", date: "2025-08-11", startTime: "14:00", endTime: "17:00", isBooked: false },
  { id: "avail-68", braiderId: "braider-3", date: "2025-08-12", startTime: "09:00", endTime: "12:00", isBooked: false },
  { id: "avail-69", braiderId: "braider-3", date: "2025-08-13", startTime: "15:00", endTime: "18:00", isBooked: true },
  { id: "avail-70", braiderId: "braider-3", date: "2025-08-14", startTime: "10:00", endTime: "13:00", isBooked: false },
  { id: "avail-71", braiderId: "braider-3", date: "2025-08-15", startTime: "14:00", endTime: "17:00", isBooked: false },
  { id: "avail-72", braiderId: "braider-3", date: "2025-08-18", startTime: "09:00", endTime: "12:00", isBooked: true },
  { id: "avail-73", braiderId: "braider-3", date: "2025-08-19", startTime: "15:00", endTime: "18:00", isBooked: false },
  { id: "avail-74", braiderId: "braider-3", date: "2025-08-21", startTime: "10:00", endTime: "13:00", isBooked: false },
  { id: "avail-75", braiderId: "braider-3", date: "2025-08-22", startTime: "14:00", endTime: "17:00", isBooked: true },

  // Mock-1 (Maria Silva) - Next 30 days
  // July 2025
  { id: "avail-76", braiderId: "mock-1", date: "2025-07-24", startTime: "08:00", endTime: "11:00", isBooked: false },
  { id: "avail-77", braiderId: "mock-1", date: "2025-07-24", startTime: "13:00", endTime: "16:00", isBooked: true },
  { id: "avail-78", braiderId: "mock-1", date: "2025-07-25", startTime: "09:00", endTime: "12:00", isBooked: false },
  { id: "avail-79", braiderId: "mock-1", date: "2025-07-25", startTime: "17:00", endTime: "20:00", isBooked: true },
  { id: "avail-80", braiderId: "mock-1", date: "2025-07-26", startTime: "10:00", endTime: "13:00", isBooked: false },
  { id: "avail-81", braiderId: "mock-1", date: "2025-07-28", startTime: "08:00", endTime: "11:00", isBooked: true },
  { id: "avail-82", braiderId: "mock-1", date: "2025-07-28", startTime: "14:00", endTime: "17:00", isBooked: false },
  { id: "avail-83", braiderId: "mock-1", date: "2025-07-29", startTime: "18:00", endTime: "21:00", isBooked: false },
  { id: "avail-84", braiderId: "mock-1", date: "2025-07-30", startTime: "09:00", endTime: "12:00", isBooked: true },
  { id: "avail-85", braiderId: "mock-1", date: "2025-07-31", startTime: "13:00", endTime: "16:00", isBooked: false },
  
  // August 2025
  { id: "avail-86", braiderId: "mock-1", date: "2025-08-01", startTime: "08:00", endTime: "11:00", isBooked: false },
  { id: "avail-87", braiderId: "mock-1", date: "2025-08-01", startTime: "14:00", endTime: "17:00", isBooked: true },
  { id: "avail-88", braiderId: "mock-1", date: "2025-08-02", startTime: "10:00", endTime: "13:00", isBooked: false },
  { id: "avail-89", braiderId: "mock-1", date: "2025-08-04", startTime: "09:00", endTime: "12:00", isBooked: false },
  { id: "avail-90", braiderId: "mock-1", date: "2025-08-05", startTime: "15:00", endTime: "18:00", isBooked: true },
  { id: "avail-91", braiderId: "mock-1", date: "2025-08-06", startTime: "17:00", endTime: "20:00", isBooked: false },
  { id: "avail-92", braiderId: "mock-1", date: "2025-08-07", startTime: "08:00", endTime: "11:00", isBooked: true },
  { id: "avail-93", braiderId: "mock-1", date: "2025-08-08", startTime: "13:00", endTime: "16:00", isBooked: false },
  { id: "avail-94", braiderId: "mock-1", date: "2025-08-11", startTime: "09:00", endTime: "12:00", isBooked: false },
  { id: "avail-95", braiderId: "mock-1", date: "2025-08-12", startTime: "14:00", endTime: "17:00", isBooked: true },
  { id: "avail-96", braiderId: "mock-1", date: "2025-08-13", startTime: "18:00", endTime: "21:00", isBooked: false },
  { id: "avail-97", braiderId: "mock-1", date: "2025-08-14", startTime: "10:00", endTime: "13:00", isBooked: false },
  { id: "avail-98", braiderId: "mock-1", date: "2025-08-15", startTime: "15:00", endTime: "18:00", isBooked: true },
  { id: "avail-99", braiderId: "mock-1", date: "2025-08-18", startTime: "08:00", endTime: "11:00", isBooked: false },
  { id: "avail-100", braiderId: "mock-1", date: "2025-08-19", startTime: "13:00", endTime: "16:00", isBooked: false },
  { id: "avail-101", braiderId: "mock-1", date: "2025-08-21", startTime: "17:00", endTime: "20:00", isBooked: true },
  { id: "avail-102", braiderId: "mock-1", date: "2025-08-22", startTime: "09:00", endTime: "12:00", isBooked: false },

  // Mock-2 (Ana Costa) - Next 30 days  
  // July 2025
  { id: "avail-103", braiderId: "mock-2", date: "2025-07-24", startTime: "09:00", endTime: "12:00", isBooked: true },
  { id: "avail-104", braiderId: "mock-2", date: "2025-07-24", startTime: "14:00", endTime: "17:00", isBooked: false },
  { id: "avail-105", braiderId: "mock-2", date: "2025-07-25", startTime: "10:00", endTime: "13:00", isBooked: false },
  { id: "avail-106", braiderId: "mock-2", date: "2025-07-25", startTime: "18:00", endTime: "21:00", isBooked: true },
  { id: "avail-107", braiderId: "mock-2", date: "2025-07-26", startTime: "08:00", endTime: "11:00", isBooked: false },
  { id: "avail-108", braiderId: "mock-2", date: "2025-07-28", startTime: "15:00", endTime: "18:00", isBooked: false },
  { id: "avail-109", braiderId: "mock-2", date: "2025-07-29", startTime: "09:00", endTime: "12:00", isBooked: true },
  { id: "avail-110", braiderId: "mock-2", date: "2025-07-30", startTime: "13:00", endTime: "16:00", isBooked: false },
  { id: "avail-111", braiderId: "mock-2", date: "2025-07-31", startTime: "17:00", endTime: "20:00", isBooked: true },
  
  // August 2025
  { id: "avail-112", braiderId: "mock-2", date: "2025-08-01", startTime: "10:00", endTime: "13:00", isBooked: false },
  { id: "avail-113", braiderId: "mock-2", date: "2025-08-02", startTime: "09:00", endTime: "12:00", isBooked: true },
  { id: "avail-114", braiderId: "mock-2", date: "2025-08-02", startTime: "14:00", endTime: "17:00", isBooked: false },
  { id: "avail-115", braiderId: "mock-2", date: "2025-08-04", startTime: "18:00", endTime: "21:00", isBooked: false },
  { id: "avail-116", braiderId: "mock-2", date: "2025-08-05", startTime: "08:00", endTime: "11:00", isBooked: true },
  { id: "avail-117", braiderId: "mock-2", date: "2025-08-06", startTime: "15:00", endTime: "18:00", isBooked: false },
  { id: "avail-118", braiderId: "mock-2", date: "2025-08-07", startTime: "10:00", endTime: "13:00", isBooked: false },
  { id: "avail-119", braiderId: "mock-2", date: "2025-08-08", startTime: "17:00", endTime: "20:00", isBooked: true },
  { id: "avail-120", braiderId: "mock-2", date: "2025-08-11", startTime: "09:00", endTime: "12:00", isBooked: false },
  { id: "avail-121", braiderId: "mock-2", date: "2025-08-12", startTime: "13:00", endTime: "16:00", isBooked: true },
  { id: "avail-122", braiderId: "mock-2", date: "2025-08-13", startTime: "18:00", endTime: "21:00", isBooked: false },
  { id: "avail-123", braiderId: "mock-2", date: "2025-08-14", startTime: "08:00", endTime: "11:00", isBooked: false },
  { id: "avail-124", braiderId: "mock-2", date: "2025-08-15", startTime: "14:00", endTime: "17:00", isBooked: true },
  { id: "avail-125", braiderId: "mock-2", date: "2025-08-18", startTime: "10:00", endTime: "13:00", isBooked: false },
  { id: "avail-126", braiderId: "mock-2", date: "2025-08-19", startTime: "15:00", endTime: "18:00", isBooked: false },
  { id: "avail-127", braiderId: "mock-2", date: "2025-08-21", startTime: "09:00", endTime: "12:00", isBooked: true },
  { id: "avail-128", braiderId: "mock-2", date: "2025-08-22", startTime: "17:00", endTime: "20:00", isBooked: false },

  // Mock-3 (Joana Santos) - Next 30 days
  // July 2025
  { id: "avail-129", braiderId: "mock-3", date: "2025-07-24", startTime: "10:00", endTime: "13:00", isBooked: false },
  { id: "avail-130", braiderId: "mock-3", date: "2025-07-24", startTime: "15:00", endTime: "18:00", isBooked: true },
  { id: "avail-131", braiderId: "mock-3", date: "2025-07-25", startTime: "08:00", endTime: "11:00", isBooked: false },
  { id: "avail-132", braiderId: "mock-3", date: "2025-07-26", startTime: "14:00", endTime: "17:00", isBooked: false },
  { id: "avail-133", braiderId: "mock-3", date: "2025-07-26", startTime: "18:00", endTime: "21:00", isBooked: true },
  { id: "avail-134", braiderId: "mock-3", date: "2025-07-28", startTime: "09:00", endTime: "12:00", isBooked: false },
  { id: "avail-135", braiderId: "mock-3", date: "2025-07-29", startTime: "13:00", endTime: "16:00", isBooked: true },
  { id: "avail-136", braiderId: "mock-3", date: "2025-07-30", startTime: "10:00", endTime: "13:00", isBooked: false },
  { id: "avail-137", braiderId: "mock-3", date: "2025-07-31", startTime: "15:00", endTime: "18:00", isBooked: false },
  
  // August 2025
  { id: "avail-138", braiderId: "mock-3", date: "2025-08-01", startTime: "09:00", endTime: "12:00", isBooked: true },
  { id: "avail-139", braiderId: "mock-3", date: "2025-08-02", startTime: "14:00", endTime: "17:00", isBooked: false },
  { id: "avail-140", braiderId: "mock-3", date: "2025-08-04", startTime: "10:00", endTime: "13:00", isBooked: false },
  { id: "avail-141", braiderId: "mock-3", date: "2025-08-05", startTime: "16:00", endTime: "19:00", isBooked: true },
  { id: "avail-142", braiderId: "mock-3", date: "2025-08-06", startTime: "08:00", endTime: "11:00", isBooked: false },
  { id: "avail-143", braiderId: "mock-3", date: "2025-08-07", startTime: "13:00", endTime: "16:00", isBooked: false },
  { id: "avail-144", braiderId: "mock-3", date: "2025-08-08", startTime: "18:00", endTime: "21:00", isBooked: true },
  { id: "avail-145", braiderId: "mock-3", date: "2025-08-11", startTime: "10:00", endTime: "13:00", isBooked: false },
  { id: "avail-146", braiderId: "mock-3", date: "2025-08-12", startTime: "15:00", endTime: "18:00", isBooked: false },
  { id: "avail-147", braiderId: "mock-3", date: "2025-08-13", startTime: "09:00", endTime: "12:00", isBooked: true },
  { id: "avail-148", braiderId: "mock-3", date: "2025-08-14", startTime: "14:00", endTime: "17:00", isBooked: false },
  { id: "avail-149", braiderId: "mock-3", date: "2025-08-15", startTime: "17:00", endTime: "20:00", isBooked: true },
  { id: "avail-150", braiderId: "mock-3", date: "2025-08-18", startTime: "08:00", endTime: "11:00", isBooked: false },
  { id: "avail-151", braiderId: "mock-3", date: "2025-08-19", startTime: "13:00", endTime: "16:00", isBooked: false },
  { id: "avail-152", braiderId: "mock-3", date: "2025-08-21", startTime: "10:00", endTime: "13:00", isBooked: true },
  { id: "avail-153", braiderId: "mock-3", date: "2025-08-22", startTime: "15:00", endTime: "18:00", isBooked: false },

  // Mock-4 (Camila Oliveira) - Next 30 days
  // July 2025
  { id: "avail-154", braiderId: "mock-4", date: "2025-07-24", startTime: "09:00", endTime: "12:00", isBooked: false },
  { id: "avail-155", braiderId: "mock-4", date: "2025-07-24", startTime: "14:00", endTime: "17:00", isBooked: true },
  { id: "avail-156", braiderId: "mock-4", date: "2025-07-25", startTime: "10:00", endTime: "13:00", isBooked: false },
  { id: "avail-157", braiderId: "mock-4", date: "2025-07-25", startTime: "18:00", endTime: "21:00", isBooked: false },
  { id: "avail-158", braiderId: "mock-4", date: "2025-07-26", startTime: "08:00", endTime: "11:00", isBooked: true },
  { id: "avail-159", braiderId: "mock-4", date: "2025-07-28", startTime: "15:00", endTime: "18:00", isBooked: false },
  { id: "avail-160", braiderId: "mock-4", date: "2025-07-29", startTime: "09:00", endTime: "12:00", isBooked: false },
  { id: "avail-161", braiderId: "mock-4", date: "2025-07-30", startTime: "13:00", endTime: "16:00", isBooked: true },
  { id: "avail-162", braiderId: "mock-4", date: "2025-07-31", startTime: "17:00", endTime: "20:00", isBooked: false },
  
  // August 2025
  { id: "avail-163", braiderId: "mock-4", date: "2025-08-01", startTime: "10:00", endTime: "13:00", isBooked: false },
  { id: "avail-164", braiderId: "mock-4", date: "2025-08-02", startTime: "14:00", endTime: "17:00", isBooked: true },
  { id: "avail-165", braiderId: "mock-4", date: "2025-08-04", startTime: "09:00", endTime: "12:00", isBooked: false },
  { id: "avail-166", braiderId: "mock-4", date: "2025-08-05", startTime: "18:00", endTime: "21:00", isBooked: false },
  { id: "avail-167", braiderId: "mock-4", date: "2025-08-06", startTime: "08:00", endTime: "11:00", isBooked: true },
  { id: "avail-168", braiderId: "mock-4", date: "2025-08-07", startTime: "15:00", endTime: "18:00", isBooked: false },
  { id: "avail-169", braiderId: "mock-4", date: "2025-08-08", startTime: "10:00", endTime: "13:00", isBooked: false },
  { id: "avail-170", braiderId: "mock-4", date: "2025-08-11", startTime: "17:00", endTime: "20:00", isBooked: true },
  { id: "avail-171", braiderId: "mock-4", date: "2025-08-12", startTime: "09:00", endTime: "12:00", isBooked: false },
  { id: "avail-172", braiderId: "mock-4", date: "2025-08-13", startTime: "13:00", endTime: "16:00", isBooked: false },
  { id: "avail-173", braiderId: "mock-4", date: "2025-08-14", startTime: "18:00", endTime: "21:00", isBooked: true },
  { id: "avail-174", braiderId: "mock-4", date: "2025-08-15", startTime: "08:00", endTime: "11:00", isBooked: false },
  { id: "avail-175", braiderId: "mock-4", date: "2025-08-18", startTime: "14:00", endTime: "17:00", isBooked: false },
  { id: "avail-176", braiderId: "mock-4", date: "2025-08-19", startTime: "10:00", endTime: "13:00", isBooked: true },
  { id: "avail-177", braiderId: "mock-4", date: "2025-08-21", startTime: "15:00", endTime: "18:00", isBooked: false },
  { id: "avail-178", braiderId: "mock-4", date: "2025-08-22", startTime: "09:00", endTime: "12:00", isBooked: false },
]

export function getProductById(id: string): Product | undefined {
  return allProducts.find((product) => product.id === id)
}

export function getFeaturedProducts(): Product[] {
  return allProducts.slice(0, 4) // Return first 4 as featured
}

export function getBraiderById(id: string): Braider | undefined {
  return allBraiders.find((braider) => braider.id === id)
}

export function getFeaturedBraiders(): Braider[] {
  // Retorna apenas trancistas aprovadas como destaque
  return allBraiders.filter((braider) => braider.status === "approved").slice(0, 2)
}

export async function getAllBraiders(): Promise<Braider[]> {
  await new Promise((resolve) => setTimeout(resolve, 300)) // Simulate API delay
  return allBraiders
}

export async function addBooking(
  booking: Omit<Booking, "id" | "status" | "createdAt">,
  availabilityId?: string, // NOVO: ID do slot de disponibilidade
): Promise<{ success: boolean; message: string; booking?: Booking }> {
  await new Promise((resolve) => setTimeout(resolve, 700)) // Simulate API delay

  const newBooking: Booking = {
    ...booking,
    id: `booking-${Date.now()}`,
    status: "Pendente", // Default status
    createdAt: new Date().toISOString(),
  }
  dummyBookings.push(newBooking)
  console.log("New booking added:", newBooking)

  // NOVO: Marcar slot de disponibilidade como reservado
  if (availabilityId) {
    await updateBraiderAvailabilityStatus(availabilityId, true)
  }

  return { success: true, message: "Agendamento realizado com sucesso!", booking: newBooking }
}

export async function getBraiderBookings(braiderId: string): Promise<Booking[]> {
  await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API delay
  return dummyBookings.filter((booking) => booking.braiderId === braiderId)
}

export async function getUserBookings(clientEmail: string): Promise<Booking[]> {
  await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API delay
  return dummyBookings.filter((booking) => booking.clientEmail === clientEmail)
}

export async function updateBraiderProfile(
  braiderId: string,
  updates: Partial<Braider>,
): Promise<{ success: boolean; message: string; braider?: Braider }> {
  await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API delay

  const index = allBraiders.findIndex((b) => b.id === braiderId)
  if (index === -1) {
    return { success: false, message: "Trancista não encontrada." }
  }

  allBraiders[index] = { ...allBraiders[index], ...updates }
  return { success: true, message: "Perfil atualizado com sucesso!", braider: allBraiders[index] }
}

export async function addBraider(
  newBraiderData: Omit<Braider, "id" | "services" | "portfolioImages" | "status">,
): Promise<{ success: boolean; message: string; braider?: Braider }> {
  await new Promise((resolve) => setTimeout(resolve, 700)) // Simulate API delay

  // Verificar se já existe trancista com este email
  const existingBraider = allBraiders.find(b => b.contactEmail === newBraiderData.contactEmail)
  
  if (existingBraider && existingBraider.status !== "rejected") {
    return { 
      success: false, 
      message: "Já existe um cadastro de trancista com este email. Se você foi rejeitada anteriormente, pode tentar novamente." 
    }
  }

  // Se existe mas foi rejeitada, atualizar registro existente
  if (existingBraider && existingBraider.status === "rejected") {
    const updatedBraider: Braider = {
      ...existingBraider,
      ...newBraiderData,
      status: "pending", // Reset para pending
      services: existingBraider.services || [],
      portfolioImages: existingBraider.portfolioImages || [],
    }
    
    const index = allBraiders.findIndex(b => b.id === existingBraider.id)
    allBraiders[index] = updatedBraider
    
    console.log("Braider re-application:", updatedBraider)
    return { 
      success: true, 
      message: "Sua nova solicitação foi enviada para aprovação! Nossa equipe irá analisar em breve.", 
      braider: updatedBraider 
    }
  }

  // Criar novo registro
  const newBraider: Braider = {
    id: `braider-${Date.now()}`,
    ...newBraiderData,
    services: [], // Novas trancistas começam sem serviços cadastrados
    portfolioImages: [], // Novas trancistas começam sem portfólio
    status: "pending", // Status inicial pendente
  }
  
  allBraiders.push(newBraider)
  console.log("New braider registered:", newBraider)
  return { 
    success: true, 
    message: "Seu cadastro foi enviado para aprovação! Nossa equipe irá analisar em até 48 horas úteis.", 
    braider: newBraider 
  }
}

export async function updateBraiderStatus(
  braiderId: string,
  status: "pending" | "approved" | "rejected",
): Promise<{ success: boolean; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 300)) // Simulate API delay

  const index = allBraiders.findIndex((b) => b.id === braiderId)
  if (index === -1) {
    return { success: false, message: "Trancista não encontrada." }
  }

  allBraiders[index].status = status
  return { success: true, message: `Status da trancista ${allBraiders[index].name} atualizado para ${status}.` }
}

export async function updateBookingStatus(
  bookingId: string,
  newStatus: Booking["status"],
): Promise<{ success: boolean; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 300)) // Simulate API delay

  const index = dummyBookings.findIndex((b) => b.id === bookingId)
  if (index === -1) {
    return { success: false, message: "Agendamento não encontrado." }
  }

  dummyBookings[index].status = newStatus
  return { success: true, message: `Status do agendamento ${bookingId} atualizado para ${newStatus}.` }
}

// NOVO: Funções para gerenciar a disponibilidade da trancista
export async function addBraiderAvailability(
  availability: Omit<BraiderAvailability, "id" | "isBooked">,
): Promise<{ success: boolean; message: string; availability?: BraiderAvailability }> {
  await new Promise((resolve) => setTimeout(resolve, 300)) // Simulate API delay

  const newAvailability: BraiderAvailability = {
    ...availability,
    id: `avail-${Date.now()}`,
    isBooked: false,
  }
  dummyAvailabilities.push(newAvailability)
  console.log("New availability added:", newAvailability)
  return { success: true, message: "Disponibilidade adicionada com sucesso!", availability: newAvailability }
}

export async function getBraiderAvailabilities(
  braiderId: string,
  date?: string, // Opcional: filtrar por data
): Promise<BraiderAvailability[]> {
  await new Promise((resolve) => setTimeout(resolve, 300)) // Simulate API delay
  let filtered = dummyAvailabilities.filter((avail) => avail.braiderId === braiderId)
  if (date) {
    filtered = filtered.filter((avail) => avail.date === date)
  }
  // Ordenar por hora de início
  return filtered.sort((a, b) => a.startTime.localeCompare(b.startTime))
}

export async function updateBraiderAvailabilityStatus(
  availabilityId: string,
  isBooked: boolean,
): Promise<{ success: boolean; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 300)) // Simulate API delay

  const index = dummyAvailabilities.findIndex((avail) => avail.id === availabilityId)
  if (index === -1) {
    return { success: false, message: "Disponibilidade não encontrada." }
  }

  dummyAvailabilities[index].isBooked = isBooked
  return { success: true, message: `Status da disponibilidade ${availabilityId} atualizado para ${isBooked}.` }
}

export async function deleteBraiderAvailability(
  availabilityId: string,
): Promise<{ success: boolean; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 300)) // Simulate API delay

  const initialLength = dummyAvailabilities.length
  const updatedAvailabilities = dummyAvailabilities.filter((avail) => avail.id !== availabilityId)
  // Atualizar o array global (simulação)
  dummyAvailabilities.splice(0, dummyAvailabilities.length, ...updatedAvailabilities)

  if (dummyAvailabilities.length < initialLength) {
    return { success: true, message: "Disponibilidade removida com sucesso!" }
  } else {
    return { success: false, message: "Disponibilidade não encontrada." }
  }
}
