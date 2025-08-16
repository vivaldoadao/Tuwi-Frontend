// ===================================
// COMPONENTE DATATABLE GENÉRICO
// ===================================

"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal,
  ChevronUp,
  ChevronDown
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { useTableData } from "@/hooks/use-table-data-new"
import type { 
  DataTableItem, 
  TableColumn, 
  TableAction, 
  BulkAction 
} from "@/types/table"

interface DataTableProps<T extends DataTableItem> {
  // Required props
  fetchFunction: (page: number, limit: number, filters: any, sorting: any) => Promise<{ items: T[], total: number, hasMore: boolean }>
  columns: TableColumn<T>[]
  
  // Header props
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  totalLabel?: string
  
  // Actions props
  actions?: TableAction[]
  bulkActions?: BulkAction[]
  
  // Customization props
  enableSearch?: boolean
  searchPlaceholder?: string
  pageSize?: number
  pageSizeOptions?: number[]
  
  // Style props
  className?: string
  cardClassName?: string
  tableClassName?: string
  
  // Feature flags
  enableSelection?: boolean
  enableSorting?: boolean
  enableFiltering?: boolean
  enablePagination?: boolean
  
  // Callbacks
  onRowClick?: (item: T) => void
  onAction?: (action: string, item: T) => void
  onBulkAction?: (action: string, items: T[]) => void
  
  // Loading/Empty states
  loadingRows?: number
  emptyIcon?: React.ComponentType<{ className?: string }>
  emptyTitle?: string
  emptyDescription?: string
  
  // Dependencies for auto-refresh
  dependencies?: any[]
}

