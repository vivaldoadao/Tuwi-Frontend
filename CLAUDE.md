# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` or `yarn dev`
- **Build**: `npm run build` or `yarn build`
- **Production start**: `npm run start` or `yarn start`
- **Lint**: `npm run lint` or `yarn lint`

## Project Architecture

This is a **Next.js 15** full-featured e-commerce marketplace for hair braiding services and products ("Wilnara Tranças"). The application uses:

### Core Stack
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Supabase** as the primary database with RLS (Row Level Security)
- **NextAuth.js v5** for authentication with Google OAuth and credentials
- **React 19** with Server Components
- **Stripe** for payment processing

### Key Features & Architecture
- **Complete E-commerce Platform**: Real products from database, Stripe checkout, order management
- **Order Tracking System**: Full tracking with API endpoints, public tracking page, email notifications
- **Multi-role system**: Customer, Braider, Admin roles with comprehensive middleware protection
- **Advanced Admin Dashboard**: Analytics, charts, product/order/user management with filtering and pagination
- **Modern Braider Registration**: Complete form with image upload, portfolio management, approval workflow
- **Real-time notifications**: Comprehensive notification system with localStorage persistence
- **Payment Integration**: Stripe with webhooks, order status tracking, customer management

### Database & Data Layer
- **Supabase** with comprehensive schema including products, orders, braiders, users, tracking
- Advanced data layer in `/lib/data-supabase.ts` with admin functions in `/lib/data-supabase-admin.ts`
- **Row Level Security (RLS)** policies for data protection
- **Order tracking** with detailed event logging
- **Image upload** to Supabase Storage with proper file management
- Multiple SQL schema files in `/sql/` directory

### Authentication & Authorization
- **NextAuth.js v5** configuration in `/lib/auth.ts`
- Advanced middleware in `/middleware.ts` with role-based route protection
- **Stripe customer management** integrated with user system
- Email verification with comprehensive templates in `/lib/email-templates.ts`

### Payment & E-commerce
- **Stripe integration** with `/lib/stripe.ts` and `/lib/stripe-client.ts`
- Complete checkout flow with payment intents and webhooks
- **Order management** with status tracking and admin capabilities
- **Product management** with stock control, categories, and image galleries
- **Order tracking system** with public tracking page and email notifications

### UI & Components
- **Modern component architecture** with extensive tables, forms, and admin interfaces
- **Advanced tables** with filtering, pagination, and sorting (`/components/*-table.tsx`)
- **Image upload components** with drag-and-drop functionality
- **Dashboard charts** and analytics components
- **Stripe checkout form** with error handling and validation

### State Management & API
- **React Context** for global state with enhanced functionality
- **API routes** for all operations (`/app/api/`)
- **Client-side API layer** in `/lib/api-client.ts`
- **Email service** with tracking notifications in `/lib/tracking-notifications.ts`

### Key Directories
- `/app` - Next.js App Router with complete admin and customer dashboards
- `/components` - Extensive component library including admin interfaces
- `/lib` - Comprehensive utility functions, Stripe, email, order management
- `/sql` - Database schema and RLS policies
- `/context` - React Context providers with persistence

### Important Notes
- **Portuguese (pt-BR)** interface with professional e-commerce terminology
- **Comprehensive security** with RLS, proper authentication, and input validation
- **Modern admin interface** with real-time analytics and management capabilities
- **Professional order tracking** with customer-facing tracking page
- **Email system** with order confirmations, tracking updates, and admin notifications

### Environment Variables Required
- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Authentication**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, NextAuth variables
- **Stripe**: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Email**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

### Development Guidelines
1. **Data access**: Use the appropriate data layer functions from `/lib/data-supabase.ts`
2. **Admin operations**: Use functions from `/lib/data-supabase-admin.ts` for admin-only operations
3. **Stripe operations**: Follow established patterns in `/lib/stripe.ts`
4. **Email notifications**: Use templates from `/lib/email-templates.ts`
5. **Component patterns**: Follow the established table/form/dashboard component patterns
6. **Always run linting** and ensure RLS policies are respected