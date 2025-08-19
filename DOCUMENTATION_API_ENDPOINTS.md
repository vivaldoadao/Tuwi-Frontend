# TUWI MARKETPLACE - DOCUMENTAÇÃO COMPLETA DOS ENDPOINTS API

Esta documentação detalha todos os endpoints da API do marketplace Tuwi, permitindo a implementação da mesma lógica em Django.

## ÍNDICE
1. [Autenticação](#autenticação)
2. [Braiders](#braiders)
3. [Produtos e E-commerce](#produtos-e-e-commerce)
4. [Pedidos](#pedidos)
5. [Chat e Mensagens](#chat-e-mensagens)
6. [Notificações](#notificações)
7. [Administração](#administração)
8. [Promoções e Pagamentos](#promoções-e-pagamentos)
9. [Upload de Arquivos](#upload-de-arquivos)
10. [WebSockets](#websockets)

---

## AUTENTICAÇÃO

### POST /api/auth/register
**Descrição**: Registra novo utilizador no sistema
**Autenticação**: Não requerida
**Corpo da Requisição**:
```json
{
  "name": "string (min: 2 chars)",
  "email": "string (email válido)",
  "password": "string (min: 6 chars)"
}
```
**Resposta de Sucesso (200)**:
```json
{
  "message": "Conta criada! Verifique seu email para ativar a conta.",
  "requiresVerification": true,
  "email": "user@example.com",
  "code": "123456" // Apenas em desenvolvimento
}
```
**Regras de Negócio**:
- Email deve ser único no sistema
- Password é hasheado com bcrypt (12 rounds)
- Código de verificação é gerado (6 dígitos, válido por 30 minutos)
- Email de verificação é enviado automaticamente
- Utilizador criado como 'customer' por padrão, não verificado

### POST /api/auth/verify-email
**Descrição**: Verifica email do utilizador com código de 6 dígitos
**Autenticação**: Não requerida
**Corpo da Requisição**:
```json
{
  "email": "string (email)",
  "code": "string (6 dígitos)"
}
```
**Resposta de Sucesso (200)**:
```json
{
  "message": "Email verificado com sucesso! Sua conta está ativa."
}
```
**Regras de Negócio**:
- Código deve estar válido e não expirado
- Utilizador é marcado como verificado
- Código de verificação é removido após uso
- Email de boas-vindas é enviado (assíncrono)

### POST /api/auth/resend-verification
**Descrição**: Reenvia código de verificação
**Autenticação**: Não requerida
**Corpo da Requisição**:
```json
{
  "email": "string (email)"
}
```

### POST /api/auth/reset-password
**Descrição**: Solicita reset de password via email
**Autenticação**: Não requerida

### POST /api/auth/reset-password-confirm
**Descrição**: Confirma reset de password com código
**Autenticação**: Não requerida

### GET /api/auth/[...nextauth]
**Descrição**: Endpoints do NextAuth.js para autenticação
**Métodos**: GET, POST
**Provedores**:
- Google OAuth
- Credentials (email/password)

---

## BRAIDERS

### GET /api/braiders
**Descrição**: Lista todos os braiders aprovados
**Autenticação**: Não requerida (endpoint público)
**Query Parameters**:
- `featured`: "true" | "false" - Filtra braiders em destaque
- `limit`: number - Limita quantidade de resultados
**Resposta de Sucesso (200)**:
```json
{
  "braiders": [
    {
      "id": "uuid",
      "name": "string",
      "bio": "string",
      "location": "string",
      "contactEmail": "string",
      "contactPhone": "string",
      "profileImageUrl": "string",
      "services": [],
      "portfolioImages": ["string"],
      "status": "approved",
      "averageRating": 4.8,
      "totalReviews": 45,
      "district": "string",
      "concelho": "string",
      "freguesia": "string"
    }
  ]
}
```

### POST /api/braiders
**Descrição**: Registo de novo braider (candidatura)
**Autenticação**: Token JWT requerido
**Corpo da Requisição**:
```json
{
  "name": "string",
  "bio": "string",
  "location": "string",
  "district": "string",
  "concelho": "string",
  "freguesia": "string",
  "contactEmail": "string",
  "contactPhone": "string",
  "specialties": ["string"],
  "yearsExperience": "number",
  "portfolioImages": ["string"]
}
```
**Regras de Negócio**:
- Braider criado com status 'pending'
- Requer aprovação por admin
- Pode ser associado a utilizador autenticado ou criado independentemente

### GET /api/braiders/[id]
**Descrição**: Detalhes de braider específico
**Autenticação**: Não requerida

### GET /api/braiders/services
**Descrição**: Lista serviços de braiders
**Autenticação**: Não requerida

### GET /api/braiders/availability
**Descrição**: Verifica disponibilidade de braider
**Query Parameters**:
- `braiderId`: uuid
- `date`: YYYY-MM-DD
- `duration`: number (minutos)

### GET /api/braiders/bookings
**Descrição**: Lista agendamentos do braider
**Autenticação**: Token JWT requerido (role: braider)

### POST /api/braiders/bookings
**Descrição**: Cria novo agendamento
**Autenticação**: Token JWT requerido

---

## PRODUTOS E E-COMMERCE

### GET /api/products
**Descrição**: Lista produtos ativos
**Autenticação**: Não requerida
**Query Parameters**:
- `category`: string - Filtra por categoria
- `featured`: "true" | "false" - Produtos em destaque
- `limit`: number - Limita resultados
**Resposta de Sucesso (200)**:
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "price": 29.99,
      "salePrice": 24.99,
      "category": "string",
      "stockQuantity": 10,
      "images": ["string"],
      "isActive": true,
      "isFeatured": false,
      "createdAt": "ISO date"
    }
  ]
}
```

### POST /api/products
**Descrição**: Cria novo produto
**Autenticação**: Token JWT requerido (role: admin)

### GET /api/products/[id]
**Descrição**: Detalhes de produto específico
**Autenticação**: Não requerida

### PUT /api/products/[id]
**Descrição**: Atualiza produto
**Autenticação**: Token JWT requerido (role: admin)

### DELETE /api/products/[id]
**Descrição**: Remove produto
**Autenticação**: Token JWT requerido (role: admin)

---

## PEDIDOS

### POST /api/create-payment-intent
**Descrição**: Cria payment intent para checkout Stripe
**Autenticação**: Token JWT requerido
**Corpo da Requisição**:
```json
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "name": "string",
    "street": "string",
    "city": "string",
    "postalCode": "string",
    "country": "string",
    "phone": "string"
  }
}
```
**Resposta de Sucesso (200)**:
```json
{
  "clientSecret": "string",
  "orderId": "uuid"
}
```

### POST /api/confirm-payment
**Descrição**: Confirma pagamento e finaliza pedido
**Autenticação**: Token JWT requerido

### GET /api/track-order
**Descrição**: Endpoint público para rastreamento
**Query Parameters**:
- `orderNumber`: string - Número do pedido
**Resposta de Sucesso (200)**:
```json
{
  "order": {
    "orderNumber": "string",
    "status": "string",
    "total": 29.99,
    "createdAt": "ISO date",
    "shippingAddress": {},
    "items": [],
    "tracking": [
      {
        "status": "string",
        "message": "string",
        "location": "string",
        "createdAt": "ISO date"
      }
    ]
  }
}
```

### POST /api/update-order-status
**Descrição**: Atualiza status do pedido
**Autenticação**: Token JWT requerido (role: admin)

### POST /api/stripe/webhook
**Descrição**: Webhook do Stripe para eventos de pagamento
**Autenticação**: Stripe signature verification

---

## CHAT E MENSAGENS

### GET /api/conversations
**Descrição**: Lista conversas do utilizador
**Autenticação**: Token JWT requerido
**Resposta de Sucesso (200)**:
```json
{
  "conversations": [
    {
      "id": "uuid",
      "participant1Id": "uuid",
      "participant2Id": "uuid",
      "lastMessage": {
        "content": "string",
        "timestamp": "ISO date",
        "senderId": "uuid"
      },
      "unreadCount": 2,
      "otherParticipant": {
        "id": "uuid",
        "name": "string",
        "avatarUrl": "string"
      }
    }
  ]
}
```

### POST /api/conversations
**Descrição**: Cria nova conversa
**Autenticação**: Token JWT requerido
**Corpo da Requisição**:
```json
{
  "participantId": "uuid"
}
```

### GET /api/conversations/[id]/messages
**Descrição**: Lista mensagens de conversa
**Autenticação**: Token JWT requerido
**Query Parameters**:
- `page`: number - Paginação
- `limit`: number - Limite por página

### POST /api/conversations/[id]/messages
**Descrição**: Envia nova mensagem
**Autenticação**: Token JWT requerido
**Corpo da Requisição**:
```json
{
  "content": "string",
  "messageType": "text" | "image" | "file",
  "fileUrl": "string", // Opcional
  "replyToMessageId": "uuid" // Opcional
}
```

### POST /api/conversations/[id]/typing
**Descrição**: Atualiza status de digitação
**Autenticação**: Token JWT requerido
**Corpo da Requisição**:
```json
{
  "isTyping": true
}
```

### PUT /api/messages/[id]/read
**Descrição**: Marca mensagem como lida
**Autenticação**: Token JWT requerido

---

## NOTIFICAÇÕES

### GET /api/notifications
**Descrição**: Lista notificações do utilizador
**Autenticação**: Token JWT requerido
**Query Parameters**:
- `unreadOnly`: "true" | "false"
- `page`: number
- `limit`: number

### POST /api/notifications
**Descrição**: Cria nova notificação
**Autenticação**: Token JWT requerido (role: admin)

### PUT /api/notifications/[id]
**Descrição**: Marca notificação como lida
**Autenticação**: Token JWT requerido

### GET /api/notifications/settings
**Descrição**: Configurações de notificação do utilizador
**Autenticação**: Token JWT requerido

### PUT /api/notifications/settings
**Descrição**: Atualiza configurações de notificação
**Autenticação**: Token JWT requerido

---

## ADMINISTRAÇÃO

### GET /api/admin/braiders-list
**Descrição**: Lista braiders para administração
**Autenticação**: Token JWT requerido (role: admin)
**Query Parameters**:
- `status`: "pending" | "approved" | "rejected"
- `page`: number
- `limit`: number
- `search`: string

### PUT /api/admin/braiders/[id]
**Descrição**: Aprova/rejeita braider
**Autenticação**: Token JWT requerido (role: admin)
**Corpo da Requisição**:
```json
{
  "status": "approved" | "rejected",
  "notes": "string"
}
```

### GET /api/admin/products
**Descrição**: Lista produtos para administração
**Autenticação**: Token JWT requerido (role: admin)

### POST /api/admin/products/toggle
**Descrição**: Ativa/desativa produto
**Autenticação**: Token JWT requerido (role: admin)

### GET /api/admin/users/[id]
**Descrição**: Detalhes de utilizador para admin
**Autenticação**: Token JWT requerido (role: admin)

### PUT /api/admin/users/[id]
**Descrição**: Atualiza dados de utilizador
**Autenticação**: Token JWT requerido (role: admin)

---

## PROMOÇÕES E PAGAMENTOS

### GET /api/promotions/active
**Descrição**: Lista promoções ativas
**Autenticação**: Não requerida

### POST /api/promotions/checkout
**Descrição**: Checkout de promoção
**Autenticação**: Token JWT requerido

### GET /api/promotions/analytics
**Descrição**: Analíticas de promoções
**Autenticação**: Token JWT requerido (role: admin)

### POST /api/promotions/webhook
**Descrição**: Webhook para eventos de promoções
**Autenticação**: Stripe signature verification

---

## UPLOAD DE ARQUIVOS

### POST /api/upload-profile-image
**Descrição**: Upload de imagem de perfil
**Autenticação**: Token JWT requerido
**Corpo da Requisição**: FormData com campo 'file'
**Resposta de Sucesso (200)**:
```json
{
  "url": "string",
  "message": "Upload realizado com sucesso"
}
```

### POST /api/upload-service-image
**Descrição**: Upload de imagem de serviço
**Autenticação**: Token JWT requerido

### POST /api/upload/message-file
**Descrição**: Upload de arquivo para mensagem
**Autenticação**: Token JWT requerido

### POST /api/admin/upload-image
**Descrição**: Upload de imagem pelo admin
**Autenticação**: Token JWT requerido (role: admin)

---

## WEBSOCKETS

### /api/socket/io
**Descrição**: Servidor Socket.IO para tempo real
**Eventos Suportados**:
- `join-conversation`: Entrar em conversa
- `leave-conversation`: Sair de conversa
- `send-message`: Enviar mensagem
- `typing-start`: Começar a digitar
- `typing-stop`: Parar de digitar
- `user-online`: Utilizador online
- `user-offline`: Utilizador offline

---

## CÓDIGOS DE RESPOSTA HTTP

### Sucessos
- `200`: OK - Operação bem-sucedida
- `201`: Created - Recurso criado com sucesso
- `204`: No Content - Operação bem-sucedida sem conteúdo

### Erros de Cliente
- `400`: Bad Request - Dados inválidos
- `401`: Unauthorized - Não autenticado
- `403`: Forbidden - Sem permissão
- `404`: Not Found - Recurso não encontrado
- `409`: Conflict - Conflito (ex: email já existe)
- `422`: Unprocessable Entity - Validação falhou

### Erros de Servidor
- `500`: Internal Server Error - Erro interno
- `503`: Service Unavailable - Serviço indisponível

---

## MIDDLEWARE E SEGURANÇA

### Autenticação
- JWT tokens para sessões
- NextAuth.js para OAuth e credentials
- Refresh tokens para longas sessões

### Autorização
- Role-based access control (customer, braider, admin)
- Resource-level permissions
- Row-level security (RLS) no Supabase

### Validação
- Zod schemas para validação de dados
- Sanitização de inputs
- Rate limiting (implementar)

### Upload de Arquivos
- Validação de tipos de arquivo
- Limite de tamanho
- Antivírus scan (recomendado)
- CDN para entrega (Supabase Storage)

---

## VARIÁVEIS DE AMBIENTE NECESSÁRIAS

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# Upload
NEXT_PUBLIC_SUPABASE_STORAGE_URL=
```

---

## CONSIDERAÇÕES PARA DJANGO

### Models
- Usar UUIDField para todos os IDs
- JSONField para dados estruturados
- DecimalField para valores monetários
- Choices para campos com opções limitadas

### Views
- Django REST Framework ViewSets
- Permissions personalizadas baseadas em roles
- Filtros e paginação
- Serializers para validação

### Authentication
- Django Simple JWT
- Custom User model
- OAuth2 com django-oauth-toolkit
- Role-based permissions

### Real-time
- Django Channels para WebSockets
- Redis para pub/sub
- Celery para tasks assíncronas

### File Upload
- Django Storages com S3
- Pillow para processamento de imagens
- django-cleanup para limpeza automática

Esta documentação serve como base completa para implementar toda a funcionalidade do marketplace em Django, mantendo a mesma lógica de negócio e estrutura de APIs.