export function DataTable<T extends DataTableItem>({
  fetchFunction,
  columns,
  title,
  description,
  icon: Icon,
  totalLabel = "itens",
  actions = [],
  bulkActions = [],
  enableSearch = true,
  searchPlaceholder = "Pesquisar...",
  pageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  className,
  cardClassName,
  tableClassName,
  enableSelection = false,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  onRowClick,
  onAction,
  onBulkAction,
  loadingRows = 10,
  emptyIcon: EmptyIcon,
  emptyTitle = "Nenhum item encontrado",
  emptyDescription = "Não há dados para exibir",
  dependencies = []
}: DataTableProps<T>) {
  
  const {
    data,
    loading,
    error,
    selectedItems,
    pagination,
    sorting,
    filters,
    refresh,
    setPage,
    setLimit,
    setSorting,
    setFilters,
    toggleSelection,
    selectAll,
    clearSelection,
    search,
    isEmpty,
    isFiltered,
    hasSelection,
    isAllSelected,
    selectedCount,
    totalPages
  } = useTableData<T>({
    fetchFunction,
    initialLimit: pageSize,
    dependencies
  })

  // Search handling
  const [searchQuery, setSearchQuery] = React.useState("")
  
  const handleSearch = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    search(query)
  }, [search])

  // Sorting handling
  const handleSort = React.useCallback((column: string) => {
    if (!enableSorting) return
    setSorting(column)
  }, [setSorting, enableSorting])

  // Action handling
  const handleAction = React.useCallback((action: string, item: T) => {
    if (onAction) {
      onAction(action, item)
    }
  }, [onAction])

  // Bulk action handling
  const handleBulkAction = React.useCallback((action: string) => {
    if (onBulkAction && hasSelection) {
      onBulkAction(action, selectedItems)
    }
  }, [onBulkAction, hasSelection, selectedItems])

  // Row click handling
  const handleRowClick = React.useCallback((item: T) => {
    if (onRowClick) {
      onRowClick(item)
    }
  }, [onRowClick])

  // Render cell content
  const renderCell = React.useCallback((column: TableColumn<T>, item: T) => {
    if (column.render) {
      return column.render(item[column.key as keyof T], item)
    }
    
    const value = item[column.key as keyof T]
    
    // Handle different data types
    if (value === null || value === undefined) {
      return <span className="text-gray-400">-</span>
    }
    
    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? "secondary" : "outline"}>
          {value ? "Sim" : "Não"}
        </Badge>
      )
    }
    
    if (value instanceof Date) {
      return value.toLocaleDateString('pt-BR')
    }
    
    if (typeof value === 'string' && value.length > 50) {
      return (
        <span title={value}>
          {value.substring(0, 50)}...
        </span>
      )
    }
    
    return value
  }, [])

  // Loading skeleton
  const renderLoadingSkeleton = React.useCallback(() => {
    return Array.from({ length: loadingRows }).map((_, index) => (
      <TableRow key={index}>
        {enableSelection && (
          <TableCell>
            <div className="animate-pulse h-4 w-4 bg-gray-200 rounded"></div>
          </TableCell>
        )}
        {columns.map((column, colIndex) => (
          <TableCell key={colIndex}>
            <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4"></div>
          </TableCell>
        ))}
        {actions.length > 0 && (
          <TableCell>
            <div className="animate-pulse h-8 w-8 bg-gray-200 rounded mx-auto"></div>
          </TableCell>
        )}
      </TableRow>
    ))
  }, [loadingRows, enableSelection, columns, actions])

  // Empty state
  const renderEmptyState = React.useCallback(() => (
    <TableRow>
      <TableCell 
        colSpan={columns.length + (enableSelection ? 1 : 0) + (actions.length > 0 ? 1 : 0)} 
        className="text-center py-12"
      >
        {EmptyIcon && <EmptyIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />}
        <p className="text-gray-500 font-medium text-lg">{emptyTitle}</p>
        <p className="text-gray-400 text-sm">{emptyDescription}</p>
      </TableCell>
    </TableRow>
  ), [columns, enableSelection, actions, EmptyIcon, emptyTitle, emptyDescription])

  return (
    <Card className={`w-full bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0 ${cardClassName || ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-bold font-heading text-gray-900">
              {Icon && <Icon className="h-5 w-5" />}
              {title}
            </CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-4">
            {hasSelection && bulkActions.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1">
                  {selectedCount} selecionados
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Ações em Lote
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {bulkActions.map((action, index) => (
                      <DropdownMenuItem 
                        key={index}
                        onClick={() => handleBulkAction(action.key)}
                      >
                        {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {pagination.total} {totalLabel}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        {enableSearch && (
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={handleSearch}
                className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>
            
            {enablePagination && (
              <Select 
                value={pagination.limit.toString()} 
                onValueChange={(value) => setLimit(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map(size => (
                    <SelectItem key={size} value={size.toString()}>
                      {size} por página
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Table */}
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <Table className={`min-w-[800px] ${tableClassName || ''}`}>
            <TableHeader className="bg-gray-50">
              <TableRow>
                {enableSelection && (
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={() => isAllSelected ? clearSelection() : selectAll()}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                )}
                {columns.map((column, index) => (
                  <TableHead 
                    key={index} 
                    className={`font-semibold text-gray-900 ${column.sortable && enableSorting ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                    onClick={() => column.sortable && handleSort(column.key as string)}
                  >
                    <div className="flex items-center gap-1">
                      {column.label}
                      {column.sortable && enableSorting && sorting?.column === column.key && (
                        sorting.direction === 'asc' ? 
                          <ChevronUp className="h-3 w-3" /> : 
                          <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                ))}
                {actions.length > 0 && (
                  <TableHead className="text-center font-semibold text-gray-900 w-16">
                    Ações
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {loading ? renderLoadingSkeleton() : 
               isEmpty ? renderEmptyState() :
               data.map((item) => (
                <TableRow 
                  key={item.id} 
                  className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => handleRowClick(item)}
                >
                  {enableSelection && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedItems.some(selected => selected.id === item.id)}
                        onChange={() => toggleSelection(item)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                  )}
                  {columns.map((column, index) => (
                    <TableCell key={index}>
                      {renderCell(column, item)}
                    </TableCell>
                  ))}
                  {actions.length > 0 && (
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          {actions.map((action, index) => (
                            <React.Fragment key={index}>
                              {action.separator && <DropdownMenuSeparator />}
                              {action.label && (
                                <DropdownMenuLabel>{action.label}</DropdownMenuLabel>
                              )}
                              {!action.separator && !action.label && (
                                <DropdownMenuItem 
                                  onClick={() => handleAction(action.key, item)}
                                  className={action.className}
                                >
                                  {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                                  {action.label || action.key}
                                </DropdownMenuItem>
                              )}
                            </React.Fragment>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {enablePagination && pagination.total > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} {totalLabel}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(pagination.page - 1)}
                disabled={pagination.page === 1 || loading}
                className="h-8"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-sm text-gray-600 px-2">
                Página {pagination.page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(pagination.page + 1)}
                disabled={!pagination.hasMore || loading}
                className="h-8"
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}