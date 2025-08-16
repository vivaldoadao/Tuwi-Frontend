import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Create Supabase client for NextAuth with fallback
function createSupabaseClientSafe() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Missing Supabase environment variables, using fallback')
      return null
    }
    
    return createClient(supabaseUrl, supabaseServiceKey)
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    return null
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export default {
  // Temporarily disable SupabaseAdapter due to Edge Runtime env var issues
  // adapter: SupabaseAdapter(createSupabaseClient()),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials)
          
          const supabase = createSupabaseClientSafe()
          
          if (!supabase) {
            console.error('Supabase client not available')
            return null
          }
          
          // Authenticate with Supabase Auth
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error || !data.user) {
            return null
          }

          // Get user profile from our custom users table
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single()

          if (profileError) {
            // User doesn't exist in our users table, create one
            const { data: newProfile, error: createError } = await supabase
              .from('users')
              .insert({
                id: data.user.id,
                email: data.user.email!,
                name: data.user.user_metadata?.full_name || 'Usuário',
                avatar_url: data.user.user_metadata?.avatar_url,
              })
              .select()
              .single()

            if (createError) {
              console.error('Error creating user profile:', createError)
              return null
            }

            return {
              id: data.user.id,
              email: data.user.email!,
              name: newProfile.name,
              image: newProfile.avatar_url,
              role: newProfile.role,
            }
          }

          return {
            id: data.user.id,
            email: data.user.email!,
            name: profile.name,
            image: profile.avatar_url,
            role: profile.role,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        const supabase = createSupabaseClientSafe()
        
        if (!supabase) {
          console.warn('Supabase not available for Google sign-in, allowing for now')
          return true
        }
        
        // Create user profile in our custom table for Google sign-ins
        try {
          const { error } = await supabase
            .from('users')
            .upsert({
              id: user.id,
              email: user.email!,
              name: profile?.name || user.name || 'Usuário',
              avatar_url: profile?.picture || user.image,
            })
            .select()

          if (error) {
            console.error('Error creating/updating user profile:', error)
            // Allow sign-in even if profile creation fails
          }
        } catch (error) {
          console.error('Error during Google sign-in profile creation:', error)
          // Allow sign-in even if there's an error
        }
      }
      return true
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
} satisfies NextAuthConfig