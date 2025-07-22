import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, Users } from "lucide-react"

export default function DashboardOverviewPage() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="bg-white text-gray-900 shadow-lg rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-brand-primary">Total de Pedidos</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">125</div>
          <p className="text-xs text-muted-foreground">+20.1% do mês passado</p>
        </CardContent>
      </Card>
      <Card className="bg-white text-gray-900 shadow-lg rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-brand-primary">Produtos em Estoque</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">6</div>
          <p className="text-xs text-muted-foreground">Todos disponíveis</p>
        </CardContent>
      </Card>
      <Card className="bg-white text-gray-900 shadow-lg rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-brand-primary">Clientes Registrados</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">50</div>
          <p className="text-xs text-muted-foreground">+5 este mês</p>
        </CardContent>
      </Card>
    </div>
  )
}
