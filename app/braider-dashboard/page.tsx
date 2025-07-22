import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarCheck, Users, DollarSign } from "lucide-react"

export default function BraiderDashboardOverviewPage() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="bg-white text-gray-900 shadow-lg rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-brand-primary">Total de Agendamentos</CardTitle>
          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">7</div> {/* Exemplo */}
          <p className="text-xs text-muted-foreground">+3 novos esta semana</p>
        </CardContent>
      </Card>
      <Card className="bg-white text-gray-900 shadow-lg rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-brand-primary">Clientes Atendidos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">5</div> {/* Exemplo */}
          <p className="text-xs text-muted-foreground">Novos clientes este mês</p>
        </CardContent>
      </Card>
      <Card className="bg-white text-gray-900 shadow-lg rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-brand-primary">Faturamento Estimado</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">€1500,00</div> {/* Exemplo */}
          <p className="text-xs text-muted-foreground">Baseado em agendamentos confirmados</p>
        </CardContent>
      </Card>
    </div>
  )
}
