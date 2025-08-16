// ===================================
// CONTACT FORM - NOVA VERSÃO COM FORMBUILDER
// ===================================

"use client"

import * as React from "react"
import { FormBuilder } from "@/components/form-builder"
import { toast } from "react-hot-toast"
import { Send, Mail } from "lucide-react"
import type { FormField } from "@/types/form"
import { z } from "zod"

// Validation schema
const contactSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
  subject: z.string().min(1, "Assunto é obrigatório").min(5, "Assunto deve ter pelo menos 5 caracteres"),
  message: z.string().min(1, "Mensagem é obrigatória").min(10, "Mensagem deve ter pelo menos 10 caracteres")
})

export function ContactFormNew() {
  
  // Form fields configuration
  const fields: FormField[] = [
    {
      name: 'name',
      label: 'Nome Completo',
      type: 'text',
      placeholder: 'Seu nome completo',
      required: true,
      validation: {
        minLength: 2,
        maxLength: 100
      },
      help: 'Como você gostaria de ser chamado?'
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'seu@email.com',
      required: true,
      help: 'Usaremos este email para responder sua mensagem'
    },
    {
      name: 'subject',
      label: 'Assunto',
      type: 'select',
      placeholder: 'Selecione o assunto',
      required: true,
      fullWidth: true,
      options: [
        { value: 'informacoes', label: '📋 Informações Gerais' },
        { value: 'agendamento', label: '📅 Agendamento de Serviços' },
        { value: 'produtos', label: '🛍️ Produtos e Compras' },
        { value: 'parceria', label: '🤝 Oportunidades de Parceria' },
        { value: 'suporte', label: '🛠️ Suporte Técnico' },
        { value: 'reclamacao', label: '⚠️ Reclamação ou Problema' },
        { value: 'elogio', label: '⭐ Elogio ou Feedback' },
        { value: 'outro', label: '💬 Outro Assunto' }
      ],
      help: 'Selecione o assunto que melhor descreve sua mensagem'
    },
    {
      name: 'message',
      label: 'Mensagem',
      type: 'textarea',
      placeholder: 'Descreva sua dúvida, solicitação ou comentário...',
      required: true,
      fullWidth: true,
      validation: {
        minLength: 10,
        maxLength: 1000
      },
      help: 'Seja específico para podermos ajudá-lo melhor (máx. 1000 caracteres)'
    }
  ]

  // Submit handler - simulates sending email
  const handleSubmit = React.useCallback(async (formData: any) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Here you would normally send the email via API
    console.log('Contact form data:', formData)
    
    // Success notification
    toast.success(
      `Obrigado, ${formData.name}! Sua mensagem foi enviada com sucesso. ` +
      'Nossa equipe entrará em contato em breve.',
      { duration: 5000 }
    )
    
    // Could also show different messages based on subject
    const subjectMessages = {
      'agendamento': 'Nossa equipe de agendamentos entrará em contato em até 2 horas.',
      'suporte': 'Nosso suporte técnico responderá em até 24 horas.',
      'reclamacao': 'Sua reclamação será analisada com prioridade pela nossa equipe.',
      'elogio': 'Muito obrigado pelo seu feedback! Isso significa muito para nós.'
    }
    
    const specificMessage = subjectMessages[formData.subject as keyof typeof subjectMessages]
    if (specificMessage) {
      setTimeout(() => {
        toast.info(specificMessage, { duration: 4000 })
      }, 1000)
    }
  }, [])

  // Error handler
  const handleError = React.useCallback((errors: Record<string, string>) => {
    console.error('Contact form validation errors:', errors)
    toast.error('Por favor, corrija os erros no formulário antes de enviar.')
  }, [])

  // Field change handler - for analytics or dynamic behavior
  const handleFieldChange = React.useCallback((field: string, value: any) => {
    // Could track form interactions for analytics
    console.log(`Field ${field} changed to:`, value)
    
    // Could implement dynamic behavior based on field changes
    if (field === 'subject' && value === 'agendamento') {
      // Could show additional fields or information
      console.log('User selected agendamento - could show scheduling info')
    }
  }, [])

  return (
    <div className="max-w-2xl mx-auto">
      <FormBuilder<typeof contactSchema._type>
        fields={fields}
        onSubmit={handleSubmit}
        onError={handleError}
        onFieldChange={handleFieldChange}
        initialData={{
          name: '',
          email: '',
          subject: '',
          message: ''
        }}
        validationSchema={contactSchema}
        card={true}
        cardProps={{
          title: "Envie sua Mensagem",
          description: "Preencha o formulário abaixo e nossa equipe retornará o contato em breve.",
          className: "bg-white shadow-xl border-0 rounded-3xl overflow-hidden"
        }}
        title=""
        icon={Mail}
        submitText="Enviar Mensagem"
        submitIcon={Send}
        resetText="Limpar Formulário"
        validateOnBlur={true}
        validateOnChange={false}
        showProgress={true}
        showReset={true}
        columns={2}
        className="p-8 md:p-12"
      />
    </div>
  )
}