// ===================================
// TIPOS ESPECÍFICOS PARA FORMULÁRIOS
// ===================================

import { ReactNode } from 'react'

export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date' | 'time' | 'datetime' | 'url' | 'tel'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  help?: string
  description?: string
  
  // Validation
  validation?: {
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    custom?: (value: any, formData: Record<string, any>) => string | undefined
  }
  
  // Select/Radio options
  options?: { value: string | number | boolean; label: string; disabled?: boolean }[]
  
  // File specific
  accept?: string
  multiple?: boolean
  maxSize?: number // in bytes
  
  // Number specific
  step?: number
  
  // Conditional rendering
  show?: (formData: Record<string, any>) => boolean
  
  // Custom component
  component?: React.ComponentType<any>
  componentProps?: Record<string, any>
  
  // Layout
  fullWidth?: boolean
  className?: string
  labelClassName?: string
  inputClassName?: string
  
  // Events
  onChange?: (value: any, formData: Record<string, any>) => void
  onBlur?: () => void
  onFocus?: () => void
}

export interface FormSection {
  title: string
  description?: string
  fields: FormField[]
  collapsible?: boolean
  defaultCollapsed?: boolean
  show?: (formData: Record<string, any>) => boolean
}

export interface FormConfig {
  title: string
  description?: string
  fields?: FormField[]
  sections?: FormSection[]
  
  // Actions
  submitLabel?: string
  cancelLabel?: string
  resetLabel?: string
  onSubmit: (data: Record<string, any>) => Promise<void> | void
  onCancel?: () => void
  onReset?: () => void
  
  // State
  loading?: boolean
  disabled?: boolean
  initialData?: Record<string, any>
  
  // Validation
  validationSchema?: any // Zod schema or similar
  validateOnChange?: boolean
  validateOnBlur?: boolean
  
  // Layout
  layout?: 'vertical' | 'horizontal' | 'grid'
  columns?: number
  spacing?: 'sm' | 'md' | 'lg'
  
  // UI
  showRequiredIndicator?: boolean
  requiredIndicator?: string
  errorDisplayMode?: 'inline' | 'tooltip' | 'summary'
  
  // Advanced
  autoSave?: boolean
  autoSaveDelay?: number
  preventLeave?: boolean
  resetOnSubmit?: boolean
}

export interface FormState {
  data: Record<string, any>
  errors: Record<string, string>
  touched: Record<string, boolean>
  loading: boolean
  submitting: boolean
  dirty: boolean
  valid: boolean
}

export interface FormActions {
  setValue: (field: string, value: any) => void
  setValues: (values: Record<string, any>) => void
  setError: (field: string, error: string) => void
  setErrors: (errors: Record<string, string>) => void
  clearError: (field: string) => void
  clearAllErrors: () => void
  setTouched: (field: string, touched?: boolean) => void
  setAllTouched: () => void
  validate: () => boolean
  validateField: (field: string) => boolean
  submit: () => Promise<void>
  reset: (data?: Record<string, any>) => void
  setData: (data: Record<string, any>) => void
  setLoading: (loading: boolean) => void
  setSubmitting: (submitting: boolean) => void
}

export interface UseFormOptions {
  initialData?: Record<string, any>
  validationSchema?: any
  validateOnChange?: boolean
  validateOnBlur?: boolean
  onSubmit?: (data: Record<string, any>) => Promise<void> | void
  onReset?: () => void
  onError?: (errors: Record<string, string>) => void
}

export interface UseFormReturn extends FormState, FormActions {
  // Computed properties
  hasErrors: boolean
  errorCount: number
  fieldCount: number
  touchedCount: number
  validFieldCount: number
  completionPercentage: number
  
  // Field helpers
  getFieldError: (field: string) => string | undefined
  getFieldValue: (field: string) => any
  isFieldTouched: (field: string) => boolean
  isFieldValid: (field: string) => boolean
  isFieldRequired: (field: string) => boolean
}

export interface FormFieldProps {
  field: FormField
  value: any
  error?: string
  touched?: boolean
  onChange: (value: any) => void
  onBlur: () => void
  onFocus: () => void
  disabled?: boolean
  loading?: boolean
}

export interface FormBuilderProps {
  config: FormConfig
  className?: string
  onStateChange?: (state: FormState) => void
}

// Validation types
export interface ValidationRule {
  name: string
  validate: (value: any, formData: Record<string, any>) => boolean | string
  message?: string
}

export interface ValidationSchema {
  [fieldName: string]: ValidationRule[]
}

// Form layout types
export interface FormLayout {
  type: 'vertical' | 'horizontal' | 'grid' | 'tabs' | 'accordion'
  columns?: number
  gap?: string
  responsive?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
}

// File upload types
export interface FileUploadConfig {
  accept?: string
  multiple?: boolean
  maxSize?: number
  maxFiles?: number
  preview?: boolean
  uploadOnSelect?: boolean
  uploadEndpoint?: string
  onUpload?: (files: File[]) => Promise<string[]>
}

export interface FileUploadState {
  files: File[]
  uploading: boolean
  uploaded: string[]
  errors: string[]
  progress: Record<string, number>
}