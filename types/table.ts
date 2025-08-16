// ===================================
// TIPOS ESPECÍFICOS PARA TABELAS
// ===================================

import { ReactNode } from 'react'

export interface DataTableItem {
  id: string
  [key: string]: any
}

export interface TableColumn<T extends DataTableItem> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (value: any, item: T) => ReactNode
  className?: string
  width?: string
  sticky?: boolean
}

export interface TableAction<T extends DataTableItem> {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: (item: T) => void | Promise<void>
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  disabled?: (item: T) => boolean
  show?: (item: T) => boolean
  loading?: boolean
}

export interface BulkAction<T extends DataTableItem> {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: (selectedItems: T[]) => void | Promise<void>
  variant?: 'default' | 'destructive' | 'outline' | 'secondary'
  disabled?: (selectedItems: T[]) => boolean
  confirmMessage?: string
  loading?: boolean
}

export interface TableFilter {
  key: string
  label: string
  type: 'text' | 'select' | 'date' | 'number' | 'boolean'
  options?: { value: string | number | boolean; label: string }[]
  placeholder?: string
  defaultValue?: any
  multiple?: boolean
}

export interface SortConfig {
  column: string
  direction: 'asc' | 'desc'
}

export interface FilterConfig {
  [key: string]: string | number | boolean | string[] | undefined
}

export interface PaginationConfig {
  page: number
  limit: number
  total: number
  hasMore: boolean
}

export interface TableState<T extends DataTableItem> {
  data: T[]
  loading: boolean
  error: string | null
  selectedItems: T[]
  pagination: PaginationConfig
  sorting: SortConfig | null
  filters: FilterConfig
}

export interface TableActions<T extends DataTableItem> {
  refresh: () => Promise<void>
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setSorting: (column: string, direction?: 'asc' | 'desc') => void
  setFilters: (filters: FilterConfig) => void
  setSelectedItems: (items: T[]) => void
  toggleSelection: (item: T) => void
  selectAll: () => void
  clearSelection: () => void
  search: (query: string) => void
}

export interface DataTableConfig<T extends DataTableItem> {
  columns: TableColumn<T>[]
  actions?: TableAction<T>[]
  bulkActions?: BulkAction<T>[]
  filters?: TableFilter[]
  searchable?: boolean
  searchPlaceholder?: string
  selectable?: boolean
  sortable?: boolean
  paginated?: boolean
  pageSize?: number
  emptyState?: {
    title: string
    description: string
    icon?: React.ComponentType<{ className?: string }>
    action?: {
      label: string
      onClick: () => void
    }
  }
  loading?: {
    rows?: number
    showSkeleton?: boolean
  }
}

export interface FetchFunction<T extends DataTableItem> {
  (page: number, limit: number, filters?: FilterConfig, sorting?: SortConfig): Promise<{
    items: T[]
    total: number
    hasMore: boolean
  }>
}

export interface UseTableDataOptions<T extends DataTableItem> {
  fetchFunction: FetchFunction<T>
  initialLimit?: number
  initialFilters?: FilterConfig
  initialSorting?: SortConfig
  dependencies?: any[]
  autoFetch?: boolean
}

export interface UseTableDataReturn<T extends DataTableItem> extends TableState<T>, TableActions<T> {
  // Computed properties
  isEmpty: boolean
  isFiltered: boolean
  hasSelection: boolean
  isAllSelected: boolean
  selectedCount: number
  totalPages: number
}