interface EmailTemplateProps {
  userName: string
  code?: string
  companyName?: string
  supportEmail?: string
}

interface OrderDetails {
  orderId: string
  customerName: string
  items: {
    productName: string
    productPrice: number
    quantity: number
    subtotal: number
    productImage?: string
  }[]
  subtotal: number
  shippingCost: number
  total: number
  shippingAddress: string
  shippingCity: string
  shippingPostalCode: string
  shippingCountry: string
  orderDate: string
  paymentIntentId?: string
}

interface OrderConfirmationProps {
  userName: string
  orderDetails: OrderDetails
}

// Base template wrapper
const baseTemplate = (content: string, title: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8f9fa;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);
            padding: 30px 20px;
            text-align: center;
            color: white;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
        }
        
        .message {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        
        .code-container {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            border-radius: 12px;
            padding: 25px;
            text-align: center;
            margin: 30px 0;
            border: 2px dashed #d1d5db;
        }
        
        .code-label {
            font-size: 14px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .code {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 32px;
            font-weight: 700;
            color: #8B5CF6;
            letter-spacing: 4px;
            background: white;
            padding: 15px 25px;
            border-radius: 8px;
            display: inline-block;
            box-shadow: 0 2px 4px rgba(139, 92, 246, 0.1);
        }
        
        .expiry {
            font-size: 14px;
            color: #ef4444;
            margin-top: 15px;
            font-weight: 500;
        }
        
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);
            color: white;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: transform 0.2s ease;
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }
        
        .button:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
        }
        
        .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        
        .footer p {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 10px;
        }
        
        .footer .brand {
            font-weight: 700;
            color: #8B5CF6;
            font-size: 16px;
            margin-bottom: 15px;
        }
        
        .social-links {
            margin-top: 20px;
        }
        
        .social-links a {
            display: inline-block;
            margin: 0 8px;
            color: #6b7280;
            text-decoration: none;
            font-size: 14px;
        }
        
        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%);
            margin: 30px 0;
        }
        
        @media (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .code {
                font-size: 28px;
                letter-spacing: 3px;
                padding: 12px 20px;
            }
            
            .header h1 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div style="padding: 20px 0; background-color: #f8f9fa; min-height: 100vh;">
        <div class="container">
            <div class="header">
                <h1>🌟 WILNARA TRANÇAS</h1>
                <p>Realce sua beleza natural</p>
            </div>
            ${content}
            <div class="footer">
                <div class="brand">WILNARA TRANÇAS</div>
                <p>Obrigado por escolher nossos serviços!</p>
                <p>Se você não solicitou esta ação, ignore este email.</p>
                <div class="divider"></div>
                <p style="font-size: 12px; color: #9ca3af;">
                    Este é um email automático, por favor não responda.<br>
                    Para suporte, entre em contato: suporte@wilnaratracas.com
                </p>
            </div>
        </div>
    </div>
</body>
</html>
`

// Password Reset Template
export const passwordResetTemplate = ({ userName, code }: EmailTemplateProps): string => {
  const content = `
    <div class="content">
        <div class="greeting">Olá, ${userName}! 👋</div>
        <div class="message">
            Recebemos uma solicitação para redefinir a senha da sua conta na <strong>Wilnara Tranças</strong>.
            Use o código de verificação abaixo para continuar com a alteração da sua senha.
        </div>
        
        <div class="code-container">
            <div class="code-label">Código de Verificação</div>
            <div class="code">${code}</div>
            <div class="expiry">⏰ Este código expira em 15 minutos</div>
        </div>
        
        <div class="message">
            <strong>Como usar:</strong><br>
            1. Acesse a página de redefinição de senha<br>
            2. Digite este código de 6 dígitos<br>
            3. Crie sua nova senha<br>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXTAUTH_URL}/reset-password/verify" class="button">
                🔐 Redefinir Senha
            </a>
        </div>
    </div>
  `
  
  return baseTemplate(content, 'Redefinir Senha - Wilnara Tranças')
}

// Email Verification Template
export const emailVerificationTemplate = ({ userName, code }: EmailTemplateProps): string => {
  const content = `
    <div class="content">
        <div class="greeting">Bem-vindo(a), ${userName}! 🎉</div>
        <div class="message">
            Ficamos muito felizes em ter você conosco na <strong>Wilnara Tranças</strong>!
            Para completar seu cadastro e começar a usar nossa plataforma, 
            precisamos verificar seu endereço de email.
        </div>
        
        <div class="code-container">
            <div class="code-label">Código de Verificação</div>
            <div class="code">${code}</div>
            <div class="expiry">⏰ Este código expira em 30 minutos</div>
        </div>
        
        <div class="message">
            <strong>Como verificar:</strong><br>
            1. Acesse a página de verificação de email<br>
            2. Digite este código de 6 dígitos<br>
            3. Sua conta será ativada automaticamente<br>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXTAUTH_URL}/verify-email" class="button">
                ✅ Verificar Email
            </a>
        </div>
    </div>
  `
  
  return baseTemplate(content, 'Verificar Email - Wilnara Tranças')
}

// Welcome Email Template
export const welcomeTemplate = ({ userName }: EmailTemplateProps): string => {
  const content = `
    <div class="content">
        <div class="greeting">Seja bem-vindo(a), ${userName}! 🌟</div>
        <div class="message">
            Sua conta foi criada com sucesso na <strong>Wilnara Tranças</strong>!
            Agora você pode explorar nossos produtos, encontrar trancistas qualificadas 
            e fazer seus agendamentos de forma prática e segura.
        </div>
        
        <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; padding: 25px; margin: 30px 0;">
            <h3 style="color: #8B5CF6; margin-bottom: 15px;">🎯 O que você pode fazer agora:</h3>
            <ul style="color: #6b7280; line-height: 1.8; padding-left: 20px;">
                <li>Explorar nossa coleção de produtos</li>
                <li>Encontrar trancistas em sua região</li>
                <li>Agendar serviços de qualidade</li>
                <li>Gerenciar seus pedidos</li>
                <li>Acompanhar suas encomendas</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXTAUTH_URL}" class="button">
                🚀 Começar Agora
            </a>
        </div>
    </div>
  `
  
  return baseTemplate(content, 'Bem-vindo - Wilnara Tranças')
}

// Order Confirmation Template
export const orderConfirmationTemplate = ({ userName, orderDetails }: OrderConfirmationProps): string => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const itemsHtml = orderDetails.items.map(item => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 20px 0; vertical-align: top;">
        <div style="display: flex; align-items: center; gap: 15px;">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); 
                      border-radius: 8px; display: flex; align-items: center; justify-content: center; 
                      font-size: 12px; color: #6b7280; text-align: center; flex-shrink: 0;">
            ${item.productImage ? `<img src="${item.productImage}" alt="${item.productName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">` : '📦<br>Produto'}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; color: #1f2937; font-size: 16px; margin-bottom: 5px;">
              ${item.productName}
            </div>
            <div style="color: #6b7280; font-size: 14px;">
              Quantidade: ${item.quantity}
            </div>
          </div>
        </div>
      </td>
      <td style="padding: 20px 0; text-align: right; vertical-align: top; white-space: nowrap;">
        <div style="font-weight: 600; color: #1f2937; font-size: 16px;">
          ${formatCurrency(item.subtotal)}
        </div>
        <div style="color: #6b7280; font-size: 14px;">
          ${formatCurrency(item.productPrice)} × ${item.quantity}
        </div>
      </td>
    </tr>
  `).join('')

  const content = `
    <div class="content">
        <div class="greeting">Olá, ${userName}! 🎉</div>
        <div class="message">
            Seu pedido foi confirmado com sucesso! Estamos preparando tudo com muito carinho para você.
        </div>
        
        <!-- Order Status -->
        <div style="text-align: center; margin: 30px 0;">
            <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); 
                        border-radius: 12px; padding: 25px; display: inline-block; min-width: 280px;">
                <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
                <div style="font-size: 20px; font-weight: 700; color: #059669; margin-bottom: 10px;">
                    Pedido Confirmado!
                </div>
                <div style="font-size: 16px; color: #065f46; font-weight: 600;">
                    Pedido #${orderDetails.orderId}
                </div>
                <div style="font-size: 14px; color: #065f46; margin-top: 5px;">
                    ${formatDate(orderDetails.orderDate)}
                </div>
            </div>
        </div>

        <!-- Order Summary -->
        <div style="background: #f9fafb; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #e5e7eb;">
            <h3 style="color: #1f2937; font-size: 18px; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
                📦 Resumo do Pedido
            </h3>
            
            <!-- Items Table -->
            <div style="background: white; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 15px 20px; text-align: left; font-size: 14px; font-weight: 600; color: #374151;">
                                Produto
                            </th>
                            <th style="padding: 15px 20px; text-align: right; font-size: 14px; font-weight: 600; color: #374151;">
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
            </div>

            <!-- Order Totals -->
            <div style="background: white; border-radius: 8px; padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 16px;">Subtotal:</span>
                    <span style="color: #1f2937; font-size: 16px; font-weight: 500;">${formatCurrency(orderDetails.subtotal)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 16px;">Frete:</span>
                    <span style="color: #1f2937; font-size: 16px; font-weight: 500;">${formatCurrency(orderDetails.shippingCost)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; margin-top: 8px;">
                    <span style="color: #1f2937; font-size: 18px; font-weight: 700;">Total:</span>
                    <span style="color: #8B5CF6; font-size: 20px; font-weight: 700;">${formatCurrency(orderDetails.total)}</span>
                </div>
            </div>
        </div>

        <!-- Shipping Information -->
        <div style="background: #f0f9ff; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #bae6fd;">
            <h3 style="color: #0c4a6e; font-size: 18px; font-weight: 700; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                🚚 Endereço de Entrega
            </h3>
            <div style="background: white; border-radius: 8px; padding: 20px;">
                <div style="color: #1f2937; font-size: 16px; line-height: 1.6;">
                    <div style="font-weight: 600; margin-bottom: 8px;">${orderDetails.customerName}</div>
                    <div>${orderDetails.shippingAddress}</div>
                    <div>${orderDetails.shippingCity}, ${orderDetails.shippingPostalCode}</div>
                    <div>${orderDetails.shippingCountry}</div>
                </div>
            </div>
        </div>

        <!-- Payment Confirmation -->
        ${orderDetails.paymentIntentId ? `
        <div style="background: #ecfdf5; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #bbf7d0;">
            <h3 style="color: #065f46; font-size: 18px; font-weight: 700; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                💳 Pagamento Confirmado
            </h3>
            <div style="background: white; border-radius: 8px; padding: 20px;">
                <div style="color: #059669; font-size: 16px; font-weight: 600; margin-bottom: 8px;">
                    ✅ Pagamento processado com sucesso
                </div>
                <div style="color: #6b7280; font-size: 14px;">
                    ID da transação: ${orderDetails.paymentIntentId}
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Next Steps -->
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); border-radius: 12px; padding: 25px; margin: 30px 0;">
            <h3 style="color: #92400e; font-size: 18px; font-weight: 700; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                📋 Próximos Passos
            </h3>
            <div style="color: #78350f; line-height: 1.7;">
                <p style="margin-bottom: 10px;">1. <strong>Processamento:</strong> Estamos preparando seus produtos</p>
                <p style="margin-bottom: 10px;">2. <strong>Envio:</strong> Você receberá o código de rastreamento em breve</p>
                <p style="margin-bottom: 10px;">3. <strong>Entrega:</strong> Estimativa de 5-7 dias úteis</p>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px;">
            <a href="${process.env.NEXTAUTH_URL}/orders" class="button" style="margin-right: 15px;">
                📋 Acompanhar Pedido
            </a>
            <a href="${process.env.NEXTAUTH_URL}/products" class="button" style="background: linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%);">
                🛍️ Continuar Comprando
            </a>
        </div>
    </div>
  `
  
  return baseTemplate(content, `Pedido Confirmado #${orderDetails.orderId} - Wilnara Tranças`)
}