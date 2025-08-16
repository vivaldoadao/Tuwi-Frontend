// ===================================
// HOOK GENÉRICO PARA TABELAS
// ===================================

import { useState, useCallback, useEffect, useRef } from 'react'
import type { 
  DataTableItem, 
  UseTableDataOptions, 
  UseTableDataReturn,
  PaginationConfig,
  SortConfig,
  FilterConfig
} from '@/types/table'

export function useTableData<T extends DataTableItem>(
  options: UseTableDataOptions<T>
): UseTableDataReturn<T> {
  const {
    fetchFunction,
    initialLimit = 10,
    initialFilters = {},
    initialSorting = null,
    dependencies = [],
    autoFetch = true
  } = options

  // State
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(autoFetch)
  const [error, setError] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<T[]>([])
  
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    limit: initialLimit,
    total: 0,
    hasMore: false
  })
  
  const [sorting, setSortingState] = useState<SortConfig | null>(initialSorting)
  const [filters, setFiltersState] = useState<FilterConfig>(initialFilters)
  
  // Refs para evitar loops infinitos
  const fetchFunctionRef = useRef(fetchFunction)
  const dependenciesRef = useRef(dependencies)
  
  // Update refs when values change
  fetchFunctionRef.current = fetchFunction
  dependenciesRef.current = dependencies

  // Função principal de fetch
  const fetchData = useCallback(async (
    page: number = pagination.page,
    limit: number = pagination.limit,
    currentFilters: FilterConfig = filters,
    currentSorting: SortConfig | null = sorting
  ) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await fetchFunctionRef.current(page, limit, currentFilters, currentSorting)
      
      setData(result.items)
      setPagination({
        page,
        limit,
        total: result.total,
        hasMore: result.hasMore
      })
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados'
      setError(errorMessage)
      console.error('Table data fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, filters, sorting])

  // Effect para carregar dados iniciais
  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [fetchData, autoFetch, ...dependenciesRef.current])

  // Actions
  const refresh = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  const setPage = useCallback((page: number) => {
    fetchData(page, pagination.limit, filters, sorting)
  }, [fetchData, pagination.limit, filters, sorting])

  const setLimit = useCallback((limit: number) => {
    fetchData(1, limit, filters, sorting) // Reset to page 1 when changing limit
  }, [fetchData, filters, sorting])

  const setSorting = useCallback((column: string, direction?: 'asc' | 'desc') => {
    const newDirection = direction || (
      sorting?.column === column && sorting.direction === 'asc' ? 'desc' : 'asc'
    )
    
    const newSorting: SortConfig = { column, direction: newDirection }
    setSortingState(newSorting)
    fetchData(1, pagination.limit, filters, newSorting) // Reset to page 1 when sorting
  }, [fetchData, pagination.limit, filters, sorting])

  const setFilters = useCallback((newFilters: FilterConfig) => {
    setFiltersState(newFilters)
    fetchData(1, pagination.limit, newFilters, sorting) // Reset to page 1 when filtering
  }, [fetchData, pagination.limit, sorting])

  const toggleSelection = useCallback((item: T) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(selected => selected.id === item.id)
      if (isSelected) {
        return prev.filter(selected => selected.id !== item.id)
      } else {
        return [...prev, item]
      }
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedItems([...data])
  }, [data])

  const clearSelection = useCallback(() => {
    setSelectedItems([])
  }, [])

  const search = useCallback((query: string) => {
    const searchFilters = query ? { ...filters, search: query } : { ...filters, search: undefined }
    setFilters(searchFilters)
  }, [filters, setFilters])

  // Computed properties
  const isEmpty = data.length === 0 && !loading
  const isFiltered = Object.keys(filters).some(key => filters[key] !== undefined && filters[key] !== '')
  const hasSelection = selectedItems.length > 0
  const isAllSelected = data.length > 0 && selectedItems.length === data.length
  const selectedCount = selectedItems.length
  const totalPages = Math.ceil(pagination.total / pagination.limit)

  return {
    // State
    data,
    loading,
    error,
    selectedItems,
    pagination,
    sorting,
    filters,
    
    // Actions
    refresh,
    setPage,
    setLimit,
    setSorting,
    setFilters,
    setSelectedItems,
    toggleSelection,
    selectAll,
    clearSelection,
    search,
    
    // Computed
    isEmpty,
    isFiltered,
    hasSelection,
    isAllSelected,
    selectedCount,
    totalPages
  }
}