"use client"

import { useEffect, useState } from "react"
import { createClient } from '@/lib/supabase/client'

export function DebugBraiders() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const testBraiders = async () => {
      const supabase = createClient()
      
      try {
        console.log('Testing braiders connection...')
        
        // Test 1: Simple braiders query
        const { data: braiders, error: braidersError, count } = await supabase
          .from('braiders')
          .select('*', { count: 'exact' })
          .limit(3)

        console.log('Braiders query result:', { braiders, braidersError, count })

        // Test 2: Users query
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, role')
          .eq('role', 'braider')
          .limit(3)

        console.log('Users query result:', { users, usersError })

        setDebugInfo({
          braiders: {
            data: braiders,
            error: braidersError,
            count
          },
          users: {
            data: users,
            error: usersError
          }
        })

      } catch (error) {
        console.error('Debug error:', error)
        setDebugInfo({ error: error.message })
      } finally {
        setLoading(false)
      }
    }

    testBraiders()
  }, [])

  if (loading) {
    return <div className="p-4 bg-yellow-100 rounded">Loading debug info...</div>
  }

  return (
    <div className="p-4 bg-gray-100 rounded mb-4">
      <h3 className="font-bold mb-2">Debug Info - Braiders Data</h3>
      <pre className="text-xs overflow-auto max-h-96">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  )
}