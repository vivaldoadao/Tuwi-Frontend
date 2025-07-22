import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardSettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-brand-primary">Configurações do Dashboard</h2>
      <Card className="bg-white text-gray-900 shadow-lg rounded-lg p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-2xl font-bold text-brand-primary">Configurações Gerais</CardTitle>
          <CardDescription className="text-gray-700">Gerencie as configurações da sua loja.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <p className="text-lg text-gray-700">Esta é uma página de configurações de placeholder.</p>
          <p className="text-gray-600 mt-2">
            Você pode adicionar formulários e opções para gerenciar aspectos como informações da loja, métodos de
            pagamento, etc.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
