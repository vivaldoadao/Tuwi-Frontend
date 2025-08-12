"use client"

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  CreditCard,
  Download,
  Eye,
  Calendar,
  User,
  DollarSign,
  MapPin,
  Clock
} from "lucide-react"

interface CommissionTransaction {
  id: string
  bookingId: string
  customerName: string
  serviceName: string
  serviceDate: string
  serviceAmount: number
  commissionRate: number
  commissionAmount: number
  status: 'completed' | 'pending' | 'cancelled'
  paymentDate?: string
  location?: string
}

interface BraiderCommissionDetailsProps {
  braiderId: string
  braiderName: string
  isOpen: boolean
  onClose: () => void
}

// Mock data - in real app this would come from API
const mockTransactions: CommissionTransaction[] = [
  {
    id: '1',
    bookingId: 'BK001',
    customerName: 'Ana Silva',
    serviceName: 'Tranças Box Braids - Médio',
    serviceDate: '2024-08-05',
    serviceAmount: 85.00,
    commissionRate: 0.10,
    commissionAmount: 8.50,
    status: 'completed',
    paymentDate: '2024-08-07',
    location: 'Lisboa'
  },
  {
    id: '2',
    bookingId: 'BK002',
    customerName: 'Maria Santos',
    serviceName: 'Tranças Nagô - Grande',
    serviceDate: '2024-08-03',
    serviceAmount: 120.00,
    commissionRate: 0.10,
    commissionAmount: 12.00,
    status: 'completed',
    paymentDate: '2024-08-05',
    location: 'Porto'
  },
  {
    id: '3',
    bookingId: 'BK003',
    customerName: 'Joana Costa',
    serviceName: 'Tranças Kanekalon - Pequeno',
    serviceDate: '2024-08-01',
    serviceAmount: 65.00,
    commissionRate: 0.10,
    commissionAmount: 6.50,
    status: 'pending',
    location: 'Braga'
  }
]

export function BraiderCommissionDetails({ 
  braiderId, 
  braiderName, 
  isOpen, 
  onClose 
}: BraiderCommissionDetailsProps) {
  const [transactions] = useState<CommissionTransaction[]>(mockTransactions)
  const [selectedPeriod, setSelectedPeriod] = useState('current_month')

  const totalCommissions = transactions.reduce((sum, t) => sum + t.commissionAmount, 0)
  const completedTransactions = transactions.filter(t => t.status === 'completed')
  const pendingCommissions = transactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.commissionAmount, 0)

  const handleExportTransactions = () => {
    // Mock export functionality
    console.log('Exporting transactions for braider:', braiderId)
  }

  const handleProcessPayment = () => {
    // Mock payment processing
    console.log('Processing payment for braider:', braiderId)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Detalhes de Comissões - {braiderName}
          </DialogTitle>
          <DialogDescription>
            Histórico completo de transações e comissões da trancista
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de Comissões</p>
                    <p className="text-2xl font-bold text-green-600">€{totalCommissions.toFixed(2)}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Serviços Realizados</p>
                    <p className="text-2xl font-bold text-blue-600">{completedTransactions.length}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Aguardando Pagamento</p>
                    <p className="text-2xl font-bold text-orange-600">€{pendingCommissions.toFixed(2)}</p>
                  </div>
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Histórico de Transações</h3>
            <div className="flex gap-2">
              <Button onClick={handleExportTransactions} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              {pendingCommissions > 0 && (
                <Button onClick={handleProcessPayment} size="sm">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Processar Pagamento
                </Button>
              )}
            </div>
          </div>

          {/* Transactions Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agendamento</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Comissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pagamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        #{transaction.bookingId}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="font-medium">{transaction.customerName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium text-sm">{transaction.serviceName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(transaction.serviceDate).toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          {transaction.location}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        €{transaction.serviceAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        €{transaction.commissionAmount.toFixed(2)}
                        <div className="text-xs text-gray-500">
                          ({(transaction.commissionRate * 100).toFixed(1)}%)
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            transaction.status === 'completed' ? 'default' :
                            transaction.status === 'pending' ? 'secondary' : 'destructive'
                          }
                          className={
                            transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }
                        >
                          {transaction.status === 'completed' ? 'Concluído' : 
                           transaction.status === 'pending' ? 'Pendente' : 'Cancelado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transaction.paymentDate ? (
                          <div className="text-sm">
                            <div className="text-green-600 font-medium">Pago</div>
                            <div className="text-xs text-gray-500">
                              {new Date(transaction.paymentDate).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-orange-600 font-medium">
                            Aguardando
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

        </div>
      </DialogContent>
    </Dialog>
  )
}