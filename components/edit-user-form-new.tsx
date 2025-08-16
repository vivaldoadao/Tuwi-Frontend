// ===================================
// EDIT USER FORM - NOVA VERSÃO COM FORMBUILDER
// ===================================

"use client"

import * as React from "react"
import { FormBuilder } from "@/components/form-builder"
import { updateUser, type User } from "@/lib/data-supabase"
import { toast } from "react-hot-toast"
import { Edit } from "lucide-react"
import type { FormField } from "@/types/form"
import { z } from "zod"

interface EditUserFormNewProps {
  user: User
  onUserUpdated: (updatedUser: User) => void
  trigger?: React.ReactNode
}

// Validation schema
const userSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
  phone: z.string().optional().refine((value) => {
    if (!value) return true
    return /^[\+]?[\d\s\(\)\-]{10,}$/.test(value.replace(/\s/g, ''))
  }, "Telefone inválido")
})

export function EditUserFormNew({ user, onUserUpdated, trigger }: EditUserFormNewProps) {
  
  // Form fields configuration
  const fields: FormField[] = [
    {
      name: 'name',
      label: 'Nome Completo',
      type: 'text',
      placeholder: 'Digite o nome completo',
      required: true,
      validation: {
        minLength: 2,
        maxLength: 100
      },
      help: 'Nome que será exibido no perfil do usuário'
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'usuario@email.com',
      required: true,
      help: 'Email usado para login e notificações'
    },
    {
      name: 'phone',
      label: 'Telefone',
      type: 'tel',
      placeholder: '(11) 99999-9999',
      required: false,
      help: 'Telefone para contato (opcional)'
    }
  ]

  // Submit handler
  const handleSubmit = React.useCallback(async (formData: any) => {
    const { success, error } = await updateUser(user.id, {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone?.trim() || undefined
    })

    if (success) {
      const updatedUser: User = {
        ...user,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || undefined
      }
      
      onUserUpdated(updatedUser)
      toast.success('Usuário atualizado com sucesso')
    } else {
      toast.error(error || 'Erro ao atualizar usuário')
      throw new Error(error || 'Falha na atualização')
    }
  }, [user, onUserUpdated])

  // Error handler
  const handleError = React.useCallback((errors: Record<string, string>) => {
    console.error('Form validation errors:', errors)
  }, [])

  return (
    <FormBuilder<typeof userSchema._type>
      fields={fields}
      onSubmit={handleSubmit}
      onError={handleError}
      initialData={{
        name: user.name,
        email: user.email,
        phone: user.phone || ''
      }}
      validationSchema={userSchema}
      modal={true}
      trigger={trigger}
      modalProps={{
        title: "Editar Usuário",
        description: "Atualize as informações do usuário abaixo.",
        size: "md"
      }}
      submitText="Atualizar"
      submitIcon={Edit}
      validateOnBlur={true}
      validateOnChange={false}
      showProgress={false}
      columns={1}
    />
  )
}