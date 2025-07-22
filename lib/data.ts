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
  status: "pending" | "approved" | "rejected" // Novo campo de status
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
  {
    id: "avail-1",
    braiderId: "braider-1",
    date: "2025-08-01",
    startTime: "09:00",
    endTime: "12:00",
    isBooked: true, // Já reservado pelo booking-1
  },
  {
    id: "avail-2",
    braiderId: "braider-1",
    date: "2025-08-01",
    startTime: "13:00",
    endTime: "17:00",
    isBooked: false,
  },
  {
    id: "avail-3",
    braiderId: "braider-1",
    date: "2025-08-05",
    startTime: "14:00",
    endTime: "18:00",
    isBooked: true, // Já reservado pelo booking-2
  },
  {
    id: "avail-4",
    braiderId: "braider-2",
    date: "2025-08-02",
    startTime: "09:00",
    endTime: "13:00",
    isBooked: true, // Já reservado pelo booking-3
  },
  {
    id: "avail-5",
    braiderId: "braider-2",
    date: "2025-08-03",
    startTime: "10:00",
    endTime: "16:00",
    isBooked: false,
  },
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

  const newBraider: Braider = {
    id: `braider-${Date.now()}`,
    ...newBraiderData,
    services: [], // Novas trancistas começam sem serviços cadastrados
    portfolioImages: [], // Novas trancistas começam sem portfólio
    status: "pending", // Status inicial pendente
  }
  allBraiders.push(newBraider)
  console.log("New braider registered:", newBraider)
  return { success: true, message: "Seu cadastro foi enviado para aprovação!", braider: newBraider }
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
