// ===================================
// COMPONENTE FORMBUILDER GENÉRICO
// ===================================

"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  Loader2, 
  Save, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Eye,
  EyeOff
} from "lucide-react"
import { useFormBuilder } from "@/hooks/use-form-builder"
import type { FormField, FormConfig } from "@/types/form"
import { cn } from "@/lib/utils"

interface FormBuilderProps<T extends Record<string, any>> {
  // Required props
  fields: FormField[]
  onSubmit: (data: T) => Promise<void> | void
  
  // Form configuration
  config?: FormConfig
  initialData?: Partial<T>
  
  // Layout and presentation
  title?: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  
  // Modal/Dialog mode
  trigger?: React.ReactNode
  modal?: boolean
  modalProps?: {
    title?: string
    description?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
  }
  
  // Card mode
  card?: boolean
  cardProps?: {
    title?: string
    description?: string
    className?: string
  }
  
  // Layout options
  columns?: 1 | 2 | 3
  className?: string
  
  // Callbacks
  onReset?: () => void
  onError?: (errors: Record<string, string>) => void
  onChange?: (data: Partial<T>) => void
  onFieldChange?: (field: string, value: any) => void
  
  // Submit button
  submitText?: string
  submitIcon?: React.ComponentType<{ className?: string }>
  resetText?: string
  showReset?: boolean
  
  // Loading and validation
  validateOnChange?: boolean
  validateOnBlur?: boolean
  showProgress?: boolean
  
  // Custom validation schema (Zod)
  validationSchema?: Record<string, any>
}

