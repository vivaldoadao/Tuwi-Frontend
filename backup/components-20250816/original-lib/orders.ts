export type OrderItem = {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl: string
}

export type Order = {
  id: string
  userId: string
  date: string
  total: number
  status: "Pendente" | "Processando" | "Enviado" | "Entregue" | "Cancelado"
  items: OrderItem[]
}

// Simulate a database of orders
const dummyOrders: Order[] = [
  {
    id: "order-1",
    userId: "user-1700000000000", // Example user ID, replace with actual user ID from auth.ts if needed
    date: "2024-07-15",
    total: 300.0,
    status: "Entregue",
    items: [
      {
        productId: "1",
        name: "Trança Box Braids Clássica",
        price: 150.0,
        quantity: 1,
        imageUrl: "/placeholder.svg?height=100&width=100&text=Box+Braids",
      },
      {
        productId: "2",
        name: "Crochet Braids Onduladas",
        price: 180.0,
        quantity: 1,
        imageUrl: "/placeholder.svg?height=100&width=100&text=Crochet+Braids",
      },
    ],
  },
  {
    id: "order-2",
    userId: "user-1700000000000",
    date: "2024-07-20",
    total: 220.0,
    status: "Processando",
    items: [
      {
        productId: "3",
        name: "Twists Senegalesas Longas",
        price: 220.0,
        quantity: 1,
        imageUrl: "/placeholder.svg?height=100&width=100&text=Twists+Senegalesas",
      },
    ],
  },
  {
    id: "order-3",
    userId: "user-1700000000000",
    date: "2024-07-22",
    total: 500.0,
    status: "Pendente",
    items: [
      {
        productId: "4",
        name: "Faux Locs Leves",
        price: 250.0,
        quantity: 2,
        imageUrl: "/placeholder.svg?height=100&width=100&text=Faux+Locs",
      },
    ],
  },
]

export async function getUserOrders(userId: string): Promise<Order[]> {
  await new Promise((resolve) => setTimeout(resolve, 700)) // Simulate API delay
  return dummyOrders.filter((order) => order.userId === userId)
}
