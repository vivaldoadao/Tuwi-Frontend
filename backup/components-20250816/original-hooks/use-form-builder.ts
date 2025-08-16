// ===================================
// HOOK GENÉRICO PARA FORMULÁRIOS
// ===================================

import { useState, useCallback, useEffect, useRef } from 'react'
import type { 
  UseFormOptions, 
  UseFormReturn,
  FormField
} from '@/types/form'

export function useFormBuilder<T extends Record<string, any>>(
  options: UseFormOptions
): UseFormReturn<T> {
  const {
    initialData = {},
    validationSchema,
    validateOnChange = false,
    validateOnBlur = true,
    onSubmit,
    onReset,
    onError
  } = options

  // State
  const [data, setDataState] = useState<Partial<T>>(initialData)
  const [errors, setErrorsState] = useState<Record<string, string>>({})
  const [touched, setTouchedState] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Refs para callbacks
  const onSubmitRef = useRef(onSubmit)
  const onResetRef = useRef(onReset)
  const onErrorRef = useRef(onError)

  // Update refs when callbacks change
  onSubmitRef.current = onSubmit
  onResetRef.current = onReset
  onErrorRef.current = onError

  // Computed properties
  const dirty = JSON.stringify(data) !== JSON.stringify(initialData)
  const hasErrors = Object.keys(errors).length > 0
  const valid = !hasErrors && Object.keys(touched).length > 0
  const errorCount = Object.keys(errors).length
  const fieldCount = Object.keys(data).length
  const touchedCount = Object.keys(touched).filter(key => touched[key]).length
  const validFieldCount = fieldCount - errorCount
  const completionPercentage = fieldCount > 0 ? (validFieldCount / fieldCount) * 100 : 0

  // Validation function
  const validateField = useCallback((field: keyof T): boolean => {
    if (!validationSchema) return true

    const value = data[field]
    const fieldSchema = validationSchema[field as string]
    
    if (!fieldSchema) return true

    try {
      fieldSchema.parse(value)
      setErrorsState(prev => {
        const newErrors = { ...prev }
        delete newErrors[field as string]
        return newErrors
      })
      return true
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.message || 'Valor inválido'
      setErrorsState(prev => ({
        ...prev,
        [field as string]: errorMessage
      }))
      return false
    }
  }, [data, validationSchema])

  const validate = useCallback((): boolean => {
    if (!validationSchema) return true

    let isValid = true
    const newErrors: Record<string, string> = {}

    Object.keys(data).forEach(field => {
      try {
        const fieldSchema = validationSchema[field]
        if (fieldSchema) {
          fieldSchema.parse(data[field as keyof T])
        }
      } catch (err: any) {
        isValid = false
        newErrors[field] = err.errors?.[0]?.message || 'Valor inválido'
      }
    })

    setErrorsState(newErrors)
    
    if (!isValid && onErrorRef.current) {
      onErrorRef.current(newErrors)
    }

    return isValid
  }, [data, validationSchema])

  // Actions
  const setValue = useCallback((field: keyof T, value: any) => {
    setDataState(prev => ({ ...prev, [field]: value }))
    
    if (validateOnChange) {
      setTimeout(() => validateField(field), 0)
    }
  }, [validateOnChange, validateField])

  const setValues = useCallback((values: Partial<T>) => {
    setDataState(prev => ({ ...prev, ...values }))
    
    if (validateOnChange) {
      Object.keys(values).forEach(field => {
        setTimeout(() => validateField(field as keyof T), 0)
      })
    }
  }, [validateOnChange, validateField])

  const setError = useCallback((field: keyof T, error: string) => {
    setErrorsState(prev => ({ ...prev, [field as string]: error }))
  }, [])

  const setErrors = useCallback((newErrors: Record<string, string>) => {
    setErrorsState(newErrors)
  }, [])

  const clearError = useCallback((field: keyof T) => {
    setErrorsState(prev => {
      const newErrors = { ...prev }
      delete newErrors[field as string]
      return newErrors
    })
  }, [])

  const clearAllErrors = useCallback(() => {
    setErrorsState({})
  }, [])

  const setTouched = useCallback((field: keyof T, isTouched: boolean = true) => {
    setTouchedState(prev => ({ ...prev, [field as string]: isTouched }))
    
    if (isTouched && validateOnBlur) {
      setTimeout(() => validateField(field), 0)
    }
  }, [validateOnBlur, validateField])

  const setAllTouched = useCallback(() => {
    const touchedFields: Record<string, boolean> = {}
    Object.keys(data).forEach(field => {
      touchedFields[field] = true
    })
    setTouchedState(touchedFields)
  }, [data])

  const submit = useCallback(async () => {
    if (!onSubmitRef.current) return

    setSubmitting(true)
    setAllTouched()

    try {
      const isValid = validate()
      
      if (!isValid) {
        console.warn('Form validation failed')
        return
      }

      await onSubmitRef.current(data as T)
      
    } catch (err) {
      console.error('Form submission error:', err)
      if (err instanceof Error) {
        setError('submit' as keyof T, err.message)
      }
    } finally {
      setSubmitting(false)
    }
  }, [data, validate, setAllTouched, setError])

  const reset = useCallback((newData?: Partial<T>) => {
    const resetData = newData || initialData
    setDataState(resetData)
    setErrorsState({})
    setTouchedState({})
    setSubmitting(false)
    
    if (onResetRef.current) {
      onResetRef.current()
    }
  }, [initialData])

  const setData = useCallback((newData: Partial<T>) => {
    setDataState(newData)
  }, [])

  const setLoadingState = useCallback((isLoading: boolean) => {
    setLoading(isLoading)
  }, [])

  const setSubmittingState = useCallback((isSubmitting: boolean) => {
    setSubmitting(isSubmitting)
  }, [])

  // Helper functions
  const getFieldError = useCallback((field: string): string | undefined => {
    return errors[field]
  }, [errors])

  const getFieldValue = useCallback((field: string): any => {
    return data[field as keyof T]
  }, [data])

  const isFieldTouched = useCallback((field: string): boolean => {
    return touched[field] || false
  }, [touched])

  const isFieldValid = useCallback((field: string): boolean => {
    return !errors[field] && touched[field]
  }, [errors, touched])

  const isFieldRequired = useCallback((field: string): boolean => {
    if (!validationSchema) return false
    const fieldSchema = validationSchema[field]
    return fieldSchema && !fieldSchema.isOptional()
  }, [validationSchema])

  // Effect para limpar erros quando dados mudam
  useEffect(() => {
    if (validateOnChange) {
      const changedFields = Object.keys(data).filter(field => 
        data[field as keyof T] !== initialData[field as keyof T]
      )
      
      changedFields.forEach(field => {
        if (errors[field]) {
          setTimeout(() => validateField(field as keyof T), 100)
        }
      })
    }
  }, [data, validateOnChange, validateField, errors, initialData])

  return {
    // State
    data,
    errors,
    touched,
    loading,
    submitting,
    dirty,
    valid,
    
    // Actions
    setValue,
    setValues,
    setError,
    setErrors,
    clearError,
    clearAllErrors,
    setTouched,
    setAllTouched,
    validate,
    validateField,
    submit,
    reset,
    setData,
    setLoading: setLoadingState,
    setSubmitting: setSubmittingState,
    
    // Computed
    hasErrors,
    errorCount,
    fieldCount,
    touchedCount,
    validFieldCount,
    completionPercentage,
    
    // Helpers
    getFieldError,
    getFieldValue,
    isFieldTouched,
    isFieldValid,
    isFieldRequired
  }
}