export function FormBuilder<T extends Record<string, any>>({
  fields,
  onSubmit,
  config,
  initialData = {},
  title,
  description,
  icon: Icon,
  trigger,
  modal = false,
  modalProps,
  card = false,
  cardProps,
  columns = 1,
  className,
  onReset,
  onError,
  onChange,
  onFieldChange,
  submitText = "Salvar",
  submitIcon: SubmitIcon = Save,
  resetText = "Limpar",
  showReset = true,
  validateOnChange = false,
  validateOnBlur = true,
  showProgress = false,
  validationSchema
}: FormBuilderProps<T>) {
  
  const [open, setOpen] = React.useState(false)
  const [showPasswords, setShowPasswords] = React.useState<Record<string, boolean>>({})
  
  const {
    data,
    errors,
    touched,
    loading,
    submitting,
    dirty,
    valid,
    setValue,
    setValues,
    setError,
    clearError,
    setTouched,
    submit,
    reset,
    completionPercentage,
    getFieldError,
    getFieldValue,
    isFieldTouched,
    isFieldValid,
    isFieldRequired
  } = useFormBuilder<T>({
    initialData,
    validationSchema,
    validateOnChange,
    validateOnBlur,
    onSubmit: async (formData) => {
      try {
        await onSubmit(formData)
        if (modal) setOpen(false)
      } catch (error) {
        console.error('Form submission error:', error)
      }
    },
    onReset,
    onError
  })

  // Handle field change
  const handleFieldChange = React.useCallback((fieldName: string, value: any) => {
    setValue(fieldName as keyof T, value)
    
    if (onChange) {
      onChange({ [fieldName]: value } as Partial<T>)
    }
    
    if (onFieldChange) {
      onFieldChange(fieldName, value)
    }
  }, [setValue, onChange, onFieldChange])

  // Handle field blur
  const handleFieldBlur = React.useCallback((fieldName: string) => {
    setTouched(fieldName as keyof T, true)
  }, [setTouched])

  // Toggle password visibility
  const togglePasswordVisibility = React.useCallback((fieldName: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }))
  }, [])

  // Render individual field
  const renderField = React.useCallback((field: FormField) => {
    const value = getFieldValue(field.name)
    const error = getFieldError(field.name)
    const isTouched = isFieldTouched(field.name)
    const isValid = isFieldValid(field.name)
    const isRequired = field.required || isFieldRequired(field.name)
    
    // Check if field should be shown
    if (field.show && !field.show(data)) {
      return null
    }

    const fieldId = `field-${field.name}`
    const hasError = !!error && isTouched

    return (
      <div 
        key={field.name} 
        className={cn(
          "space-y-2",
          field.fullWidth && columns > 1 && "col-span-full",
          field.className
        )}
      >
        {/* Label */}
        <Label 
          htmlFor={fieldId}
          className={cn(
            "text-gray-900 font-medium flex items-center gap-1",
            field.labelClassName
          )}
        >
          {field.label}
          {isRequired && <span className="text-red-500">*</span>}
          {isValid && isTouched && (
            <CheckCircle className="h-3 w-3 text-green-500" />
          )}
        </Label>

        {/* Description */}
        {field.description && (
          <p className="text-sm text-gray-600">{field.description}</p>
        )}

        {/* Input Field */}
        <div className="relative">
          {field.type === 'text' || field.type === 'email' || field.type === 'url' || field.type === 'tel' ? (
            <Input
              id={fieldId}
              name={field.name}
              type={field.type}
              value={value || ''}
              placeholder={field.placeholder}
              disabled={field.disabled || submitting}
              readOnly={field.readOnly}
              required={isRequired}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              onBlur={() => handleFieldBlur(field.name)}
              className={cn(
                "bg-gray-50 border-gray-200 focus:bg-white transition-colors",
                hasError && "border-red-300 focus:border-red-500",
                isValid && isTouched && "border-green-300",
                field.inputClassName
              )}
            />
          ) : field.type === 'password' ? (
            <div className="relative">
              <Input
                id={fieldId}
                name={field.name}
                type={showPasswords[field.name] ? 'text' : 'password'}
                value={value || ''}
                placeholder={field.placeholder}
                disabled={field.disabled || submitting}
                readOnly={field.readOnly}
                required={isRequired}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                onBlur={() => handleFieldBlur(field.name)}
                className={cn(
                  "bg-gray-50 border-gray-200 focus:bg-white transition-colors pr-10",
                  hasError && "border-red-300 focus:border-red-500",
                  isValid && isTouched && "border-green-300",
                  field.inputClassName
                )}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility(field.name)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords[field.name] ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          ) : field.type === 'number' ? (
            <Input
              id={fieldId}
              name={field.name}
              type="number"
              value={value || ''}
              placeholder={field.placeholder}
              disabled={field.disabled || submitting}
              readOnly={field.readOnly}
              required={isRequired}
              min={field.validation?.min}
              max={field.validation?.max}
              step={field.step}
              onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value) || 0)}
              onBlur={() => handleFieldBlur(field.name)}
              className={cn(
                "bg-gray-50 border-gray-200 focus:bg-white transition-colors",
                hasError && "border-red-300 focus:border-red-500",
                isValid && isTouched && "border-green-300",
                field.inputClassName
              )}
            />
          ) : field.type === 'textarea' ? (
            <Textarea
              id={fieldId}
              name={field.name}
              value={value || ''}
              placeholder={field.placeholder}
              disabled={field.disabled || submitting}
              readOnly={field.readOnly}
              required={isRequired}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              onBlur={() => handleFieldBlur(field.name)}
              className={cn(
                "bg-gray-50 border-gray-200 focus:bg-white transition-colors min-h-[100px]",
                hasError && "border-red-300 focus:border-red-500",
                isValid && isTouched && "border-green-300",
                field.inputClassName
              )}
            />
          ) : field.type === 'select' ? (
            <Select
              value={value || ''}
              onValueChange={(val) => handleFieldChange(field.name, val)}
              disabled={field.disabled || submitting}
              required={isRequired}
            >
              <SelectTrigger className={cn(
                "bg-gray-50 border-gray-200 focus:bg-white",
                hasError && "border-red-300",
                isValid && isTouched && "border-green-300",
                field.inputClassName
              )}>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem 
                    key={option.value.toString()} 
                    value={option.value.toString()}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : field.type === 'checkbox' ? (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={fieldId}
                checked={value || false}
                onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
                disabled={field.disabled || submitting}
              />
              <Label htmlFor={fieldId} className="text-sm font-normal">
                {field.placeholder || field.label}
              </Label>
            </div>
          ) : field.type === 'radio' ? (
            <RadioGroup
              value={value || ''}
              onValueChange={(val) => handleFieldChange(field.name, val)}
              disabled={field.disabled || submitting}
            >
              {field.options?.map((option) => (
                <div key={option.value.toString()} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={option.value.toString()} 
                    id={`${fieldId}-${option.value}`}
                    disabled={option.disabled}
                  />
                  <Label htmlFor={`${fieldId}-${option.value}`} className="text-sm font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : field.type === 'file' ? (
            <Input
              id={fieldId}
              name={field.name}
              type="file"
              accept={field.accept}
              multiple={field.multiple}
              disabled={field.disabled || submitting}
              onChange={(e) => {
                const files = e.target.files
                handleFieldChange(field.name, field.multiple ? Array.from(files || []) : files?.[0])
              }}
              onBlur={() => handleFieldBlur(field.name)}
              className={cn(
                "bg-gray-50 border-gray-200 focus:bg-white transition-colors",
                hasError && "border-red-300 focus:border-red-500",
                field.inputClassName
              )}
            />
          ) : field.component ? (
            <field.component
              id={fieldId}
              name={field.name}
              value={value}
              onChange={(val: any) => handleFieldChange(field.name, val)}
              onBlur={() => handleFieldBlur(field.name)}
              disabled={field.disabled || submitting}
              {...field.componentProps}
            />
          ) : null}
        </div>

        {/* Help Text */}
        {field.help && !hasError && (
          <p className="text-xs text-gray-500">{field.help}</p>
        )}

        {/* Error Message */}
        {hasError && (
          <div className="flex items-center gap-1 text-sm text-red-600">
            <AlertCircle className="h-3 w-3" />
            {error}
          </div>
        )}
      </div>
    )
  }, [
    data, getFieldValue, getFieldError, isFieldTouched, isFieldValid, isFieldRequired,
    handleFieldChange, handleFieldBlur, togglePasswordVisibility, showPasswords,
    submitting, columns
  ])

  // Render form content
  const renderFormContent = React.useCallback(() => (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              {Icon && <Icon className="h-5 w-5" />}
              {title}
            </h3>
          )}
          {description && (
            <p className="text-gray-600">{description}</p>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {showProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progresso do formulário</span>
            <span className="text-gray-900 font-medium">{Math.round(completionPercentage)}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4">
        <div className={cn(
          "grid gap-4",
          columns === 1 && "grid-cols-1",
          columns === 2 && "grid-cols-1 md:grid-cols-2",
          columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}>
          {fields.map(renderField)}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            {dirty && (
              <Badge variant="outline" className="text-xs">
                <Info className="h-3 w-3 mr-1" />
                Alterações não salvas
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {showReset && (
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
                disabled={submitting || !dirty}
                size="sm"
              >
                <X className="h-4 w-4 mr-1" />
                {resetText}
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={submitting || !valid}
              size="sm"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <SubmitIcon className="h-4 w-4 mr-1" />
              )}
              {submitting ? 'Salvando...' : submitText}
            </Button>
          </div>
        </div>
      </form>
    </div>
  ), [
    className, title, description, Icon, showProgress, completionPercentage,
    fields, renderField, columns, submit, dirty, showReset, reset, submitting,
    valid, resetText, submitText, SubmitIcon
  ])

  // Modal mode
  if (modal && trigger) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className={cn(
          "max-w-md",
          modalProps?.size === 'sm' && "max-w-sm",
          modalProps?.size === 'md' && "max-w-md",
          modalProps?.size === 'lg' && "max-w-lg",
          modalProps?.size === 'xl' && "max-w-xl"
        )}>
          <DialogHeader>
            {modalProps?.title && (
              <DialogTitle>{modalProps.title}</DialogTitle>
            )}
            {modalProps?.description && (
              <DialogDescription>{modalProps.description}</DialogDescription>
            )}
          </DialogHeader>
          {renderFormContent()}
        </DialogContent>
      </Dialog>
    )
  }

  // Card mode
  if (card) {
    return (
      <Card className={cn("bg-white shadow-lg", cardProps?.className)}>
        {(cardProps?.title || cardProps?.description) && (
          <CardHeader>
            {cardProps?.title && (
              <CardTitle>{cardProps.title}</CardTitle>
            )}
            {cardProps?.description && (
              <CardDescription>{cardProps.description}</CardDescription>
            )}
          </CardHeader>
        )}
        <CardContent>
          {renderFormContent()}
        </CardContent>
      </Card>
    )
  }

  // Default mode
  return renderFormContent()
}