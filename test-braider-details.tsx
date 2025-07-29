"use client"

import { useEffect, useState } from "react"
import { getBraiderById, type Braider } from "@/lib/data-supabase"

export function TestBraiderDetails() {
  const [braider, setBraider] = useState<Braider | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testBraider = async () => {
      try {
        // Using one of the IDs we saw in the debug
        const testId = "947c4e90-7f05-430e-ad89-46125833476b"
        console.log('Testing getBraiderById with ID:', testId)
        
        const result = await getBraiderById(testId)
        console.log('getBraiderById result:', result)
        
        setBraider(result)
      } catch (err) {
        console.error('Test error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    testBraider()
  }, [])

  if (loading) return <div>Loading test...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="p-4 bg-blue-100 rounded mb-4">
      <h3 className="font-bold mb-2">Test Braider Details</h3>
      <pre className="text-xs overflow-auto max-h-96">
        {JSON.stringify(braider, null, 2)}
      </pre>
    </div>
  )
}