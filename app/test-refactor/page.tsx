// ===================================
// PÁGINA DE TESTE DA REFATORAÇÃO
// ===================================

"use client"

import { useState } from "react"
import { UsersTable } from "@/components/users-table"
import { UsersTableNew } from "@/components/users-table-new"
import { BraidersTable } from "@/components/braiders-table"
import { BraidersTableNew } from "@/components/braiders-table-new"
import { ProductsTable } from "@/components/products-table"
import { ProductsTableNew } from "@/components/products-table-new"
import { EditUserForm } from "@/components/edit-user-form"
import { EditUserFormNew } from "@/components/edit-user-form-new"
import { ProductForm } from "@/components/product-form"
import { ProductFormNew } from "@/components/product-form-new"
import ContactForm from "@/components/contact-form"
import { ContactFormNew } from "@/components/contact-form-new"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Code, Zap } from "lucide-react"

export default function TestRefactorPage() {
  const [activeVersion, setActiveVersion] = useState<'old' | 'new'>('new')
  const [activeComponent, setActiveComponent] = useState<'tables' | 'forms'>('tables')
  const [activeTable, setActiveTable] = useState<'users' | 'braiders' | 'products'>('users')
  const [activeForm, setActiveForm] = useState<'user-edit' | 'product' | 'contact'>('user-edit')

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">🔬 Teste de Refatoração</h1>
        <p className="text-lg text-gray-600">
          Comparação entre a versão antiga e nova da Users Table
        </p>
      </div>

      {/* Table Selector */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Seletor de Tabela e Versão
          </CardTitle>
          <CardDescription>
            Compare as implementações antigas (repetitivas) com as novas (genéricas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Table Type Selector */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={activeTable === 'users' ? 'default' : 'outline'}
              onClick={() => setActiveTable('users')}
              size="sm"
            >
              Usuários
            </Button>
            <Button
              variant={activeTable === 'braiders' ? 'default' : 'outline'}
              onClick={() => setActiveTable('braiders')}
              size="sm"
            >
              Trancistas
            </Button>
            <Button
              variant={activeTable === 'products' ? 'default' : 'outline'}
              onClick={() => setActiveTable('products')}
              size="sm"
            >
              Produtos
            </Button>
          </div>

          {/* Version Selector */}
          <div className="flex gap-4">
            <Button
              variant={activeVersion === 'old' ? 'default' : 'outline'}
              onClick={() => setActiveVersion('old')}
              className="flex-1"
            >
              <Code className="h-4 w-4 mr-2" />
              Versão Antiga
              <Badge variant="secondary" className="ml-2 bg-red-100 text-red-800">
                400+ linhas
              </Badge>
            </Button>
            <Button
              variant={activeVersion === 'new' ? 'default' : 'outline'}
              onClick={() => setActiveVersion('new')}
              className="flex-1"
            >
              <Zap className="h-4 w-4 mr-2" />
              Versão Nova
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                ~150 linhas
              </Badge>
            </Button>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-gray-900">Versão Antiga:</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Lógica repetitiva de paginação</li>
                  <li>• State management manual</li>
                  <li>• Código hard-coded para actions</li>
                  <li>• Sem reutilização</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Versão Nova:</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Hook genérico useTableData</li>
                  <li>• Componente DataTable reutilizável</li>
                  <li>• Configuração declarativa</li>
                  <li>• 75% menos código</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Display */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {activeVersion === 'old' ? 'Versão Antiga' : 'Versão Nova (Refatorada)'}
          </h2>
          <Badge 
            variant={activeVersion === 'old' ? 'destructive' : 'secondary'}
            className="text-lg px-4 py-2"
          >
            {activeVersion === 'old' ? 'Legado' : 'Refatorado'}
          </Badge>
        </div>

{(() => {
          const tableType = `${activeTable}-${activeVersion}`
          
          switch (tableType) {
            case 'users-old':
              return <UsersTable />
            case 'users-new':
              return <UsersTableNew />
            case 'braiders-old':
              return <BraidersTable />
            case 'braiders-new':
              return <BraidersTableNew />
            case 'products-old':
              return <ProductsTable />
            case 'products-new':
              return <ProductsTableNew />
            default:
              return <UsersTableNew />
          }
        })()}
      </div>

      {/* Stats */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>📊 Estatísticas da Refatoração</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">479</div>
              <div className="text-sm text-red-800">Linhas (Antiga)</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">~120</div>
              <div className="text-sm text-green-800">Linhas (Nova)</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">75%</div>
              <div className="text-sm text-blue-800">Redução</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">6</div>
              <div className="text-sm text-purple-800">Tabelas Total</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}