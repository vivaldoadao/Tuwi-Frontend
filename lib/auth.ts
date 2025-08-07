import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials)
          
          // Get user from Supabase
          const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single()

          if (error || !user || !user.password_hash) {
            return null
          }

          // Check if email is verified
          if (!user.email_verified) {
            console.log('Login attempt with unverified email:', email)
            return null
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(password, user.password_hash)
          
          if (!isValidPassword) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar_url,
            role: user.role,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async signIn() {
      // Always allow sign-in first, then try to create user record
      return true
    },
    async jwt({ token, user, account }) {
      if (user && account?.provider === 'google') {
        try {
          // Check if user already exists in our custom table
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email!)
            .single()

          if (!existingUser) {
            // Create new user in Supabase with a simple UUID
            const userId = crypto.randomUUID()
            
            const { error } = await supabase
              .from('users')
              .insert({
                id: userId,
                email: user.email!,
                name: user.name || 'Usuário',
                avatar_url: user.image,
                role: 'customer'
              })

            if (error) {
              console.error('Error creating user in Supabase:', error)
            } else {
              console.log('User created successfully in Supabase')
            }
          }

          token.role = existingUser?.role || 'customer'
        } catch (error) {
          console.error('Error in JWT callback:', error)
          token.role = 'customer'
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Se é um callback de sign-in, redirecionar para nossa página de callback
      if (url.startsWith(baseUrl + '/api/auth/callback')) {
        return `${baseUrl}/auth-callback`
      }
      // Para outros casos, usar o comportamento padrão
      return url.startsWith(baseUrl) ? url : baseUrl
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
})

export type { Session } from 'next-auth'

declare module 'next-auth' {
  interface User {
    role?: string
  }
  
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
  }
}