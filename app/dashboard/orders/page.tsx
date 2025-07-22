"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserOrders, type Order } from "@/lib/orders"
import Image from "next/image"
import { useAuth } from "@/context/auth-context"

export default function DashboardOrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      // For dashboard, we might want all orders, but for now, use the dummy user's orders
      const userOrders = await getUserOrders("user-1700000000000")
      setOrders(userOrders)
      setLoading(false)
    }
    if (user) {
      fetchOrders()
    }
  }, [user])

  if (loading) {
    return <p className="text-gray-700">Carregando pedidos...</p>
  }

  if (orders.length === 0) {
    return (
      <Card className="bg-white text-gray-900 p-6 text-center shadow-lg rounded-lg">
        <CardTitle className="text-xl mb-2 text-brand-primary">Nenhum pedido encontrado.</CardTitle>
        <CardDescription className="text-gray-700">Não há pedidos para exibir no momento.</CardDescription>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-brand-primary">Gerenciar Pedidos</h2>
      {orders.map((order) => (
        <Card key={order.id} className="bg-white text-gray-900 shadow-lg rounded-lg overflow-hidden">
          <CardHeader className="p-4 border-b border-gray-200">
            <CardTitle className="text-xl font-bold text-brand-primary">Pedido #{order.id.split("-")[1]}</CardTitle>
            <CardDescription className="text-gray-700">
              Data: {order.date} | Status: {order.status}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {order.items.map((item) => (
              <div key={item.productId} className="flex items-center gap-4">
                <Image
                  src={item.imageUrl || "/placeholder.svg"}
                  alt={item.name}
                  width={60}
                  height={60}
                  className="rounded-md object-cover"
                  unoptimized={true}
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-700">
                    {item.quantity} x €{item.price.toFixed(2)}
                  </p>
                </div>
                <p className="font-bold text-brand-accent">€{(item.quantity * item.price).toFixed(2)}</p>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 border-t border-gray-200 mt-4">
              <span className="text-lg font-bold">Total do Pedido:</span>
              <span className="text-2xl font-bold text-brand-accent">€{order.total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
