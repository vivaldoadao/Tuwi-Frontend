"use client"

import { useNotifications } from "@/context/notifications-context-v2"
import type { Product, Braider } from "@/lib/data"

export function useNotificationHelpers() {
  const { addNotification, showToast } = useNotifications()

  const notifyProductAddedToCart = (product: Product, quantity = 1) => {
    showToast({
      type: 'success',
      title: 'Produto Adicionado',
      message: `${product.name} foi adicionado ao carrinho`,
      duration: 3000
    })
  }

  const notifyProductRemovedFromCart = (product: Product) => {
    showToast({
      type: 'info',
      title: 'Produto Removido',
      message: `${product.name} foi removido do carrinho`,
      duration: 3000
    })
  }

  const notifyProductAddedToFavorites = async (product: Product) => {
    try {
      await addNotification({
        type: 'success',
        title: 'Produto Favoritado',
        message: `${product.name} foi adicionado aos seus favoritos`,
        isImportant: false,
        actionUrl: '/favorites',
        actionLabel: 'Ver Favoritos'
      })
    } catch (error) {
      console.error('Error adding notification:', error)
    }

    showToast({
      type: 'success',
      title: 'Adicionado aos Favoritos',
      message: product.name,
      duration: 2000
    })
  }

  const notifyProductRemovedFromFavorites = (product: Product) => {
    showToast({
      type: 'info',
      title: 'Removido dos Favoritos',
      message: product.name,
      duration: 2000
    })
  }

  const notifyBraiderAddedToFavorites = async (braider: Braider) => {
    try {
      await addNotification({
        type: 'success',
        title: 'Trancista Favoritada',
        message: `${braider.name} foi adicionada aos seus favoritos`,
        isImportant: false,
        actionUrl: '/favorites',
        actionLabel: 'Ver Favoritos'
      })
    } catch (error) {
      console.error('Error adding notification:', error)
    }

    showToast({
      type: 'success',
      title: 'Adicionada aos Favoritos',
      message: braider.name,
      duration: 2000
    })
  }

  const notifyBraiderRemovedFromFavorites = (braider: Braider) => {
    showToast({
      type: 'info',
      title: 'Removida dos Favoritos',
      message: braider.name,
      duration: 2000
    })
  }

  const notifyOrderPlaced = async (orderId: string) => {
    try {
      await addNotification({
        type: 'order',
        title: 'Pedido Realizado com Sucesso',
        message: `Seu pedido #${orderId} foi confirmado e está sendo processado`,
        isImportant: true,
        actionUrl: `/dashboard/orders/${orderId}`,
        actionLabel: 'Ver Pedido'
      })
    } catch (error) {
      console.error('Error adding notification:', error)
    }

    showToast({
      type: 'success',
      title: 'Pedido Confirmado',
      message: `Pedido #${orderId} realizado com sucesso!`,
      duration: 5000
    })
  }

  const notifyOrderStatusChanged = async (orderId: string, status: string) => {
    const statusMessages = {
      'processando': 'Seu pedido está sendo preparado',
      'enviado': 'Seu pedido foi enviado',
      'entregue': 'Seu pedido foi entregue',
      'cancelado': 'Seu pedido foi cancelado'
    }

    try {
      await addNotification({
        type: 'order',
        title: 'Status do Pedido Atualizado',
        message: statusMessages[status as keyof typeof statusMessages] || `Status alterado para: ${status}`,
        isImportant: true,
        actionUrl: `/dashboard/orders/${orderId}`,
        actionLabel: 'Ver Pedido',
        metadata: { orderId }
      })
    } catch (error) {
      console.error('Error adding notification:', error)
    }
  }

  const notifyNewMessage = async (senderName: string, messagePreview: string) => {
    try {
      await addNotification({
        type: 'message',
        title: 'Nova Mensagem',
        message: `${senderName}: ${messagePreview}`,
        isImportant: false,
        actionUrl: '/messages',
        actionLabel: 'Ver Mensagem'
      })
    } catch (error) {
      console.error('Error adding notification:', error)
    }

    showToast({
      type: 'message',
      title: 'Nova Mensagem',
      message: `${senderName} enviou uma mensagem`,
      duration: 4000
    })
  }

  const notifyBookingConfirmed = async (braiderName: string, date: string, time: string) => {
    try {
      await addNotification({
        type: 'booking',
        title: 'Agendamento Confirmado',
        message: `Seu agendamento com ${braiderName} foi confirmado para ${date} às ${time}`,
        isImportant: true,
        actionUrl: '/profile',
        actionLabel: 'Ver Agendamentos'
      })
    } catch (error) {
      console.error('Error adding notification:', error)
    }

    showToast({
      type: 'success',
      title: 'Agendamento Confirmado',
      message: `${braiderName} - ${date} às ${time}`,
      duration: 5000
    })
  }

  const notifyBookingCancelled = async (braiderName: string, date: string) => {
    try {
      await addNotification({
        type: 'warning',
        title: 'Agendamento Cancelado',
        message: `Seu agendamento com ${braiderName} para ${date} foi cancelado`,
        isImportant: true,
        actionUrl: '/profile',
        actionLabel: 'Ver Agendamentos'
      })
    } catch (error) {
      console.error('Error adding notification:', error)
    }

    showToast({
      type: 'warning',
      title: 'Agendamento Cancelado',
      message: `${braiderName} - ${date}`,
      duration: 5000
    })
  }

  const notifyBraiderApproved = async () => {
    try {
      await addNotification({
        type: 'success',
        title: 'Conta Aprovada!',
        message: 'Parabéns! Sua conta de trancista foi aprovada. Você já pode começar a receber agendamentos.',
        isImportant: true,
        actionUrl: '/braider-dashboard',
        actionLabel: 'Acessar Dashboard'
      })
    } catch (error) {
      console.error('Error adding notification:', error)
    }

    showToast({
      type: 'success',
      title: 'Conta Aprovada!',
      message: 'Bem-vinda ao Wilnara Tranças!',
      duration: 6000
    })
  }

  const notifyBraiderRejected = async (reason?: string) => {
    try {
      await addNotification({
        type: 'error',
        title: 'Conta Não Aprovada',
        message: reason || 'Sua solicitação de conta de trancista não foi aprovada. Entre em contato conosco para mais informações.',
        isImportant: true,
        actionUrl: '/contact',
        actionLabel: 'Contato'
      })
    } catch (error) {
      console.error('Error adding notification:', error)
    }
  }

  const notifySystemMaintenance = async (message: string, scheduledTime: string) => {
    try {
      await addNotification({
        type: 'system',
        title: 'Manutenção Programada',
        message: `${message} Programada para: ${scheduledTime}`,
        isImportant: true
      })
    } catch (error) {
      console.error('Error adding notification:', error)
    }
  }

  const notifyWelcome = async (userName: string) => {
    try {
      await addNotification({
        type: 'system',
        title: `Bem-vinda, ${userName}!`,
        message: 'Explore nossos produtos e encontre as melhores trancistas da região.',
        isImportant: false,
        actionUrl: '/products',
        actionLabel: 'Explorar'
      })
    } catch (error) {
      console.error('Error adding notification:', error)
    }
  }

  const notifyError = (title: string, message: string) => {
    showToast({
      type: 'error',
      title,
      message,
      duration: 6000
    })
  }

  const notifySuccess = (title: string, message: string) => {
    showToast({
      type: 'success',
      title,
      message,
      duration: 3000
    })
  }

  const notifyInfo = (title: string, message: string) => {
    showToast({
      type: 'info',
      title,
      message,
      duration: 4000
    })
  }

  return {
    // Cart notifications
    notifyProductAddedToCart,
    notifyProductRemovedFromCart,

    // Favorites notifications
    notifyProductAddedToFavorites,
    notifyProductRemovedFromFavorites,
    notifyBraiderAddedToFavorites,
    notifyBraiderRemovedFromFavorites,

    // Order notifications
    notifyOrderPlaced,
    notifyOrderStatusChanged,

    // Message notifications
    notifyNewMessage,

    // Booking notifications
    notifyBookingConfirmed,
    notifyBookingCancelled,

    // Braider account notifications
    notifyBraiderApproved,
    notifyBraiderRejected,

    // System notifications
    notifySystemMaintenance,
    notifyWelcome,

    // Generic notifications
    notifyError,
    notifySuccess,
    notifyInfo
  }
}